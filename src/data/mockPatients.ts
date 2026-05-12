import type { MockPatient } from '~/types'

// ── Mock Patient Registry ───────────────────────────────────

export const MOCK_PATIENTS: MockPatient[] = [
  {
    patientId: '000123456789',
    name: 'Budi Santoso',
    dob: '1985-03-12',
    bpjsClass: 'Kelas 1',
    address: 'Jl. Sudirman No. 42, Jakarta Selatan',
  },
  {
    patientId: '000234567890',
    name: 'Siti Aminah',
    dob: '1990-07-04',
    bpjsClass: 'Kelas 2',
    address: 'Jl. Thamrin No. 10, Jakarta Pusat',
  },
  {
    patientId: '000987654321',
    name: 'Ahmad Rizki Pratama',
    dob: '1978-11-20',
    bpjsClass: 'Kelas 3',
    address: 'Jl. Gatot Subroto No. 88, Jakarta Barat',
  },
  {
    patientId: '000555666777',
    name: 'Dewi Lestari',
    dob: '1995-01-30',
    bpjsClass: 'Kelas 1',
    address: 'Jl. HR Rasuna Said, Kuningan, Jakarta',
  },
  {
    patientId: '000345678901',
    name: 'Hendra Wijaya',
    dob: '1968-09-15',
    bpjsClass: 'Kelas 2',
    address: 'Jl. Pangeran Diponegoro No. 17, Jakarta',
  },
]

export function lookupMockPatient(id: string): MockPatient | null {
  return MOCK_PATIENTS.find(
    (p) => p.patientId === id || p.patientId === id.trim()
  ) ?? null
}
