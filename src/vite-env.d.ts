/// <reference types="vite/client" />

// ── Web Speech API type augmentation ──────────────────────────
// SpeechRecognition is not always fully-typed in older TS DOM libs.
// These declarations supplement the standard DOM types.

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'audio-capture' | 'not-allowed' | 'network' | 'aborted' | 'service-not-allowed'
  message: string
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}
