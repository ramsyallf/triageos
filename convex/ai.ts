import { v } from "convex/values"
import { action } from "./_generated/server"
import { api } from "./_generated/api"

const DEFAULT_OPENROUTER_MODEL = "google/gemma-4-26b-a4b-it:free"
const DEFAULT_OPENROUTER_FALLBACK_MODEL = "google/gemini-3.1-flash-lite-preview"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const vitalSigns = v.object({
  systolicBP: v.optional(v.number()),
  diastolicBP: v.optional(v.number()),
  heartRate: v.optional(v.number()),
  spO2: v.optional(v.number()),
  temperature: v.optional(v.number()),
  respiratoryRate: v.optional(v.number()),
  gcs: v.optional(v.number()),
  painScore: v.optional(v.number()),
})

const SYSTEM_PROMPT = `Anda adalah asisten triage klinis untuk Instalasi Gawat Darurat (IGD) rumah sakit umum di Indonesia.

Tugas Anda: analisis anamnesis, vital signs, dan lampiran gambar bila ada, lalu hasilkan Triage Note JSON strict untuk clinical decision support. Ini bukan diagnosis final.

Bahasa:
- chiefComplaint, onset, suggestedAction, dan clinicalSummary wajib dalam Bahasa Indonesia formal-klinis.
- symptoms boleh memakai istilah klinis Indonesia-Inggris.

Data EMR/LIS eksternal belum tersedia di mode demo. Jangan mengarang riwayat penyakit, alergi, obat, lab, atau integrasi rumah sakit yang tidak diberikan.

Format output wajib JSON object saja, tanpa markdown dan tanpa teks tambahan:
{
  "chiefComplaint": "string",
  "onset": "string",
  "symptoms": ["string"],
  "riskLevel": "High | Medium | Low",
  "esiLevel": 1 | 2 | 3 | 4 | 5,
  "suggestedAction": "string",
  "clinicalSummary": "string",
  "confidenceScore": 0
}

Aturan ESI ringkas:
- ESI 1: ancaman jiwa langsung, resusitasi sekarang, henti jantung/napas, syok berat, GCS <= 8, gagal napas ekstrem.
- ESI 2: risiko tinggi/time-critical, nyeri dada curiga ACS, stroke akut, SpO2 < 90%, TD sistolik < 90 atau > 220, HR > 140 atau < 50, GCS 9-13, sesak berat, perdarahan aktif, anafilaksis, overdosis dengan penurunan kesadaran.
- ESI 3: stabil tetapi butuh multiple resources, nyeri sedang, infeksi jelas, SpO2 90-94 tanpa distres berat, HR 100-139 tanpa hipotensi, fraktur tulang panjang tertutup, dehidrasi sedang, GI bleed stabil.
- ESI 4: less urgent, butuh satu resource, luka jahit sederhana, sprain/strain, abses kulit, ISK tanpa komplikasi, ISPA ringan.
- ESI 5: non-urgent, tidak butuh resource, kontrol rutin, surat keterangan, pelepasan jahitan, keluhan kronik stabil.

Gunakan negasi dengan hati-hati: "tidak ada nyeri dada" berarti jangan menaikkan ESI karena nyeri dada. Vital signs harus memengaruhi ESI bila tersedia.`

type TriageNote = {
  chiefComplaint: string
  onset: string
  symptoms: string[]
  riskLevel: "High" | "Medium" | "Low"
  esiLevel: 1 | 2 | 3 | 4 | 5
  suggestedAction: string
  clinicalSummary: string
  confidenceScore?: number
}

type VitalSignsInput = {
  systolicBP?: number
  diastolicBP?: number
  heartRate?: number
  spO2?: number
  temperature?: number
  respiratoryRate?: number
  gcs?: number
  painScore?: number
}

function buildVitalsContext(vitals?: VitalSignsInput) {
  if (!vitals) return ""
  const parts: string[] = []
  if (vitals.systolicBP !== undefined) parts.push(`TD: ${vitals.systolicBP}/${vitals.diastolicBP ?? "?"} mmHg`)
  if (vitals.heartRate !== undefined) parts.push(`HR: ${vitals.heartRate} bpm`)
  if (vitals.spO2 !== undefined) parts.push(`SpO2: ${vitals.spO2}%`)
  if (vitals.temperature !== undefined) parts.push(`Suhu: ${vitals.temperature} C`)
  if (vitals.respiratoryRate !== undefined) parts.push(`RR: ${vitals.respiratoryRate}/min`)
  if (vitals.gcs !== undefined) parts.push(`GCS: ${vitals.gcs}/15`)
  if (vitals.painScore !== undefined) parts.push(`Skor Nyeri: ${vitals.painScore}/10`)
  return parts.length ? `\n\nVITAL SIGNS:\n${parts.join(", ")}` : ""
}

function parseResponse(text: string): TriageNote {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim()

  try {
    return JSON.parse(cleaned) as TriageNote
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as TriageNote
    throw new Error(`INVALID_JSON: ${cleaned.slice(0, 180)}`)
  }
}

function validateNote(note: TriageNote) {
  if (!note.chiefComplaint || !note.onset || !Array.isArray(note.symptoms)) {
    throw new Error("INVALID_JSON: Missing required triage fields")
  }
  if (!["High", "Medium", "Low"].includes(note.riskLevel)) {
    throw new Error("INVALID_JSON: Invalid riskLevel")
  }
  if (![1, 2, 3, 4, 5].includes(note.esiLevel)) {
    throw new Error("INVALID_ESI: Invalid ESI level")
  }
}

async function requestOpenRouter(apiKey: string, model: string, userContent: Array<
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
>) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://triageos.local",
      "X-Title": "TriageOS",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.2,
      top_p: 0.95,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  })

  const payload = await response.text()
  return { response, payload }
}

export const generateTriageNote = action({
  args: {
    staffUserId: v.id("users"),
    transcript: v.string(),
    imageBase64s: v.array(v.string()),
    vitals: v.optional(vitalSigns),
  },
  handler: async (ctx, args) => {
    const staff = await ctx.runQuery(api.users.getCurrentUser, { staffUserId: args.staffUserId })
    if (!staff) throw new Error("UNAUTHENTICATED: Sesi staf tidak valid")

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) throw new Error("OPENROUTER_API_KEY_MISSING: OPENROUTER_API_KEY belum diset di Convex environment")

    const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
    const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_OPENROUTER_FALLBACK_MODEL
    const userContent: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: `TRANSKRIP ANAMNESIS:\n${args.transcript || "(tidak ada transkrip lisan)"}${buildVitalsContext(args.vitals)}\n\nKembalikan hanya JSON TriageNote sesuai schema.`,
      },
      ...args.imageBase64s
        .filter(Boolean)
        .map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ]

    let usedModel = primaryModel
    let { response, payload } = await requestOpenRouter(apiKey, primaryModel, userContent)
    if (!response.ok && fallbackModel && fallbackModel !== primaryModel) {
      const fallbackResult = await requestOpenRouter(apiKey, fallbackModel, userContent)
      if (fallbackResult.response.ok) {
        usedModel = fallbackModel
        response = fallbackResult.response
        payload = fallbackResult.payload
      }
    }

    if (!response.ok) {
      throw new Error(`AI_PROVIDER_STATUS:${response.status}:${payload.slice(0, 1000)}`)
    }

    let data: any
    try {
      data = JSON.parse(payload)
    } catch {
      throw new Error(`AI_PROVIDER_BAD_RESPONSE:${payload.slice(0, 1000)}`)
    }

    const content = data?.choices?.[0]?.message?.content
    if (!content || typeof content !== "string") {
      throw new Error(`EMPTY_RESPONSE:${JSON.stringify(data).slice(0, 1000)}`)
    }

    const note = parseResponse(content)
    validateNote(note)
    return { note, provider: "openrouter", model: data.model ?? usedModel }
  },
})
