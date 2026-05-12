import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, User } from 'lucide-react'
import { useSession } from '~/contexts/SessionContext'
import { TriageForm } from '~/components/triage/TriageForm'
import { TriageResult } from '~/components/triage/TriageResult'
import { PrintLayout } from '~/components/print/PrintLayout'
import { lookupMockPatient } from '~/data/mockPatients'
import { formatDOB, calculateAge } from '~/utils/date'
import type { TriageNote } from '~/types'

interface TriagePageProps {
  onSaveSession: (session: {
    patientId: string
    patientName?: string
    transcript: string
    images: string[]
    triageNote: TriageNote | null
    esiLevel: number | null
    vitals: import('~/types').VitalSignsInput
  }) => void
  onBack: () => void
}

export function TriagePage({ onSaveSession, onBack }: TriagePageProps) {
  const { state } = useSession()
  const navigate = useNavigate()

  const { patientId, patientName, triageNote: contextTriageNote, vitals } = state

  const [result, setResult] = useState<TriageNote | null>(null)

  const mockPatient = patientId ? lookupMockPatient(patientId) : null

  // Sync result from context when a session is loaded from history
  useEffect(() => {
    if (contextTriageNote) {
      setResult(contextTriageNote)
    }
  }, [contextTriageNote])

  // Separate effect: clear result when resetTriage/patientChange is detected
  useEffect(() => {
    if (contextTriageNote === null && result !== null) {
      setResult(null)
    }
  }, [contextTriageNote, patientId])

  useEffect(() => {
    if (!patientId) {
      navigate('/')
    }
  }, [patientId, navigate])

  if (!patientId) return null

  // transcript now already contains all speech + manual input (synced by TranscriptPanel)
  // Final decision: use state.transcript as the single canonical source to avoid duplication
  const transcript = state.transcript ?? ''
  const images = state.images ?? []
  const combinedTranscript = transcript

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 flex-shrink-0">
        {/* Patient Info Banner */}
        {mockPatient && (
          <div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
            onClick={onBack}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{mockPatient.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                  {mockPatient.patientId} &bull; {calculateAge(mockPatient.dob)} tahun &bull;{' '}
                  {formatDOB(mockPatient.dob)}
                </p>
              </div>
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary-100 text-primary-700 text-[10px] sm:text-xs font-medium border border-primary-200">
                <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                BPJS {mockPatient.bpjsClass}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">

        {/* No mock data case */}
        {!mockPatient && patientId && (
          <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 lg:px-10 py-2.5 sm:py-3 flex-shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 truncate">
                  {patientName || `Pasien ${patientId}`}
                </p>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{patientId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Triage Form + Result — side by side on desktop */}
        <div className="px-4 sm:px-6 lg:px-10 py-4 sm:py-5 lg:py-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 items-start">
            {/* Left: Anamnesis + Image + Generate */}
            <TriageForm
              onSaveSession={onSaveSession}
              onResultChange={(r) => {
                setResult(r)
              }}
            />
            {/* Right: AI Triage Result */}
            <div className="hidden xl:block">
              {result ? (
                <TriageResult
                  note={result}
                  onSave={state.viewingSessionId ? undefined : () => {
                    onSaveSession({
                      patientId,
                      patientName,
                      transcript: combinedTranscript,
                      images,
                      triageNote: result,
                      esiLevel: result.esiLevel,
                      vitals,
                    })
                  }}
                />

              ) : (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6 text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-400">
                    Hasil triage akan muncul di sini
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-300 mt-1">
                    Isi anamnesis atau unggah gambar lalu tekan "Buat Triage Note"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Layout — only visible during printing, outside the scrollable area */}
      {result && (
        <PrintLayout
          note={result}
          patientId={patientId}
          patientName={patientName}
          vitals={vitals}
        />
      )}
    </div>
  )
}