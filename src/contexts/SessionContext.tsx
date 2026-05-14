import { createContext, useContext, useReducer, type ReactNode } from 'react'
import type { Id } from '../../convex/_generated/dataModel'
import type { Patient, TriageNote, TriageSession, TriageFormState, VitalSignsInput } from '~/types'

// ── State & Actions ─────────────────────────────────────────

interface SessionState extends TriageFormState {
  patientName: string
  selectedPatient: Patient | null
  viewingSessionId: string | null
  vitals: VitalSignsInput
}

type SessionAction =
  | { type: 'SET_PATIENT_ID'; payload: string }
  | { type: 'SET_CONVEX_PATIENT_ID'; payload: Id<'patients'> | null }
  | { type: 'SET_PATIENT_NAME'; payload: string }
  | { type: 'SET_SELECTED_PATIENT'; payload: Patient | null }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'APPEND_TRANSCRIPT'; payload: string }
  | { type: 'ADD_IMAGE'; payload: { previewDataUrl: string; storageId?: Id<'_storage'> } }
  | { type: 'REMOVE_IMAGE'; payload: number }
  | { type: 'SET_UPLOADED_IMAGE_IDS'; payload: Id<'_storage'>[] }
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
  convexPatientId: null,
  selectedPatient: null,
  patientName: '',
  transcript: '',
  images: [],
  uploadedPhotoStorageIds: [],
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
    case 'SET_CONVEX_PATIENT_ID':
      return { ...state, convexPatientId: action.payload }
    case 'SET_PATIENT_NAME':
      return { ...state, patientName: action.payload }
    case 'SET_SELECTED_PATIENT':
      return {
        ...state,
        selectedPatient: action.payload,
        patientId: action.payload?.bpjsId ?? '',
        convexPatientId: action.payload?._id ?? null,
        patientName: action.payload?.name ?? '',
        transcript: '',
        images: [],
        uploadedPhotoStorageIds: [],
        triageNote: null,
        vitals: {},
        viewingSessionId: null,
        error: null,
      }
    case 'SET_TRANSCRIPT':
      return { ...state, transcript: action.payload }
    case 'APPEND_TRANSCRIPT':
      return { ...state, transcript: state.transcript ? `${state.transcript} ${action.payload}` : action.payload }
    case 'ADD_IMAGE':
      return {
        ...state,
        images: [...state.images, action.payload.previewDataUrl],
        uploadedPhotoStorageIds: action.payload.storageId
          ? [...state.uploadedPhotoStorageIds, action.payload.storageId]
          : state.uploadedPhotoStorageIds,
      }
    case 'REMOVE_IMAGE':
      return {
        ...state,
        images: state.images.filter((_, i) => i !== action.payload),
        uploadedPhotoStorageIds: state.uploadedPhotoStorageIds.filter((_, i) => i !== action.payload),
      }
    case 'SET_UPLOADED_IMAGE_IDS':
      return { ...state, uploadedPhotoStorageIds: action.payload }
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
        convexPatientId: state.convexPatientId,
        selectedPatient: state.selectedPatient,
        patientName: state.patientName,
      }
    case 'RESET_TRIAGE':
      return {
        ...state,
        transcript: '',
        images: [],
        uploadedPhotoStorageIds: [],
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
        convexPatientId: action.payload.convexPatientId ?? null,
        selectedPatient: action.payload.selectedPatient ?? null,
        patientName: action.payload.patientName ?? '',
        transcript: action.payload.transcript,
        images: action.payload.images,
        uploadedPhotoStorageIds: action.payload.uploadedPhotoStorageIds ?? [],
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
  setConvexPatientId: (id: Id<'patients'> | null) => void
  setPatientName: (name: string) => void
  setSelectedPatient: (patient: Patient | null) => void
  setTranscript: (t: string) => void
  appendTranscript: (t: string) => void
  addImage: (previewDataUrl: string, storageId?: Id<'_storage'>) => void
  removeImage: (index: number) => void
  setUploadedPhotoStorageIds: (ids: Id<'_storage'>[]) => void
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
    setConvexPatientId: (id) => dispatch({ type: 'SET_CONVEX_PATIENT_ID', payload: id }),
    setPatientName: (name) => dispatch({ type: 'SET_PATIENT_NAME', payload: name }),
    setSelectedPatient: (patient) => dispatch({ type: 'SET_SELECTED_PATIENT', payload: patient }),
    setTranscript: (t) => dispatch({ type: 'SET_TRANSCRIPT', payload: t }),
    appendTranscript: (t) => dispatch({ type: 'APPEND_TRANSCRIPT', payload: t }),
    addImage: (previewDataUrl, storageId) => dispatch({ type: 'ADD_IMAGE', payload: { previewDataUrl, storageId } }),
    removeImage: (index) => dispatch({ type: 'REMOVE_IMAGE', payload: index }),
    setUploadedPhotoStorageIds: (ids) => dispatch({ type: 'SET_UPLOADED_IMAGE_IDS', payload: ids }),
    setTriageNote: (note) => dispatch({ type: 'SET_TRIAGE_NOTE', payload: note }),
    setGenerating: (v) => dispatch({ type: 'SET_GENERATING', payload: v }),
    setSaving: (v) => dispatch({ type: 'SET_SAVING', payload: v }),
    setError: (e) => dispatch({ type: 'SET_ERROR', payload: e }),
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
    loadSession: (session) => dispatch({ type: 'LOAD_SESSION', payload: session }),
    resetTriage: () => dispatch({ type: 'RESET_TRIAGE' }),
    setVitals: (vitals) => dispatch({ type: 'SET_VITALS', payload: vitals }),
    canGenerate:
      state.convexPatientId !== null &&
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
