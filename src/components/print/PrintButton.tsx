import { useState } from 'react'
import { Printer, FileText, Download } from 'lucide-react'
import { Button } from '~/components/ui/Button'
import type { TriageNote } from '~/types'

interface PrintButtonProps {
  note: TriageNote
  patientId: string
  patientName?: string
  vitals?: {
    systolicBP?: number
    diastolicBP?: number
    heartRate?: number
    spO2?: number
    temperature?: number
    respiratoryRate?: number
    gcs?: number
    painScore?: number
  }
  timestamp?: string
  nurseName?: string
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

export function PrintButton({ note, patientId, patientName, vitals, timestamp, nurseName }: PrintButtonProps) {
  const [showMenu, setShowMenu] = useState(false)

  function handlePrint() {
    setShowMenu(false)
    window.print()
  }

  function handleDownloadText() {
    setShowMenu(false)
    const content = generateTextContent(note, patientId, patientName, vitals, timestamp, nurseName)
    downloadFile(content, `triage-note-${patientId}-${Date.now()}.txt`, 'text/plain')
  }

  function handleDownloadHTML() {
    setShowMenu(false)
    const content = generateHTMLContent(note, patientId, patientName, vitals, timestamp)
    downloadFile(content, `triage-note-${patientId}-${Date.now()}.html`, 'text/html')
  }

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="gap-1.5"
      >
        <Printer className="h-3.5 w-3.5" />
        <span>Export</span>
      </Button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-500 font-medium">Pilih format export:</p>
            </div>

            <button
              onClick={handlePrint}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <Printer className="h-4 w-4 text-gray-400" />
              <span>Cetak Langsung</span>
            </button>

            <button
              onClick={handleDownloadText}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <FileText className="h-4 w-4 text-gray-400" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={handleDownloadHTML}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-sm text-gray-700"
            >
              <Download className="h-4 w-4 text-gray-400" />
              <span>Download .html</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Text Content Generator ────────────────────────────────────

function generateTextContent(
  note: TriageNote,
  patientId: string,
  patientName?: string,
  vitals?: any,
  timestamp?: string,
  nurseName?: string
): string {
  const date = timestamp ? new Date(timestamp).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
  const confidenceLabel = formatConfidenceScore(note.confidenceScore)

  let content = `
================================================================================
                         TRIAGEOS - INSTALASI GAWAT DARURAT
                              RUMAH SAKIT UMUM DAERAH
================================================================================

TRIAGE NOTE
--------------------------------------------------------------------------------
Pasien    : ${patientName || 'Tidak diketahui'} (${patientId})
Tanggal   : ${date}
Nurse     : ${nurseName || '................................'}
--------------------------------------------------------------------------------

ESI LEVEL     : ${note.esiLevel} - ${ESI_LABELS[note.esiLevel] || ''}
Risk Level    : ${note.riskLevel}
Confidence    : ${confidenceLabel}%

--------------------------------------------------------------------------------
KELUHAN UTAMA
${note.chiefComplaint}

--------------------------------------------------------------------------------
ONSET (KAPAN GEJALA MUNCUL)
${note.onset}

--------------------------------------------------------------------------------
GEJALA PENYARTA
${note.symptoms.map((s, i) => `${i + 1}. ${s}`).join('\n')}

--------------------------------------------------------------------------------
VITAL SIGNS
${formatVitals(vitals)}

--------------------------------------------------------------------------------
TINDAKAN DIREKOMENDASIKAN
${note.suggestedAction}

--------------------------------------------------------------------------------
RINGKASAN KLINIS
${note.clinicalSummary}

--------------------------------------------------------------------------------
Tanda Tangan Nurse: ............................    Tanggal: ....................

Generated by TriageOS AI | Human-verified by nurse
================================================================================
`
  return content.trim()
}

// ── HTML Content Generator ─────────────────────────────────────

function generateHTMLContent(
  note: TriageNote,
  patientId: string,
  patientName?: string,
  vitals?: any,
  timestamp?: string
): string {
  const date = timestamp ? new Date(timestamp).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')
  const esiColor = ESI_COLORS[note.esiLevel] || '#6b7280'
  const confidenceLabel = formatConfidenceScore(note.confidenceScore)

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Triage Note - ${patientId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb; }
    .header h1 { font-size: 18px; color: #374151; }
    .header p { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .meta { display: flex; gap: 30px; margin-bottom: 20px; font-size: 12px; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { color: #6b7280; font-size: 10px; text-transform: uppercase; margin-bottom: 2px; }
    .meta-value { font-weight: 600; }
    .esi-banner { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; background: ${esiColor}18; border: 1px solid ${esiColor}40; }
    .esi-level { display: flex; align-items: center; gap: 12px; }
    .esi-badge { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px; color: white; background: ${esiColor}; }
    .esi-info { font-size: 14px; font-weight: 600; }
    .esi-info small { display: block; font-size: 11px; font-weight: 400; color: #6b7280; margin-top: 2px; }
    .risk-badge { padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; color: white; background: ${note.riskLevel === 'High' ? '#dc2626' : note.riskLevel === 'Medium' ? '#ca8a04' : '#16a34a'}; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .section-content { background: #f9fafb; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.6; }
    .symptoms { list-style: none; }
    .symptoms li { padding: 4px 0; padding-left: 16px; position: relative; }
    .symptoms li::before { content: '•'; position: absolute; left: 0; color: #6b7280; }
    .vitals-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .vital-item { background: white; border-radius: 6px; padding: 8px; text-align: center; }
    .vital-label { font-size: 10px; color: #6b7280; }
    .vital-value { font-size: 16px; font-weight: 600; margin-top: 2px; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; }
    .signature-item { text-align: center; font-size: 12px; }
    .signature-line { margin-top: 40px; border-bottom: 1px solid #1f2937; width: 150px; display: inline-block; }
    .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #9ca3af; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>TRIAGEOS - INSTALASI GAWAT DARURAT</h1>
    <p>RUMAH SAKIT UMUM DAERAH</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Nama Pasien</span>
      <span class="meta-value">${patientName || 'Tidak diketahui'}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">ID Pasien</span>
      <span class="meta-value">${patientId}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Tanggal</span>
      <span class="meta-value">${date}</span>
    </div>
  </div>

  <div class="esi-banner">
    <div class="esi-level">
      <div class="esi-badge">ESI-${note.esiLevel}</div>
      <div class="esi-info">
        ${ESI_LABELS[note.esiLevel] || ''}
        <small>Confidence: ${confidenceLabel}%</small>
      </div>
    </div>
    <span class="risk-badge">Risk: ${note.riskLevel}</span>
  </div>

  <div class="section">
    <div class="section-title">Keluhan Utama</div>
    <div class="section-content">${note.chiefComplaint}</div>
  </div>

  <div class="section">
    <div class="section-title">Onset (Kapan Gejala Muncul)</div>
    <div class="section-content">${note.onset}</div>
  </div>

  <div class="section">
    <div class="section-title">Gejala Penyerta</div>
    <div class="section-content">
      <ul class="symptoms">
        ${note.symptoms.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Vital Signs</div>
    <div class="section-content">
      <div class="vitals-grid">
        ${vitals?.systolicBP ? `<div class="vital-item"><div class="vital-label">TD</div><div class="vital-value">${vitals.systolicBP}/${vitals.diastolicBP || '-'}</div></div>` : ''}
        ${vitals?.heartRate ? `<div class="vital-item"><div class="vital-label">HR</div><div class="vital-value">${vitals.heartRate}</div></div>` : ''}
        ${vitals?.spO2 ? `<div class="vital-item"><div class="vital-label">SpO2</div><div class="vital-value">${vitals.spO2}%</div></div>` : ''}
        ${vitals?.temperature ? `<div class="vital-item"><div class="vital-label">Suhu</div><div class="vital-value">${vitals.temperature}°C</div></div>` : ''}
        ${vitals?.respiratoryRate ? `<div class="vital-item"><div class="vital-label">RR</div><div class="vital-value">${vitals.respiratoryRate}</div></div>` : ''}
        ${vitals?.gcs ? `<div class="vital-item"><div class="vital-label">GCS</div><div class="vital-value">${vitals.gcs}/15</div></div>` : ''}
        ${vitals?.painScore ? `<div class="vital-item"><div class="vital-label">Nyeri</div><div class="vital-value">${vitals.painScore}/10</div></div>` : ''}
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Tindakan Direkomendasikan</div>
    <div class="section-content">${note.suggestedAction}</div>
  </div>

  <div class="section">
    <div class="section-title">Ringkasan Klinis</div>
    <div class="section-content">${note.clinicalSummary}</div>
  </div>

  <div class="signature">
    <div class="signature-item">
      <div class="signature-line"></div>
      <br>Tanda Tangan Nurse
    </div>
    <div class="signature-item">
      <div class="signature-line"></div>
      <br>Tanggal / Waktu
    </div>
  </div>

  <div class="footer">
    Generated by TriageOS AI | Human-verified by nurse
  </div>
</body>
</html>`
}

// ── Helper Functions ────────────────────────────────────────────

function formatVitals(vitals?: any): string {
  if (!vitals || Object.keys(vitals).length === 0) {
    return 'Tidak ada data vital signs'
  }

  const parts: string[] = []
  if (vitals.systolicBP) parts.push(`TD: ${vitals.systolicBP}/${vitals.diastolicBP || '-'} mmHg`)
  if (vitals.heartRate) parts.push(`HR: ${vitals.heartRate} bpm`)
  if (vitals.spO2) parts.push(`SpO2: ${vitals.spO2}%`)
  if (vitals.temperature) parts.push(`Suhu: ${vitals.temperature}°C`)
  if (vitals.respiratoryRate) parts.push(`RR: ${vitals.respiratoryRate}/min`)
  if (vitals.gcs) parts.push(`GCS: ${vitals.gcs}/15`)
  if (vitals.painScore) parts.push(`Nyeri: ${vitals.painScore}/10`)

  return parts.length > 0 ? parts.join('  |  ') : 'Tidak ada data vital signs'
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
