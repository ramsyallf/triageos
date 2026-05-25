import { useAction } from 'convex/react'
import { useCallback, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { TriageNote, VitalSignsInput } from '~/types'

const ERROR_MESSAGES: Record<string, string> = {
  BAD_REQUEST: 'Konfigurasi request AI tidak valid. Periksa model dan payload.',
  AUTH: 'API key OpenRouter tidak valid atau tidak punya akses.',
  CREDITS: 'Kredit OpenRouter tidak cukup. Tambahkan kredit atau gunakan model gratis yang tersedia.',
  MODEL: 'Model OpenRouter tidak ditemukan atau tidak tersedia untuk akun ini.',
  RATE_LIMIT: 'Terlalu banyak permintaan ke AI provider. Tunggu sebentar sebelum mencoba lagi.',
  UPSTREAM: 'Layanan AI provider sedang bermasalah. Coba lagi beberapa saat lagi.',
  NETWORK: 'Tidak dapat terhubung ke server AI. Periksa koneksi internet Anda.',
  EMPTY_RESPONSE: 'AI tidak memberikan respons. Silakan coba lagi.',
  INVALID_JSON: 'Respons AI tidak valid. Silakan coba lagi.',
  INVALID_ESI: 'Hasil triage tidak valid. Silakan coba lagi dengan data yang lebih lengkap.',
  CONFIG: 'OpenRouter belum dikonfigurasi. Set OPENROUTER_API_KEY di Convex environment.',
  DEFAULT: 'Terjadi kesalahan pada sistem AI. Silakan coba beberapa saat lagi.',
}

function getProviderStatus(errorMessage: string): number | null {
  const match = errorMessage.match(/AI_PROVIDER_STATUS:(\d{3})/)
  return match ? Number(match[1]) : null
}

function getFriendlyMessage(errorMessage: string): string {
  const lower = errorMessage.toLowerCase()
  const status = getProviderStatus(errorMessage)

  if (status === 400 || status === 422) return ERROR_MESSAGES.BAD_REQUEST
  if (status === 401 || status === 403) return ERROR_MESSAGES.AUTH
  if (status === 402) return ERROR_MESSAGES.CREDITS
  if (status === 404) return ERROR_MESSAGES.MODEL
  if (status === 408 || status === 429) return ERROR_MESSAGES.RATE_LIMIT
  if (status && status >= 500) return ERROR_MESSAGES.UPSTREAM
  if (lower.includes('openrouter_api_key_missing')) return ERROR_MESSAGES.CONFIG
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('connection')) return ERROR_MESSAGES.NETWORK
  if (lower.includes('empty_response') || lower.includes('empty')) return ERROR_MESSAGES.EMPTY_RESPONSE
  if (lower.includes('invalid_json') || lower.includes('json') || lower.includes('parse')) return ERROR_MESSAGES.INVALID_JSON
  if (lower.includes('invalid_esi') || lower.includes('esi')) return ERROR_MESSAGES.INVALID_ESI
  return ERROR_MESSAGES.DEFAULT
}

interface UseAITriageReturn {
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

export function useAITriage(staffUserId: Id<'users'>): UseAITriageReturn {
  const generateTriageNote = useAction((api as any).ai.generateTriageNote)
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
        const response = await generateTriageNote({
          staffUserId,
          transcript,
          imageBase64s,
          vitals,
        })
        const note = response.note as TriageNote
        setResult(note)
        return { result: note }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        const friendlyMessage = getFriendlyMessage(message)
        console.error('[useAITriage] generateTriageNote failed', {
          message,
          status: getProviderStatus(message),
          raw: message,
        })
        const devSuffix = import.meta.env.DEV ? ` (${message.slice(0, 1000)})` : ''
        setError(`${friendlyMessage}${devSuffix}`)
        return { result: null }
      } finally {
        setLoading(false)
      }
    },
    [generateTriageNote, staffUserId]
  )

  return { generate, result, setResult, loading, error }
}
