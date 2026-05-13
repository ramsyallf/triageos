import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, Search, ShieldCheck, User } from 'lucide-react'
import { usePatientActions } from '~/hooks/usePatients'
import { formatDOB } from '~/utils/date'
import type { Patient, SessionListItem } from '~/types'

interface PatientEntryPageProps {
  sessions: SessionListItem[]
  onPatientIdentified: (patient: Patient) => void
}

function formatGender(gender?: string): string {
  if (!gender) return '-'
  const normalized = gender.toLowerCase()
  if (normalized === 'male' || normalized === 'laki-laki' || normalized === 'l') return 'Laki-laki'
  if (normalized === 'female' || normalized === 'perempuan' || normalized === 'p') return 'Perempuan'
  return gender
}

export function PatientEntryPage({ sessions, onPatientIdentified }: PatientEntryPageProps) {
  const navigate = useNavigate()
  const { getPatientByBpjsId, searchPatientsByBpjsIdOrName } = usePatientActions()
  const [inputId, setInputId] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const existingCount = patient
    ? sessions.filter((session) => session.patientId === patient.bpjsId).length
    : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const search = inputId.trim()
    if (!search) return

    setIsSearching(true)
    setError(null)
    setPatient(null)

    try {
      const exactBpjs = await getPatientByBpjsId(search)
      const fallbackResults = exactBpjs ? [] : await searchPatientsByBpjsIdOrName(search)
      const found =
        exactBpjs ??
        fallbackResults.find((candidate) => candidate.medicalRecordNumber === search) ??
        fallbackResults.find((candidate) => candidate.bpjsId === search) ??
        fallbackResults[0] ??
        null

      if (!found) {
        setError('Data pasien tidak ditemukan. Pastikan ID BPJS sudah benar.')
        return
      }

      setPatient(found)
    } catch {
      setError('Data pasien tidak ditemukan. Pastikan ID BPJS sudah benar.')
    } finally {
      setIsSearching(false)
    }
  }

  function handleStartTriage() {
    if (!patient) return
    onPatientIdentified(patient)
    navigate('/triage')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-3 sm:mb-4 flex items-center justify-center px-4">
            <img
              src="/TriageOS svgLogo.svg"
              alt="TriageOS Logo"
              className="h-14 w-auto sm:h-16 md:h-20 max-w-full object-contain"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-4 sm:px-6 py-3 sm:py-4">
            <h2 className="text-sm sm:text-base font-semibold text-white">Cari Data Pasien</h2>
            <p className="text-xs text-primary-100 mt-0.5">Pasien harus sudah terdaftar di database Convex.</p>
          </div>

          <div className="px-4 sm:px-6 py-5 sm:py-6 space-y-4 sm:space-y-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={inputId}
                  onChange={(e) => {
                    setInputId(e.target.value)
                    setPatient(null)
                    setError(null)
                  }}
                  placeholder="Masukkan ID BPJS atau No. Rekam Medis"
                  autoFocus
                  className={[
                    'w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-colors',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    error
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
                {isSearching ? 'Mencari...' : 'Cari Pasien'}
              </button>
            </form>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            )}

            {patient && (
              <div className="bg-white rounded-xl border border-primary-200 shadow-sm overflow-hidden">
                <div className="bg-primary-50 px-4 py-2.5 flex items-center gap-2 border-b border-primary-100">
                  <User className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-primary-700">Profil Pasien</span>
                  {patient.bpjsClass && (
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      BPJS {patient.bpjsClass}
                    </span>
                  )}
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{patient.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">BPJS {patient.bpjsId}</p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-gray-400">No. Rekam Medis</dt>
                      <dd className="font-medium text-gray-800">{patient.medicalRecordNumber ?? '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Umur</dt>
                      <dd className="font-medium text-gray-800">{patient.age ? `${patient.age} tahun` : '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Tanggal Lahir</dt>
                      <dd className="font-medium text-gray-800">{patient.dateOfBirth ? formatDOB(patient.dateOfBirth) : '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-400">Jenis Kelamin</dt>
                      <dd className="font-medium text-gray-800">{formatGender(patient.gender)}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={handleStartTriage}
                    className="w-full py-2.5 sm:py-3 text-sm font-semibold rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
                  >
                    Mulai Sesi Triage
                  </button>
                </div>
              </div>
            )}

            {existingCount > 0 && (
              <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <Clock className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary-800">
                      Anda pernah membuat {existingCount} sesi triage untuk pasien ini.
                    </p>
                    <p className="text-xs text-primary-700 mt-0.5">
                      Riwayat sesi tersedia di sidebar setelah masuk halaman triage.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
