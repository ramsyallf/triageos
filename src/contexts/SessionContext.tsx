import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { TriageNote, TriageSession, TriageFormState, VitalSignsInput } from '~/types'

// ── State & Actions ─────────────────────────────────────────

interface SessionState extends TriageFormState {
  patientName: string
  viewingSessionId: string | null
  vitals: VitalSignsInput
}

type SessionAction =
  | { type: 'SET_PATIENT_ID'; payload: string }
  | { type: 'SET_PATIENT_NAME'; payload: string }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'APPEND_TRANSCRIPT'; payload: string }
  | { type: 'ADD_IMAGE'; payload: string }
  | { type: 'REMOVE_IMAGE'; payload: number }
  | { type: 'SET_TRIAGE_NOTE'; payload: TriageNote }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_SESSION' }
  | { type: 'LOAD_SESSION'; payload: TriageSession }
  | { type: 'RESET_TRIAGE' }
  | { type: 'SET_VITALS'; payload: Partial<VitalSignsInput> }
  | { type: 'CLEAR_VITALS' }

const initialState: SessionState = {
  patientId: '',
  patientName: '',
  transcript: '',
  images: [],
  triageNote: null,
  isGenerating: false,
  isSaving: false,
  error: null,
  viewingSessionId: null,
  vitals: {},
}

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_PATIENT_ID':
      return {
        ...state,
        patientId: action.payload,
        error: null,
        // Switching patient clears stale triage result from previous session
        triageNote: null,
      }
    case 'SET_PATIENT_NAME':
      return { ...state, patientName: action.payload }
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload }
    case 'APPEND_TRANSCRIPT':
      return { ...state, transcript: state.transcript ? `${state.transcript} ${action.payload}` : action.payload }
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.payload] }
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter((_, i) => i !== action.payload) }
    case 'SET_TRIAGE_NOTE':
      return { ...state, triageNote: action.payload }
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload }
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'RESET_SESSION':
      return {
        ...initialState,
        patientId: state.patientId,
        patientName: state.patientName,
      }
    case 'RESET_TRIAGE':
      return {
        ...state,
        transcript: '',
        images: [],
        triageNote: null,
        vitals: {},
        isGenerating: false,
        isSaving: false,
        error: null,
        viewingSessionId: null,
      }
    case 'LOAD_SESSION':
      return {
        patientId: action.payload.patientId,
        patientName: action.payload.patientName ?? '',
        transcript: action.payload.transcript,
        images: action.payload.images,
        triageNote: action.payload.triageNote,
        isGenerating: false,
        isSaving: false,
        error: null,
        viewingSessionId: action.payload.id,
        vitals: (action.payload as any).vitals ?? {},
      }
    case 'SET_VITALS':
      return {
        ...state,
        vitals: { ...state.vitals, ...action.payload },
      }
    case 'CLEAR_VITALS':
      return { ...state, vitals: {} }
    default:
      return state
  }
}

// ── Context Value ────────────────────────────────────────────

interface SessionContextValue {
  state: SessionState
  setPatientId: (id: string) => void
  setPatientName: (name: string) => void
  setTranscript: (t: string) => void
  appendTranscript: (t: string) => void
  addImage: (b64: string) => void
  removeImage: (index: number) => void
  setTriageNote: (note: TriageNote) => void
  setGenerating: (v: boolean) => void
  setSaving: (v: boolean) => void
  setError: (e: string | null) => void
  resetSession: () => void
  loadSession: (session: TriageSession) => void
  resetTriage: () => void
  setVitals: (vitals: Partial<VitalSignsInput>) => void
  canGenerate: boolean
}

const SessionContext = createContext<SessionContextValue | null>(null)

// ── Provider ────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState)

  const value: SessionContextValue = {
    state,
    setPatientId: (id) => dispatch({ type: 'SET_PATIENT_ID', payload: id }),
    setPatientName: (name) => dispatch({ type: 'SET_PATIENT_NAME', payload: name }),
    setTranscript: (t) => dispatch({ type: 'SET_TRANSCRIPT', payload: t }),
    appendTranscript: (t) => dispatch({ type: 'APPEND_TRANSCRIPT', payload: t }),
    addImage: (b64) => dispatch({ type: 'ADD_IMAGE', payload: b64 }),
    removeImage: (index) => dispatch({ type: 'REMOVE_IMAGE', payload: index }),
    setTriageNote: (note) => dispatch({ type: 'SET_TRIAGE_NOTE', payload: note }),
    setGenerating: (v) => dispatch({ type: 'SET_GENERATING', payload: v }),
    setSaving: (v) => dispatch({ type: 'SET_SAVING', payload: v }),
    setError: (e) => dispatch({ type: 'SET_ERROR', payload: e }),
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
    loadSession: (session) => dispatch({ type: 'LOAD_SESSION', payload: session }),
    resetTriage: () => dispatch({ type: 'RESET_TRIAGE' }),
    setVitals: (vitals) => dispatch({ type: 'SET_VITALS', payload: vitals }),
    canGenerate:
      ((state.patientId ?? '').trim().length > 0) &&
      (((state.transcript ?? '').trim().length > 0) || ((state.images ?? []).length > 0)),
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  )
}

// ── Hook ────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}