import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ShieldCheck, User, AlertCircle, Clock } from 'lucide-react'
import { lookupMockPatient } from '~/data/mockPatients'
import { formatDOB, calculateAge } from '~/utils/date'
import type { MockPatient, SessionListItem } from '~/types'

interface PatientEntryPageProps {
  sessions: SessionListItem[]
  onPatientIdentified: (patientId: string, patientName: string) => void
}

export function PatientEntryPage({ sessions, onPatientIdentified }: PatientEntryPageProps) {
  const navigate = useNavigate()
  const [inputId, setInputId] = useState('')
  const [patient, setPatient] = useState<MockPatient | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Count existing sessions for this patientId
  const existingCount = sessions.filter((s) => s.patientId === inputId.trim()).length

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = inputId.trim()
    if (!trimmed) return

    setIsSearching(true)

    // Small delay for visual feedback
    setTimeout(() => {
      const found = lookupMockPatient(trimmed)
      setPatient(found)
      setNotFound(!found && trimmed.length > 0)
      setIsSearching(false)

      if (found) {
        onPatientIdentified(trimmed, found.name)
        navigate('/triage')
      }
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-3 sm:mb-4 flex items-center justify-center px-4">
            <img
              src="/TriageOS svgLogo.svg"
              alt="TriageOS Logo"
              className="h-14 w-auto sm:h-16 md:h-20 max-w-full object-contain"
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-sm sm:text-base font-semibold text-white">Identifikasi Pasien</h2>
            <p className="text-xs text-primary-100 mt-0.5">Data tervalidasi dengan Badan Penyelenggara Jaminan Sosial</p>
          </div>

          <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5">
            {/* Search Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => {
                    setInputId(e.target.value)
                    setPatient(null)
                    setNotFound(false)
                  }}
                  placeholder="Masukkan ID BPJS"
                  autoFocus
                  className={[
                    'w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-colors',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    notFound
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300',
                  ].join(' ')}
                />
              </div>

              <button
                type="submit"
                disabled={!inputId.trim() || isSearching}
                className={[
                  'w-full py-2.5 sm:py-3 text-sm font-semibold rounded-xl transition-colors',
                  'bg-primary-600 text-white hover:bg-primary-700',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                ].join(' ')}
              >
                {isSearching ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Mencari...
                  </span>
                ) : (
                  'Mulai Sesi Triage'
                )}
              </button>
            </form>

            {/* Not Found */}
            {notFound && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Pasien tidak ditemukan</p>
                    <p className="text-xs text-yellow-700 mt-0.5">
                      ID "{inputId}" tidak cocok dengan data. Sesi triage tetap dapat dilanjutkan dalam mode demo.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Patient Info Card */}
            {patient && (
              <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
                <div className="bg-primary-50 px-4 py-2.5 flex items-center gap-2 border-b border-primary-100">
                  <User className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-700">Data Pasien</span>
                  <span className="ml-auto">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      BPJS {patient.bpjsClass}
                    </span>
                  </span>
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between">                    
                      <h3 className="text-base font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {patient.patientId}
                      </p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">
                        {calculateAge(patient.dob)} tahun
                      </p>
                      <p className="text-xs text-gray-400">{formatDOB(patient.dob)}</p>
                  </div>
                  {patient.address && (
                    <p className="text-xs text-gray-500 mt-2">{patient.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Previous Visit Info */}
            {existingCount > 0 && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary-800">
                      Pasien pernah visit {existingCount} kali
                    </p>
                    <p className="text-xs text-primary-700 mt-0.5">
                      Riwayat sesi sebelumnya dapat dilihat di halaman triage.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-400 text-center mt-3 sm:mt-4 px-2">
          Contoh ID: <span className="font-mono px-1.5 py-0.5 rounded text-[10px] sm:text-xs">000123456789</span>,{' '}
          <span className="font-mono px-1.5 py-0.5 rounded text-[10px] sm:text-xs">000987654321</span>,{' '}
          <span className="font-mono px-1.5 py-0.5 rounded text-[10px] sm:text-xs">000555666777</span>
        </p>
      </div>
    </div>
  )
}