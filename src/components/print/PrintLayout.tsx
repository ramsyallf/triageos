import type { TriageNote, VitalSignsInput } from '~/types'

interface PrintLayoutProps {
  note: TriageNote
  patientId: string
  patientName?: string
  vitals?: VitalSignsInput
  timestamp?: string
}

const ESI_LABELS: Record<number, string> = {
  1: 'RESUSCITATION',
  2: 'EMERGENT',
  3: 'URGENT',
  4: 'LESS URGENT',
  5: 'NON-URGENT',
}

const ESI_COLORS: Record<number, string> = {
  1: '#dc2626',
  2: '#ea580c',
  3: '#ca8a04',
  4: '#16a34a',
  5: '#2563eb',
}

function formatConfidenceScore(score?: number): string {
  if (score === undefined || score === null) return 'N/A'
  const percent = score > 0 && score <= 1 ? score * 100 : score
  return `${Math.round(Math.max(0, Math.min(100, percent)))}`
}

export function PrintLayout({ note, patientId, patientName, vitals, timestamp }: PrintLayoutProps) {
  const date = timestamp ? new Date(timestamp).toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const esiColor = ESI_COLORS[note.esiLevel] || '#6b7280'
  const riskColor = note.riskLevel === 'High' ? '#dc2626' : note.riskLevel === 'Medium' ? '#ca8a04' : '#16a34a'
  const confidenceLabel = formatConfidenceScore(note.confidenceScore)

  return (
    <div className="print-only hidden print:block p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-lg font-bold text-gray-900">TRIAGEOS - INSTALASI GAWAT DARURAT</h1>
        <p className="text-xs text-gray-600 mt-1">RUMAH SAKIT UMUM DAERAH</p>
      </div>

      {/* Meta Info */}
      <div className="flex gap-8 mb-6 text-sm">
        <div>
          <span className="text-xs text-gray-500 uppercase">Nama Pasien</span>
          <p className="font-semibold">{patientName || 'Tidak Diketahui'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase">ID Pasien</span>
          <p className="font-semibold">{patientId}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 uppercase">Tanggal / Waktu</span>
          <p className="font-semibold">{date}</p>
        </div>
      </div>

      {/* ESI Banner */}
      <div
        className="flex items-center justify-between p-4 rounded-lg mb-6"
        style={{ backgroundColor: `${esiColor}18`, border: `1px solid ${esiColor}40` }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-xl"
            style={{ backgroundColor: esiColor }}
          >
            ESI-{note.esiLevel}
          </div>
          <div>
            <p className="font-bold text-base">{ESI_LABELS[note.esiLevel] || ''}</p>
            <p className="text-xs text-gray-600">Confidence: {confidenceLabel}%</p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-white text-xs font-semibold"
          style={{ backgroundColor: riskColor }}
        >
          Risk: {note.riskLevel}
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {/* Keluhan Utama */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Keluhan Utama</p>
          <p className="font-semibold text-sm">{note.chiefComplaint}</p>
        </div>

        {/* Onset */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Onset (Kapan Gejala Muncul)</p>
          <p className="text-sm">{note.onset}</p>
        </div>

        {/* Gejala Penyerta */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Gejala Penyerta</p>
          <ul className="text-sm space-y-1">
            {note.symptoms.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vital Signs */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Vital Signs</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            {vitals?.systolicBP && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">TD</p>
                <p className="font-bold text-base">{vitals.systolicBP}/{vitals.diastolicBP || '-'}</p>
                <p className="text-[9px] text-gray-400">mmHg</p>
              </div>
            )}
            {vitals?.heartRate && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">HR</p>
                <p className="font-bold text-base">{vitals.heartRate}</p>
                <p className="text-[9px] text-gray-400">bpm</p>
              </div>
            )}
            {vitals?.spO2 && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">SpO2</p>
                <p className="font-bold text-base">{vitals.spO2}</p>
                <p className="text-[9px] text-gray-400">%</p>
              </div>
            )}
            {vitals?.temperature && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">Suhu</p>
                <p className="font-bold text-base">{vitals.temperature}</p>
                <p className="text-[9px] text-gray-400">°C</p>
              </div>
            )}
            {vitals?.respiratoryRate && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">RR</p>
                <p className="font-bold text-base">{vitals.respiratoryRate}</p>
                <p className="text-[9px] text-gray-400">/min</p>
              </div>
            )}
            {vitals?.gcs && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">GCS</p>
                <p className="font-bold text-base">{vitals.gcs}</p>
                <p className="text-[9px] text-gray-400">/15</p>
              </div>
            )}
            {vitals?.painScore !== undefined && (
              <div className="bg-white rounded p-2">
                <p className="text-[9px] text-gray-500 uppercase">Nyeri</p>
                <p className="font-bold text-base">{vitals.painScore}</p>
                <p className="text-[9px] text-gray-400">/10</p>
              </div>
            )}
          </div>
        </div>

        {/* Tindakan Direkomendasikan */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-blue-700 uppercase mb-1">Tindakan Direkomendasikan</p>
          <p className="text-sm text-gray-800 whitespace-pre-line">{note.suggestedAction}</p>
        </div>

        {/* Ringkasan Klinis */}
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-blue-700 uppercase mb-1">Ringkasan Klinis</p>
          <p className="text-sm text-gray-800">{note.clinicalSummary}</p>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-8 pt-4 border-t border-gray-300 flex justify-between">
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-1">&nbsp;</div>
          <p className="text-xs text-gray-600">Tanda Tangan Nurse</p>
        </div>
        <div className="text-center">
          <div className="w-40 border-b border-gray-400 mb-1">&nbsp;</div>
          <p className="text-xs text-gray-600">Tanggal / Waktu</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-3 border-t border-gray-200 text-center">
        <p className="text-[10px] text-gray-400">Generated by TriageOS AI | Human-verified by nurse</p>
      </div>
    </div>
  )
}
