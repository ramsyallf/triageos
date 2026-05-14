import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Clock, LogOut, Pencil, Search, ShieldCheck, User } from 'lucide-react'
import { usePatientActions } from '~/hooks/usePatients'
import { Button } from '~/components/ui/Button'
import { useToast } from '~/components/ui/Toast'
import { formatDOB } from '~/utils/date'
import type { Patient, SessionListItem, StaffUser } from '~/types'
import type { Id } from '../../convex/_generated/dataModel'

interface PatientEntryPageProps {
  staffUserId: Id<'users'>
  sessions: SessionListItem[]
  currentStaff: StaffUser
  onLogout: () => void
  onPatientIdentified: (patient: Patient) => void
}

type PatientEditForm = {
  name: string
  bpjsId: string
  bpjsClass: string
  nik: string
  medicalRecordNumber: string
  gender: string
  dateOfBirth: string
  age: string
  phoneNumber: string
  address: string
}

function formatGender(gender?: string): string {
  if (!gender) return '-'
  const normalized = gender.toLowerCase()
  if (normalized === 'male' || normalized === 'laki-laki' || normalized === 'l') return 'Laki-laki'
  if (normalized === 'female' || normalized === 'perempuan' || normalized === 'p') return 'Perempuan'
  return gender
}

function createEditForm(patient: Patient): PatientEditForm {
  return {
    name: patient.name ?? '',
    bpjsId: patient.bpjsId ?? '',
    bpjsClass: patient.bpjsClass ?? '',
    nik: patient.nik ?? '',
    medicalRecordNumber: patient.medicalRecordNumber ?? '',
    gender: patient.gender ?? '',
    dateOfBirth: patient.dateOfBirth ?? '',
    age: patient.age ? String(patient.age) : '',
    phoneNumber: patient.phoneNumber ?? '',
    address: patient.address ?? '',
  }
}

function optionalText(value: string): string | undefined {
  return value.trim() || undefined
}

function formatStaffRole(role?: StaffUser['role']): string {
  if (role === 'doctor') return 'Dokter'
  if (role === 'nurse') return 'Perawat'
  if (role === 'admin') return 'Admin'
  return 'Staf IGD'
}

export function PatientEntryPage({
  staffUserId,
  sessions,
  currentStaff,
  onLogout,
  onPatientIdentified,
}: PatientEntryPageProps) {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const { getPatientByBpjsId, searchPatientsByBpjsIdOrName, updatePatientProfile } = usePatientActions(staffUserId)
  const [inputId, setInputId] = useState('')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [editForm, setEditForm] = useState<PatientEditForm | null>(null)

  const existingCount = patient
    ? sessions.filter((session) => session.patientId === patient.bpjsId).length
    : 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const search = inputId.trim()
    if (!search) return

    setIsSearching(true)
    setError(null)
    setEditError(null)
    setPatient(null)
    setIsEditing(false)
    setEditForm(null)

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

  function handleStartEdit() {
    if (!patient) return
    setEditError(null)
    setEditForm(createEditForm(patient))
    setIsEditing(true)
  }

  function handleCancelEdit() {
    setEditError(null)
    setEditForm(null)
    setIsEditing(false)
  }

  function updateEditField(field: keyof PatientEditForm, value: string) {
    setEditForm((current) => current ? { ...current, [field]: value } : current)
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault()
    if (!patient || !editForm) return

    const name = editForm.name.trim()
    const bpjsId = editForm.bpjsId.trim()
    if (!name || !bpjsId) {
      setEditError('Nama pasien dan ID BPJS wajib diisi.')
      return
    }

    const age = editForm.age.trim() ? Number(editForm.age) : undefined
    if (age !== undefined && (!Number.isFinite(age) || age < 0)) {
      setEditError('Umur harus berupa angka valid.')
      return
    }

    setIsSavingProfile(true)
    setEditError(null)

    try {
      const updated = await updatePatientProfile({
        _id: patient._id,
        name,
        bpjsId,
        bpjsClass: optionalText(editForm.bpjsClass),
        nik: optionalText(editForm.nik),
        medicalRecordNumber: optionalText(editForm.medicalRecordNumber),
        gender: optionalText(editForm.gender),
        dateOfBirth: optionalText(editForm.dateOfBirth),
        age,
        phoneNumber: optionalText(editForm.phoneNumber),
        address: optionalText(editForm.address),
      })

      if (!updated) throw new Error('Profil pasien tidak ditemukan.')
      setPatient(updated)
      setInputId(updated.bpjsId)
      setIsEditing(false)
      setEditForm(null)
      addToast('success', 'Profil pasien berhasil diperbarui.')
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Gagal memperbarui profil pasien.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-xl">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary-100 bg-white/90 px-3 py-2 shadow-sm">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-gray-800">
              {currentStaff.name ?? currentStaff.email ?? 'Staf IGD'}
            </p>
            <p className="text-[10px] font-medium text-primary-700">{formatStaffRole(currentStaff.role)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onLogout} className="shrink-0">
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </Button>
        </div>

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
                    setEditError(null)
                    setIsEditing(false)
                    setEditForm(null)
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

              <Button
                type="submit"
                size="lg"
                isLoading={isSearching}
                disabled={!inputId.trim() || isSearching}
                className="w-full text-sm"
              >
                {isSearching ? 'Mencari...' : 'Cari Pasien'}
              </Button>
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
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleStartEdit}
                      className="ml-auto text-primary-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Profil
                    </Button>
                  )}
                  {patient.bpjsClass && (
                    <span className={['inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium', isEditing ? 'ml-auto' : ''].join(' ')}>
                      <ShieldCheck className="h-3 w-3" />
                      BPJS {patient.bpjsClass}
                    </span>
                  )}
                </div>
                <div className="px-4 py-4 space-y-4">
                  {isEditing && editForm ? (
                    <form onSubmit={handleSaveProfile} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="block sm:col-span-2">
                          <span className="text-xs font-medium text-gray-600">Nama pasien</span>
                          <input
                            value={editForm.name}
                            onChange={(event) => updateEditField('name', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">ID BPJS</span>
                          <input
                            value={editForm.bpjsId}
                            onChange={(event) => updateEditField('bpjsId', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Kelas BPJS</span>
                          <input
                            value={editForm.bpjsClass}
                            onChange={(event) => updateEditField('bpjsClass', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Kelas 1"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">NIK</span>
                          <input
                            value={editForm.nik}
                            onChange={(event) => updateEditField('nik', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">No. Rekam Medis</span>
                          <input
                            value={editForm.medicalRecordNumber}
                            onChange={(event) => updateEditField('medicalRecordNumber', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Jenis kelamin</span>
                          <select
                            value={editForm.gender}
                            onChange={(event) => updateEditField('gender', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">-</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                          </select>
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Tanggal lahir</span>
                          <input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(event) => updateEditField('dateOfBirth', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">Umur</span>
                          <input
                            type="number"
                            min="0"
                            value={editForm.age}
                            onChange={(event) => updateEditField('age', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs font-medium text-gray-600">No. telepon</span>
                          <input
                            value={editForm.phoneNumber}
                            onChange={(event) => updateEditField('phoneNumber', event.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="text-xs font-medium text-gray-600">Alamat</span>
                          <textarea
                            value={editForm.address}
                            onChange={(event) => updateEditField('address', event.target.value)}
                            rows={2}
                            className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </label>
                      </div>

                      {editError && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                          {editError}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={isSavingProfile}>
                          Batal
                        </Button>
                        <Button type="submit" isLoading={isSavingProfile}>
                          Simpan Profil
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
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

                      <Button
                        type="button"
                        size="lg"
                        onClick={handleStartTriage}
                        className="w-full text-sm"
                      >
                        Mulai Sesi Triage
                      </Button>
                    </>
                  )}
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
