import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { SpeechState } from '~/types'

// ── Context Value ────────────────────────────────────────────

interface SpeechContextValue extends SpeechState {
  start: () => void
  stop: () => void
  toggle: () => void
  reset: () => void
}

const SpeechContext = createContext<SpeechContextValue | null>(null)

// ── Browser capability helpers ───────────────────────────────

function getBrowserCapabilities(): { isSupported: boolean; isSafari: boolean; isFirefox: boolean } {
  const sr =
    typeof window !== 'undefined' &&
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition)

  if (!sr) {
    return { isSupported: false, isSafari: false, isFirefox: false }
  }

  const ua = navigator.userAgent
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/Edge/.test(ua)
  const isFirefox = /Firefox/.test(ua)

  return { isSupported: true, isSafari, isFirefox }
}

// ── Provider ────────────────────────────────────────────────

interface SpeechProviderProps {
  children: ReactNode
}

export function SpeechProvider({ children }: SpeechProviderProps) {
  const [state, setState] = useState<SpeechState>({
    status: 'idle',
    interimTranscript: '',
    finalTranscript: '',
    isAvailable: false,
    error: null,
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restartGuardRef = useRef(false) // prevents rapid restart loops

  // Reset silence timer whenever speech result arrives
  function resetSilenceTimer() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      // Auto-stop after 30s of silence while actively listening
      if (recognitionRef.current && state.status === 'listening') {
        try {
          recognitionRef.current.stop()
        } catch { /* ignore */ }
        setState((s) => ({ ...s, status: 'idle', error: 'Rekaman otomatis berhenti setelah 30 detik tidak ada suara.' }))
      }
    }, 30_000)
  }

  useEffect(() => {
    const { isSupported } = getBrowserCapabilities()

    if (!isSupported) {
      const ua = navigator.userAgent.toLowerCase()
      const isMobile = /android|iphone|ipad|ipod/.test(ua)
      const msg = isMobile
        ? 'Speech Recognition tidak tersedia di browser mobile ini. Gunakan Chrome atau Safari.'
        : 'Speech Recognition tidak tersedia di browser ini. Gunakan Chrome Desktop.'
      setState((s) => ({ ...s, status: 'unavailable', isAvailable: false, error: msg }))
      return
    }

    setState((s) => ({ ...s, isAvailable: true }))

    const SpeechRecognitionCtor =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition

    const recognition = new SpeechRecognitionCtor()
    recognition.continuous = true
    recognition.interimResults = true
    // Prefer Indonesian; fallback to general if not well-supported
    recognition.lang = 'id-ID'
    recognition.maxAlternatives = 1

    // ── Event handlers ──────────────────────────────────────

    recognition.onstart = () => {
      restartGuardRef.current = false
      resetSilenceTimer()
      setState((s) => ({ ...s, status: 'listening', error: null }))
    }

    recognition.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)

      // Only auto-restart if we were intentionally listening and no guard is set
      // This prevents restart loops from errors
      if (restartGuardRef.current) return

      const rec = recognitionRef.current
      if (rec && state.status === 'listening' && !restartGuardRef.current) {
        // Small delay before restart to avoid rapid cycle on error
        setTimeout(() => {
          if (recognitionRef.current && state.status === 'listening') {
            try { recognitionRef.current.start() } catch { /* already started or crashed */ }
          }
        }, 200)
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorCode = event.error

      // Silence / aborted — not a real error, just stop gracefully
      if (errorCode === 'no-speech' || errorCode === 'aborted') {
        setState((s) => {
          if (s.status !== 'listening') return s
          return { ...s, status: 'idle', error: null }
        })
        return
      }

      // Permission denied — browser or OS level block
      if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
        setState((s) => ({
          ...s,
          status: 'unavailable',
          isAvailable: false,
          error: 'Izin mikrofon ditolak. Aktifkan izin mikrofon di pengaturan browser, lalu refresh halaman.',
        }))
        return
      }

      // Network / audio errors — try to recover
      if (errorCode === 'network' || errorCode === 'audio-capture') {
        setState((s) => ({
          ...s,
          status: 'idle',
          error: 'Gagal mengakses mikrofon. Pastikan mikrofon terhubung dan coba lagi.',
        }))
        return
      }

      // Other unknown errors — log but don't crash
      setState((s) => ({ ...s, status: 'idle', error: `Error: ${errorCode}` }))
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      resetSilenceTimer() // reset silence timer on each result
      let interim = ''
      let newFinal = ''

      // Only process results from this event batch (not all history)
      // This prevents double-accumulation on Safari which may replay old results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          newFinal += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      setState((s) => ({
        ...s,
        interimTranscript: interim,
        // Append only NEW final results (incremental — avoids Safari replay duplication)
        finalTranscript: newFinal
          ? (s.finalTranscript + newFinal)
          : s.finalTranscript,
      }))
    }

    recognitionRef.current = recognition

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
      try { recognition.stop() } catch { /* ignore */ }
    }
  }, []) // intentionally empty — setup once

  const start = () => {
    const rec = recognitionRef.current
    if (!rec) return

    restartGuardRef.current = false
    resetSilenceTimer()
    try {
      rec.start()
    } catch (e) {
      // "already started" — ignore
      setState((s) => ({ ...s, status: 'listening' }))
    }
  }

  const stop = () => {
    restartGuardRef.current = true // prevent auto-restart
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    setState((s) => ({ ...s, status: 'idle', interimTranscript: '' }))
  }

  const toggle = () => {
    if (state.status === 'listening') {
      stop()
    } else if (state.status !== 'unavailable') {
      start()
    }
  }

  const reset = () => {
    stop()
    setState((s) => ({ ...s, interimTranscript: '', finalTranscript: '', error: null }))
  }

  return (
    <SpeechContext.Provider
      value={{ ...state, start, stop, toggle, reset }}
    >
      {children}
    </SpeechContext.Provider>
  )
}

// ── Hook ────────────────────────────────────────────────────

export function useSpeech(): SpeechContextValue {
  const ctx = useContext(SpeechContext)
  if (!ctx) throw new Error('useSpeech must be used within SpeechProvider')
  return ctx
}