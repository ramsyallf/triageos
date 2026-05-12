// ============================================================
// TriageOS — Gemini AI Triage Service
// Uses @google/genai SDK with Gemini 2.5 Flash
// ============================================================

import { GoogleGenAI } from '@google/genai'
import type { TriageNote } from '~/types'

// ── Vital Signs Input ──────────────────────────────────────────

export interface VitalSignsInput {
  systolicBP?: number   // mmHg
  diastolicBP?: number  // mmHg
  heartRate?: number   // bpm
  spO2?: number        // % (85-100)
  temperature?: number // °C
  respiratoryRate?: number // /min
  gcs?: number         // 3-15
  painScore?: number   // 0-10
}

// ── SDK Client (singleton) ─────────────────────────────────────

let _ai: GoogleGenAI | null = null

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined
    if (!apiKey) throw new Error('VITE_GEMINI_API_KEY is not set')
    _ai = new GoogleGenAI({ apiKey })
  }
  return _ai
}

// ── Function Declarations — Tool-Calling API ───────────────────

/**
 * get_patient_data — fetches patient demographics & medical history from EMR.
 * Called by the AI when it needs to look up a patient's prior conditions,
 * medications, allergies, or visit history to improve triage accuracy.
 *
 * @param patientId  BPJS ID or MRN used to identify the patient
 */
const GET_PATIENT_DATA_TOOL = {
  name: 'get_patient_data',
  description: 'Fetch patient demographics, medical history, medications, and allergies from the EMR system. Use this when you need prior medical data to improve triage accuracy — especially relevant for patients with comorbidities, chronic conditions, or known drug allergies.',
  parameters: {
    type: 'object',
    properties: {
      patientId: {
        type: 'string',
        description: 'The patient identifier (BPJS ID or MRN)',
      },
    },
    required: ['patientId'],
  },
}

/**
 * get_lab_results — fetches recent laboratory results for a patient.
 * Called by the AI when it wants lab context (CBC, electrolytes, glucose,
 * cardiac enzymes, etc.) to refine ESI level and suggested actions.
 *
 * @param patientId  BPJS ID or MRN
 * @param daysBack  How many days back to look up (default 7, max 30)
 */
const GET_LAB_RESULTS_TOOL = {
  name: 'get_lab_results',
  description: 'Fetch recent laboratory results for a patient (CBC, electrolytes, cardiac enzymes, glucose, urinalysis, etc.). Use this when you need lab data to refine ESI level or suggest specific lab tests — especially useful for patients with suspected infection, metabolic derangement, or cardiac events.',
  parameters: {
    type: 'object',
    properties: {
      patientId: {
        type: 'string',
        description: 'The patient identifier (BPJS ID or MRN)',
      },
      daysBack: {
        type: 'number',
        description: 'Number of days to look back (default 7, max 30)',
      },
    },
    required: ['patientId'],
  },
}

const TOOL_DECLARATIONS = [GET_PATIENT_DATA_TOOL, GET_LAB_RESULTS_TOOL]

// ── Tool Executor (mock — replace with real API calls) ─────────

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

async function executeToolCall(call: ToolCall): Promise<string> {
  const { name, args } = call

  if (name === 'get_patient_data') {
    // TODO (real EMR integration): replace with actual EMR/HIS API call
    // e.g. const data = await fetch(`${EMR_BASE_URL}/patients/${args.patientId}`)
    return JSON.stringify({
      status: 'found',
      patientId: args.patientId,
      demographics: {
        name: '(Data EMR tidak tersedia — mode demo)',
        dob: null,
        bloodType: null,
        allergies: [],
        comorbidities: [],
        currentMedications: [],
      },
    })
  }

  if (name === 'get_lab_results') {
    // TODO (real LIS integration): replace with actual lab system API call
    // e.g. const labs = await fetch(`${LIS_BASE_URL}/patients/${args.patientId}/results?days=${args.daysBack}`)
    return JSON.stringify({
      status: 'found',
      patientId: args.patientId,
      results: [],
      note: 'Data lab tidak tersedia — mode demo. Untuk produksi, hubungkan ke sistem LIS/RS.',
    })
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` })
}

// ── System Prompt — Clinical Triage Assistant ─────────────────

const SYSTEM_PROMPT = `Anda adalah asisten triage klinis berpengalaman untuk Instalasi Gawat Darurat (IGD) rumah sakit umum di Indonesia.

TUGAS ANDA: menganalisis transkrip anamnesis antara perawat dan pasien, gambar lampiran medis (jika ada), dan vital signs (jika tersedia), lalu menghasilkan Triage Note dalam format JSON strict.

TOOL-CALLING (WAJIB digunakan saat diperlukan):
  Anda memiliki akses ke tool berikut untuk mengambil data yang belum tersedia di anamnesis:
  • get_patient_data(patientId) — Ambil data demografi, riwayat penyakit, alergi, dan obat saat ini dari EMR.
    GUNAKAN tool ini saat: pasien memiliki komorbiditas yang relevan (DM, HT, asma), ada kekhawatiran alergi obat, atau Anda perlu konteks riwayat medis untuk menentukan ESI akurat.
  • get_lab_results(patientId, daysBack?) — Ambil hasil lab terbaru (CBC, elektrolit, glukosa, enzim jantung) dari LIS.
    GUNAKAN tool ini saat: curiga infeksi (demam/leukositosis), suspected ACS/MI, gangguan metabolik (glukosa abnormal), atau diperlukan konfirmasi lab sebelum menentukan ESI.

  JIKA tool mengembalikan data kosong/null (mode demo), lanjutkan triage dengan asumsi tidak ada komorbiditas/alergi yang diketahui dan tanpa data lab.

BAHASA:chiefComplaint, onset, suggestedAction, clinicalSummary WAJIB dalam Bahasa Indonesia yang klinis dan formal. symptoms array boleh campur Indonesia-Inggris.

═══════════════════════════════════════════════════
FORMAT JSON OUTPUT (WAJIB 100% — TANPA markdown, TANPA teks lain):
{
  "chiefComplaint": "string — Keluhan utama dalam 1 kalimat klinis formal (Bahasa Indonesia)",
  "onset": "string — Kapan mulai, durasi, dan pencetus (Bahasa Indonesia)",
  "symptoms": ["string — gejala penyerta yang teridentifikasi, klinis spesifik"],
  "riskLevel": "High | Medium | Low",
  "esiLevel": 1 | 2 | 3 | 4 | 5,
  "suggestedAction": "string — Tindakan spesifik perawat IGD (medikasi, lab, imaging, konsultasi) dalam 1-2 kalimat (Bahasa Indonesia)",
  "clinicalSummary": "string — Ringkasan 2-3 kalimat untuk handover ke dokter jaga (Bahasa Indonesia)",
  "confidenceScore": 0-100 (integer, estimasi kepercayaan AI terhadap hasil ini)
}
═══════════════════════════════════════════════════

ATURAN ESI (Emergency Severity Index v4):

  ESI 1 — RESUSCITATION (Ancaman jiwa langsung, SEKARANG):
    • Cardiac arrest / henti jantung
    • Gagal napas akut (RR <8 atau >40, SpO2 <80%)
    • Syok (sistolik <70 mmHg meski sudah resusitasi)
    • Koma / GCS ≤8
    • Stroke dengan deficit neurologis fokal
    • Trauma berat dengan hemodynamic instability
    • AMI dengan cardiac arrest
    • SpO2 <80% yang tidak respon dengan O2
    • Distosia, persalinan di luar RS dengan komplikasi

  ESI 2 — EMERGENT (Risiko tinggi, time-critical <10 menit):
    • Nyeri dada dengan suspected ACS/MI (wajib ECG <5 menit)
    • Stroke dengan NIHSS >5 (wajib CT <25 menit)
    • SpO2 <90% yang gagal dengan O2 sederhana
    • Systolic BP <90 mmHg (hipotensi signifikan)
    • Systolic BP >220 mmHg (hipertensi emergency)
    • Heart Rate >140 bpm atau <50 bpm (kecuali atlet)
    • GCS 9-13
    • Sesak napas berat (tripod position, bicara kata per kata)
    • Kejang yang tidak berhenti (status epileptikus)
    • Perdarahan aktif yang tidak terkontrol
    • Nyeri hebat (VAS 8-10) dengan kecurigaan kondisi gawat
    • Diabetes dengan glukosa <50 atau >400 mg/dL
    • Reaksi alergi anafilaksis (gatal seluruh tubuh, bengkak wajah, sesak)
    • Overdosis obat dengan penurunan kesadaran
    • Hipotermia berat (<28°C)
    • SpO2 <94% pada pasien dengan chest pain

  ESI 3 — URGENT (Stabil tapi butuh MULTIPLE resources, <30 menit):
    • Nyeri sedang (VAS 4-7) — trauma sedang, nyeri perut, kolik
    • Demam dengan tanda infeksi yang jelas (leukositosis, CRP tinggi)
    • Demam + kejang (kejang demam sederhana pada anak >6 bulan)
    • SpO2 90-94% TANPA distres pernapasan berat
    • Heart Rate 100-139 bpm TANPA hipotensi
    • Fraktur tertutup tulang panjang (femur, humerus)
    • Luka bakar degree 2-3 >10% BSA pada dewasa, >5% pada anak
    • Peritonitis (distensi abdomen, rebound tenderness)
    • Appendicitis suspected
    • GI bleed yang stabil (hemodinamik kompensasi)
    • Dehidrasi sedang (mukosa kering, TD menurun sedikit)
    • Systolic BP 90-100 mmHg dengan tanda dehidrasi

  ESI 4 — LESS URGENT (Butuh 1 resource saja, <60 menit):
    • Fraktur sederhana / dislokasi yang dapat direduksi
    • Luka robek yang dapat dijahit (simple laceration)
    • Sprain / strain
    • luka bakar degree 1 atau degree 2 <5% BSA
    • Abses kulit yang perlu insisi & drainase
    • Vertigo perifer stabil (tanpa tanda neurologis fokal)
    • Nyeri pinggang akut tanpa tanda cauda equina
    • Sakit tenggorokan, ISPA ringan
    • Konjungtivitis
    • Otitis media / externa
    • Infeksi saluran kemih tanpa komplikasi pada dewasa

  ESI 5 — NON-URGENT (Tidak butuh resource, bisa tunggu):
    • Kontrol rutin, penggantian balutan
    • Surat keterangan sehat / sakit
    • Pelepasan jahitan
    • Keluhan kronik stabil (follow-up)
    • Batuk pilek biasa tanpa komplikasi
    • Kontrol gula darah rutin (diabetes terkontrol)
    • Hipertensi stage 1 tanpa gejala (BP <180/120)

═══════════════════════════════════════════════════

NEGATION RULES (SANGAT PENTING):
  • "TIDAK ada" nyeri dada → TIDAK boleh naikkan ESI karena nyeri dada
  • "BUKAN", "NEGATIF", "GATAU" → gejala tersebut TIDAK ada
  • "SUDAH TIDAK" atau "SUDAH MEMBAIK" → interpretasi sebagai improve
  • "Biasanya", "kadang-kadang", "jarang" → GIANTI jadi intensitas ringan

COMORBIDITY ADJUSTMENT:
  • Diabetes + luka → naikkan 1 level (lebih tinggi urgensi)
  • Hipertensi + nyeri dada → kuatkan curiga ACS
  • Asma/PPOK + sesak → naikkan 1 level
  • Kehamilan trimester 3 + nyeri perut → naikkan 1 level
  • Immunocompromised + demam → naikkan 1 level
  • Geriatri (>65 th) + trauma/kebas → naikkan 1 level

VITAL SIGNS INTERPRETATION:
  • SpO2 <90%: kuatkan ESI → ESI 2
  • Systolic <90: ESI 2 (hemodynamic instability)
  • Systolic >220: ESI 2 (hypertensive emergency)
  • HR >140 atau <50: ESI 2 (arrhythmia risk)
  • GCS <14: ESI 2 (neurologic compromise)
  • Temp >41°C: ESI 3 (hyperpyrexia)
  • Temp >38.5°C + immunocompromised: naikkan 1 level
  • RR >30 atau <8: ESI 2 (respiratory failure)
  • Pain score 8-10 TANPA threat to life: ESI 3
  • Pain score 8-10 DENGAN threat to life signs: ESI 2

CONFIDENCE SCORE:
  • 95-100: Full history + vitals + images → AI sangat yakin
  • 80-94: Riwayat lengkap, vitals ada, no images
  • 60-79: Riwayat cukup, vitals sebagian ada
  • 40-59: Riwayat kurang lengkap, perlu konfirmasi dokter
  • <40: Data sangat minim, AI spekulatif

PENTING: response HANYA berupa JSON object. Tidak boleh ada teks lain di luar JSON.`

// ════════════════════════════════════════════════════════════════

// ── JSON Parser ───────────────────────────────────────────────

function validateEsiLevel(note: TriageNote): void {
  if (!note.esiLevel || ![1, 2, 3, 4, 5].includes(note.esiLevel)) {
    throw new Error(`Invalid ESI level from AI: ${JSON.stringify(note).slice(0, 100)}`)
  }
}

function parseResponse(text: string): TriageNote {
  const cleaned = text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned) as TriageNote
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0]) as TriageNote
      } catch {
        // fall through
      }
    }
    throw new Error(`Tidak dapat memproses respons AI: "${cleaned.slice(0, 120)}..."`)
  }
}

// ── Public API ────────────────────────────────────────────────

export interface TriageResult {
  note: TriageNote
}

/**
 * Generate a clinical triage note using Gemini 2.5 Flash.
 *
 * Gemini 2.5 Flash MENANGANI SEMUA skenario klinis.
 * Tidak ada mock fallback — API key WAJIB diset di .env
 *
 * @param transcript   Full anamnesis transcript from speech + manual input
 * @param imageBase64s Optional array of base64 image URLs (wounds, EKG, X-ray)
 * @param vitals       Optional vital signs for clinical accuracy
 * @throws Error jika VITE_GEMINI_API_KEY tidak diset
 */
export async function generateTriageNote(
  transcript: string,
  imageBase64s: string[] = [],
  vitals?: VitalSignsInput,
): Promise<TriageResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  if (!apiKey) {
    throw new Error(
      '[GeminiService] VITE_GEMINI_API_KEY belum diset.\n' +
      'Triage AI memerlukan API key Gemini. Silakan:\n' +
      '1. Buat file .env di root project\n' +
      '2. Tambahkan: VITE_GEMINI_API_KEY=your_api_key_here\n' +
      '3. Dapatkan API key di: https://makersuite.google.com/app/apikey\n' +
      '4. Restart dev server (npm run dev)'
    )
  }

  try {
    const ai = getAI()

    // Build initial contents — system prompt + anamnesis data
    const contents: any[] = [{ role: 'user', parts: [{ text: SYSTEM_PROMPT }] }]

    // Add vital signs context if provided
    let vitalsContext = ''
    if (vitals) {
      const v = vitals
      const parts: string[] = []
      if (v.systolicBP !== undefined) parts.push(`TD: ${v.systolicBP}/${v.diastolicBP ?? '?'} mmHg`)
      if (v.heartRate !== undefined) parts.push(`HR: ${v.heartRate} bpm`)
      if (v.spO2 !== undefined) parts.push(`SpO2: ${v.spO2}%`)
      if (v.temperature !== undefined) parts.push(`Suhu: ${v.temperature}°C`)
      if (v.respiratoryRate !== undefined) parts.push(`RR: ${v.respiratoryRate}/min`)
      if (v.gcs !== undefined) parts.push(`GCS: ${v.gcs}/15`)
      if (v.painScore !== undefined) parts.push(`Skor Nyeri: ${v.painScore}/10`)
      vitalsContext = `\n\nVITAL SIGNS (WAJIB digunakan untuk menentukan ESI):\n${parts.join(', ')}`
    }

    const transcriptPart = `\n\n═══════════════════════════════════════════════════\nTRANSRIP ANAMNESIS TRIASE:\n${transcript || '(tidak ada transkrip lisan — gunakan hanya gambar dan vital signs jika tersedia)'}${vitalsContext}\n═══════════════════════════════════════════════════\n`

    contents[0].parts.push({ text: transcriptPart })

    // Add images (multimodal) to initial contents
    for (const imageBase64 of imageBase64s) {
      if (!imageBase64) continue
      const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'))
      const base64Data = imageBase64.substring(imageBase64.indexOf(',') + 1)
      contents[0].parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: base64Data,
        },
      })
    }

    // ── Tool-Calling Loop ──────────────────────────────────────
    // Gemini may call get_patient_data and/or get_lab_results before
    // producing the final JSON. We handle up to 3 rounds of tool calls.
    const MAX_TOOL_ROUNDS = 3

    let currentContents = [...contents]

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: currentContents,
        config: {
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }] as any,
          responseMimeType: 'application/json',
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
      })

      // No tool calls — we have the final answer
      if (!response.functionCalls || response.functionCalls.length === 0) {
        if (!response.text) {
          throw new Error('Gemini returned empty response')
        }
        const note = parseResponse(response.text)
        validateEsiLevel(note)
        return { note }
      }

      // Execute each tool call and feed results back to Gemini
      for (const call of response.functionCalls) {
        const result = await executeToolCall({
          id: call.id ?? `call-${round}`,
          name: call.name ?? '',
          args: call.args ?? {},
        })

        // Append model's tool call + our result to conversation history
        currentContents.push({
          role: 'model',
          parts: [{ functionCall: { name: call.name ?? '', args: call.args ?? {} } }],
        })
        currentContents.push({
          role: 'user',
          parts: [{ functionResponse: { name: call.name ?? '', response: JSON.parse(result) } }],
        })
      }
      // Continue loop to get final JSON response
    }

    throw new Error('AI tidak menyelesaikan respons setelah beberapa percobaan. Silakan coba lagi.')
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(
      `[GeminiService] Gemini API call gagal: ${message}\n` +
      'Pastikan VITE_GEMINI_API_KEY valid dan quota masih tersedia.'
    )
  }
}
