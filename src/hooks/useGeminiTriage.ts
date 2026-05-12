import { useCallback, useState } from 'react'
import { generateTriageNote } from '~/services/gemini'
import type { TriageNote, VitalSignsInput } from '~/types'

// ── User-Friendly Error Messages ─────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  '429': 'Kuota AI habis hari ini. Tunggu beberapa saat dan coba lagi, atau restart browser.',
  '429_RATE_LIMIT': 'Terlalu banyak permintaan. Tunggu 1 menit sebelum mencoba lagi.',
  '403': 'API key tidak valid. Hubungi developer untuk verifikasi.',
  'INVALID_API': 'API key tidak valid atau sudah expired. Hubungi developer.',
  'NETWORK': 'Tidak ada koneksi internet. Periksa jaringan Anda dan coba lagi.',
  'FAILED_FETCH': 'Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.',
  'EMPTY_RESPONSE': 'AI tidak memberikan respons. Silakan coba lagi.',
  'INVALID_JSON': 'Respons AI tidak valid. Silakan coba lagi.',
  'INVALID_ESI': 'Hasil triage tidak valid. Silakan coba lagi dengan data yang lebih lengkap.',
  'QUOTA': 'Kuota harian sudah habis. Anda dapat mencoba lagi besok.',
  'RESOURCE_EXHAUSTED': 'Kuota habis. Tunggu sebentar sebelum mencoba lagi.',
  'DEFAULT': 'Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.',
}

// Check if error message contains specific error code patterns
function getFriendlyMessage(errorMessage: string): string {
  const lower = errorMessage.toLowerCase()

  // Rate limit / Quota exceeded
  if (lower.includes('429') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('resource_exhausted')) {
    return ERROR_MESSAGES['429']
  }

  // API Key issues
  if (lower.includes('403') || lower.includes('api key') || lower.includes('invalid') || lower.includes('forbidden')) {
    return ERROR_MESSAGES['INVALID_API']
  }

  // Network errors
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch') || lower.includes('connection')) {
    return ERROR_MESSAGES['NETWORK']
  }

  // Empty response
  if (lower.includes('empty') || lower.includes('no response')) {
    return ERROR_MESSAGES['EMPTY_RESPONSE']
  }

  // Invalid JSON
  if (lower.includes('json') || lower.includes('parse')) {
    return ERROR_MESSAGES['INVALID_JSON']
  }

  // Invalid ESI
  if (lower.includes('esi') || lower.includes('invalid level')) {
    return ERROR_MESSAGES['INVALID_ESI']
  }

  // Default fallback
  return ERROR_MESSAGES['DEFAULT']
}

interface UseGeminiTriageReturn {
  generate: (
    transcript: string,
    imageBase64s: string[],
    vitals?: VitalSignsInput
  ) => Promise<{ result: TriageNote | null }>
  result: TriageNote | null
  setResult: (note: TriageNote | null) => void
  loading: boolean
  error: string | null
}

export function useGeminiTriage(): UseGeminiTriageReturn {
  const [result, setResult] = useState<TriageNote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (
      transcript: string,
      imageBase64s: string[],
      vitals?: VitalSignsInput
    ): Promise<{ result: TriageNote | null }> => {
      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const { note } = await generateTriageNote(
          transcript,
          imageBase64s,
          vitals
        )
        setResult(note)
        return { result: note }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        const friendlyMessage = getFriendlyMessage(message)
        setError(friendlyMessage)
        return { result: null }
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { generate, result, setResult, loading, error }
}
