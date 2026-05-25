import { v } from "convex/values"
import { action } from "./_generated/server"
import { api } from "./_generated/api"

const DEFAULT_OPENROUTER_MODEL = "google/gemini-3.5-flash"
const DEFAULT_OPENROUTER_FALLBACK_MODEL = "google/gemini-3.5-flash"
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const TRIAGE_NOTE_JSON_SCHEMA = {
  name: "triage_note",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      chiefComplaint: { type: "string" },
      onset: { type: "string" },
      symptoms: {
        type: "array",
        items: { type: "string" },
      },
      riskLevel: {
        type: "string",
        enum: ["High", "Medium", "Low"],
      },
      esiLevel: {
        type: "integer",
        enum: [1, 2, 3, 4, 5],
      },
      suggestedAction: { type: "string" },
      clinicalSummary: { type: "string" },
      confidenceScore: {
        type: "integer",
        minimum: 0,
        maximum: 100,
      },
    },
    required: [
      "chiefComplaint",
      "onset",
      "symptoms",
      "riskLevel",
      "esiLevel",
      "suggestedAction",
      "clinicalSummary",
      "confidenceScore",
    ],
  },
} as const

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
  "confidenceScore": 95
}

confidenceScore wajib berupa angka persentase integer 0 sampai 100. Contoh benar: 95. Jangan gunakan skala desimal seperti 0.95.

Jika gambar dilampirkan:
- Analisis hanya temuan visual yang benar-benar tampak.
- Untuk mata, perhatikan kemerahan konjungtiva, sekret/discharge, bengkak, kekeruhan kornea, tanda trauma, dugaan benda asing, dan red flag risiko penglihatan.
- Jangan menyimpulkan diagnosis pasti dari gambar saja; gabungkan dengan anamnesis dan vital signs.

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

type OpenRouterUserContent = Array<
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
>

type OpenRouterAttempt =
  | "primary"
  | "primary-no-response-format"
  | "primary-json-repair"
  | "fallback"
  | "fallback-no-response-format"
  | "fallback-json-repair"

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

function summarizeImages(imageBase64s: string[]) {
  return imageBase64s.filter(Boolean).map((image, index) => {
    const match = image.match(/^data:([^;]+);base64,(.*)$/)
    const encoded = match?.[2] ?? image
    return {
      index,
      mime: match?.[1] ?? "unknown",
      prefix: image.slice(0, 32),
      approxBytes: Math.round((encoded.length * 3) / 4),
    }
  })
}

function getProviderRawPayload(payload: string): string | null {
  try {
    const data = JSON.parse(payload)
    const raw = data?.error?.metadata?.raw
    return typeof raw === "string" ? raw : null
  } catch {
    return null
  }
}

function bestErrorPayload(payload: string) {
  return getProviderRawPayload(payload) ?? payload
}

function logOpenRouterAttempt(attempt: OpenRouterAttempt, details: {
  model: string
  responseFormat: boolean
  transcriptLength: number
  imageSummaries: ReturnType<typeof summarizeImages>
  vitalsKeys: string[]
}) {
  console.log("[ai:generateTriageNote] OpenRouter request", {
    attempt,
    model: details.model,
    responseFormat: details.responseFormat,
    transcriptLength: details.transcriptLength,
    imageCount: details.imageSummaries.length,
    images: details.imageSummaries,
    vitalsKeys: details.vitalsKeys,
  })
}

function logOpenRouterResponse(attempt: OpenRouterAttempt, response: Response, payload: string) {
  const providerRaw = getProviderRawPayload(payload)
  console.log("[ai:generateTriageNote] OpenRouter response", {
    attempt,
    status: response.status,
    ok: response.ok,
    payloadPreview: payload.slice(0, 4000),
    providerRawPreview: providerRaw?.slice(0, 4000) ?? null,
  })
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

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeRiskLevel(value: unknown): TriageNote["riskLevel"] | "" {
  if (typeof value !== "string") return ""
  const normalized = value.trim().toLowerCase()
  if (normalized === "high") return "High"
  if (normalized === "medium") return "Medium"
  if (normalized === "low") return "Low"
  return ""
}

function validateNote(note: TriageNote) {
  if (!note.chiefComplaint || !note.onset || !Array.isArray(note.symptoms) || !note.suggestedAction || !note.clinicalSummary) {
    throw new Error("INVALID_JSON: Missing required triage fields")
  }
  if (!["High", "Medium", "Low"].includes(note.riskLevel)) {
    throw new Error("INVALID_JSON: Invalid riskLevel")
  }
  if (![1, 2, 3, 4, 5].includes(note.esiLevel)) {
    throw new Error("INVALID_ESI: Invalid ESI level")
  }
}

function normalizeTriageNote(note: TriageNote): TriageNote {
  const esiLevel = Number(note.esiLevel)
  const symptoms = Array.isArray(note.symptoms)
    ? note.symptoms.map((symptom) => normalizeText(symptom)).filter(Boolean)
    : []

  return normalizeConfidenceScore({
    ...note,
    chiefComplaint: normalizeText(note.chiefComplaint),
    onset: normalizeText(note.onset),
    symptoms,
    riskLevel: normalizeRiskLevel(note.riskLevel) as TriageNote["riskLevel"],
    esiLevel: esiLevel as TriageNote["esiLevel"],
    suggestedAction: normalizeText(note.suggestedAction),
    clinicalSummary: normalizeText(note.clinicalSummary),
  })
}

function normalizeConfidenceScore(note: TriageNote): TriageNote {
  if (note.confidenceScore === undefined) return note
  const raw = Number(note.confidenceScore)
  if (!Number.isFinite(raw)) {
    return { ...note, confidenceScore: undefined }
  }
  const percent = raw > 0 && raw <= 1 ? raw * 100 : raw
  return {
    ...note,
    confidenceScore: Math.round(Math.max(0, Math.min(100, percent))),
  }
}

function getOpenRouterMessageContent(payload: string) {
  try {
    const data = JSON.parse(payload)
    const content = data?.choices?.[0]?.message?.content
    return typeof content === "string" ? content : ""
  } catch {
    return ""
  }
}

function parseOpenRouterPayload(payload: string, model: string) {
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

  const note = normalizeTriageNote(parseResponse(content))
  validateNote(note)
  return { note, provider: "openrouter", model: data.model ?? model }
}

function buildJsonRepairContent(previousOutput: string): OpenRouterUserContent {
  return [
    {
      type: "text",
      text: `Perbaiki output AI berikut menjadi satu JSON TriageNote valid sesuai schema. Jangan analisis ulang kasus klinis. Jangan tambah markdown, komentar, atau teks di luar JSON. Trim semua string. riskLevel harus "High", "Medium", atau "Low". esiLevel harus integer 1 sampai 5. confidenceScore harus integer 0 sampai 100.\n\nOUTPUT_SEBELUMNYA:\n${previousOutput.slice(0, 6000)}`,
    },
  ]
}

async function requestOpenRouter(apiKey: string, model: string, userContent: OpenRouterUserContent, options: { responseFormat?: boolean } = { responseFormat: true }) {
  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.2,
    top_p: 0.95,
    max_tokens: 2048,
    ...(options.responseFormat
      ? {
          response_format: {
            type: "json_schema",
            json_schema: TRIAGE_NOTE_JSON_SCHEMA,
          },
        }
      : {}),
  }

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://triageos.local",
      "X-Title": "TriageOS",
    },
    body: JSON.stringify(body),
  })

  const payload = await response.text()
  return { response, payload }
}

async function requestOpenRouterWithTrace(apiKey: string, model: string, userContent: OpenRouterUserContent, details: {
  attempt: OpenRouterAttempt
  responseFormat: boolean
  transcriptLength: number
  imageSummaries: ReturnType<typeof summarizeImages>
  vitalsKeys: string[]
}) {
  logOpenRouterAttempt(details.attempt, {
    model,
    responseFormat: details.responseFormat,
    transcriptLength: details.transcriptLength,
    imageSummaries: details.imageSummaries,
    vitalsKeys: details.vitalsKeys,
  })

  const result = await requestOpenRouter(apiKey, model, userContent, { responseFormat: details.responseFormat })
  logOpenRouterResponse(details.attempt, result.response, result.payload)
  return result
}

async function repairOpenRouterJson(apiKey: string, model: string, payload: string, details: {
  attempt: Extract<OpenRouterAttempt, "primary-json-repair" | "fallback-json-repair">
}) {
  const previousOutput = getOpenRouterMessageContent(payload) || bestErrorPayload(payload)
  const repairContent = buildJsonRepairContent(previousOutput)
  let result = await requestOpenRouterWithTrace(apiKey, model, repairContent, {
    attempt: details.attempt,
    responseFormat: true,
    transcriptLength: previousOutput.length,
    imageSummaries: [],
    vitalsKeys: [],
  })
  if (result.response.status === 400) {
    result = await requestOpenRouterWithTrace(apiKey, model, repairContent, {
      attempt: details.attempt,
      responseFormat: false,
      transcriptLength: previousOutput.length,
      imageSummaries: [],
      vitalsKeys: [],
    })
  }
  if (!result.response.ok) {
    throw new Error(`AI_PROVIDER_STATUS:${result.response.status}:${bestErrorPayload(result.payload).slice(0, 4000)}`)
  }
  return parseOpenRouterPayload(result.payload, model)
}

async function parsePayloadWithRepair(apiKey: string, model: string, payload: string, repairAttempt: Extract<OpenRouterAttempt, "primary-json-repair" | "fallback-json-repair">) {
  try {
    return parseOpenRouterPayload(payload, model)
  } catch (error) {
    console.log("[ai:generateTriageNote] JSON parse failed; attempting repair", {
      model,
      repairAttempt,
      errorMessage: error instanceof Error ? error.message : String(error),
      contentPreview: getOpenRouterMessageContent(payload).slice(0, 1000),
    })
    return await repairOpenRouterJson(apiKey, model, payload, { attempt: repairAttempt })
  }
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
    const imageSummaries = summarizeImages(args.imageBase64s)
    const vitalsKeys = args.vitals ? Object.keys(args.vitals).filter((key) => args.vitals?.[key as keyof VitalSignsInput] !== undefined) : []
    const userContent: OpenRouterUserContent = [
      {
        type: "text",
        text: `TRANSKRIP ANAMNESIS:\n${args.transcript || "(tidak ada transkrip lisan)"}${buildVitalsContext(args.vitals)}\n\nJumlah gambar terlampir: ${args.imageBase64s.filter(Boolean).length}.\nKembalikan hanya JSON TriageNote sesuai schema. confidenceScore harus integer 0-100, misalnya 95, bukan 0.95.`,
      },
      ...args.imageBase64s
        .filter(Boolean)
        .map((url) => ({ type: "image_url" as const, image_url: { url } })),
    ]

    const fallbackAvailable = Boolean(fallbackModel && fallbackModel !== primaryModel)
    let usedModel = primaryModel
    let usedFallback = false
    let { response, payload } = await requestOpenRouterWithTrace(apiKey, primaryModel, userContent, {
      attempt: "primary",
      responseFormat: true,
      transcriptLength: args.transcript.length,
      imageSummaries,
      vitalsKeys,
    })
    if (response.status === 400) {
      const retryResult = await requestOpenRouterWithTrace(apiKey, primaryModel, userContent, {
        attempt: "primary-no-response-format",
        responseFormat: false,
        transcriptLength: args.transcript.length,
        imageSummaries,
        vitalsKeys,
      })
      if (retryResult.response.ok) {
        response = retryResult.response
        payload = retryResult.payload
      }
    }

    if (!response.ok && fallbackModel && fallbackModel !== primaryModel) {
      const fallbackResult = await requestOpenRouterWithTrace(apiKey, fallbackModel, userContent, {
        attempt: "fallback",
        responseFormat: true,
        transcriptLength: args.transcript.length,
        imageSummaries,
        vitalsKeys,
      })
      if (fallbackResult.response.ok) {
        usedModel = fallbackModel
        usedFallback = true
        response = fallbackResult.response
        payload = fallbackResult.payload
      } else if (fallbackResult.response.status === 400) {
        const fallbackRetryResult = await requestOpenRouterWithTrace(apiKey, fallbackModel, userContent, {
          attempt: "fallback-no-response-format",
          responseFormat: false,
          transcriptLength: args.transcript.length,
          imageSummaries,
          vitalsKeys,
        })
        if (fallbackRetryResult.response.ok) {
          usedModel = fallbackModel
          usedFallback = true
          response = fallbackRetryResult.response
          payload = fallbackRetryResult.payload
        } else {
          response = fallbackRetryResult.response
          payload = fallbackRetryResult.payload
        }
      }
    }

    if (!response.ok) {
      throw new Error(`AI_PROVIDER_STATUS:${response.status}:${bestErrorPayload(payload).slice(0, 4000)}`)
    }

    try {
      return await parsePayloadWithRepair(apiKey, usedModel, payload, usedFallback ? "fallback-json-repair" : "primary-json-repair")
    } catch (primaryError) {
      if (!fallbackAvailable || usedFallback) throw primaryError

      const fallbackResult = await requestOpenRouterWithTrace(apiKey, fallbackModel, userContent, {
        attempt: "fallback",
        responseFormat: true,
        transcriptLength: args.transcript.length,
        imageSummaries,
        vitalsKeys,
      })
      if (!fallbackResult.response.ok) {
        if (fallbackResult.response.status === 400) {
          const fallbackRetryResult = await requestOpenRouterWithTrace(apiKey, fallbackModel, userContent, {
            attempt: "fallback-no-response-format",
            responseFormat: false,
            transcriptLength: args.transcript.length,
            imageSummaries,
            vitalsKeys,
          })
          if (fallbackRetryResult.response.ok) {
            return await parsePayloadWithRepair(apiKey, fallbackModel, fallbackRetryResult.payload, "fallback-json-repair")
          }
          throw new Error(`AI_PROVIDER_STATUS:${fallbackRetryResult.response.status}:${bestErrorPayload(fallbackRetryResult.payload).slice(0, 4000)}`)
        }
        throw new Error(`AI_PROVIDER_STATUS:${fallbackResult.response.status}:${bestErrorPayload(fallbackResult.payload).slice(0, 4000)}`)
      }
      return await parsePayloadWithRepair(apiKey, fallbackModel, fallbackResult.payload, "fallback-json-repair")
    }
  },
})
