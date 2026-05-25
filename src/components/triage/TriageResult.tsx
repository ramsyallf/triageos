import { useState } from 'react'
import { AlertTriangle, Clock, Activity, Stethoscope, Edit2, Check, X, FileText, Target, Printer } from 'lucide-react'
import type { TriageNote, RiskLevel } from '~/types'
import { Badge } from '~/components/ui/Badge'
import { Button } from '~/components/ui/Button'

interface TriageResultProps {
  note: TriageNote
  onSave?: () => void
  onEdit?: (note: TriageNote) => void
}

function formatConfidenceScore(score?: number): string | null {
  if (score === undefined || score === null) return null
  const percent = score > 0 && score <= 1 ? score * 100 : score
  return `${Math.round(Math.max(0, Math.min(100, percent)))}%`
}

export function TriageResult({ note, onSave, onEdit }: TriageResultProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<TriageNote>(note)

  function handleEditToggle() {
    if (isEditing) {
      setDraft(note) // revert
    }
    setIsEditing((v) => !v)
  }

  function handleConfirm() {
    setIsEditing(false)
    onEdit?.(draft)
  }

  function updateField<K extends keyof TriageNote>(key: K, value: TriageNote[K]) {
    const next = { ...draft, [key]: value }
    setDraft(next)
  }

  const esiLevel = note.esiLevel as 1 | 2 | 3 | 4 | 5
  const confidenceLabel = formatConfidenceScore(note.confidenceScore)

  const riskLevelColor: Record<RiskLevel, string> = {
    High: 'bg-red-500',
    Medium: 'bg-yellow-400',
    Low: 'bg-green-500',
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">Hasil Triage</h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleEditToggle}>
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Batal</span>
              </Button>
              <Button size="sm" variant="primary" onClick={handleConfirm}>
                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Simpan</span>
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={handleEditToggle}>
                <Edit2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => window.print()}>
                <Printer className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Cetak</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ESI Level Banner */}
      <div
        className={[
          'rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2',
          esiLevel === 1 ? 'bg-red-50 border-red-200' :
          esiLevel === 2 ? 'bg-orange-50 border-orange-200' :
          esiLevel === 3 ? 'bg-yellow-50 border-yellow-200' :
          esiLevel === 4 ? 'bg-green-50 border-green-200' :
          'bg-blue-50 border-blue-200',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className={[
            'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-sm flex-shrink-0',
            note.esiLevel === 1 ? 'bg-red-500' :
            note.esiLevel === 2 ? 'bg-orange-500' :
            note.esiLevel === 3 ? 'bg-yellow-400' :
            note.esiLevel === 4 ? 'bg-green-500' :
            'bg-blue-500',
          ].join(' ')}>
            ESI-{note.esiLevel}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {note.esiLevel === 1 ? 'Resuscitation' :
               note.esiLevel === 2 ? 'Emergent' :
               note.esiLevel === 3 ? 'Urgent' :
               note.esiLevel === 4 ? 'Less Urgent' :
               'Non-Urgent'}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 line-clamp-2">
              {note.esiLevel === 1 ? 'Ancaman jiwa langsung — penanganan detik ini' :
               note.esiLevel === 2 ? 'Risiko tinggi — waktu kritis <10 menit' :
               note.esiLevel === 3 ? 'Stable — butuh sumber daya ganda, <30 menit' :
               note.esiLevel === 4 ? 'Kurang urgent — butuh 1 sumber daya, <60 menit' :
               'Non-urgent — bisa menunggu'}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
          <Badge level={esiLevel} showLabel size="md" />
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold text-white ${riskLevelColor[note.riskLevel]}`}>
              Risk: {note.riskLevel}
            </span>
            {confidenceLabel && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] sm:text-xs font-medium border border-gray-200" title="Tingkat kepercayaan AI terhadap hasil triage">
                <Target className="h-2.5 w-2.5 text-gray-400" />
                {confidenceLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        {/* Chief Complaint */}
        <FieldGroup icon={<AlertTriangle className="h-4 w-4 text-primary-500" />} label="Keluhan Utama">
          {isEditing ? (
            <EditableText
              value={draft.chiefComplaint}
              onChange={(v) => updateField('chiefComplaint', v)}
              className="font-semibold text-gray-900"
            />
          ) : (
            <p className="font-semibold text-gray-900 leading-relaxed">{note.chiefComplaint}</p>
          )}
        </FieldGroup>

        {/* Onset */}
        <FieldGroup icon={<Clock className="h-4 w-4 text-primary-500" />} label="Onset (Kapan Gejala Muncul)">
          {isEditing ? (
            <EditableText
              value={draft.onset}
              onChange={(v) => updateField('onset', v)}
            />
          ) : (
            <p className="text-gray-700 text-sm">{note.onset}</p>
          )}
        </FieldGroup>

        {/* Symptoms */}
        <FieldGroup icon={<Activity className="h-4 w-4 text-primary-500" />} label="Gejala Penyerta">
          {isEditing ? (
            <EditableTextArea
              value={draft.symptoms.join('\n')}
              onChange={(v) => updateField('symptoms', v.split('\n').filter(Boolean))}
              rows={Math.max(2, note.symptoms.length)}
            />
          ) : (
            <ul className="space-y-1">
              {note.symptoms.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          )}
        </FieldGroup>

        {/* Clinical Summary */}
        <div className="bg-blue-50 rounded-xl border border-blue-100 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              Ringkasan Klinis
            </span>
          </div>
          {isEditing ? (
            <EditableTextArea
              value={draft.clinicalSummary}
              onChange={(v) => updateField('clinicalSummary', v)}
              rows={3}
            />
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">{note.clinicalSummary}</p>
          )}
        </div>

        {/* Suggested Action */}
        <div className="bg-primary-50 rounded-xl border border-primary-100 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="h-4 w-4 text-primary-600" />
            <span className="text-xs font-semibold text-primary-700 uppercase tracking-wide">
              Tindakan Direkomendasikan
            </span>
          </div>
          {isEditing ? (
            <EditableTextArea
              value={draft.suggestedAction}
              onChange={(v) => updateField('suggestedAction', v)}
              rows={3}
            />
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">{note.suggestedAction}</p>
          )}
        </div>
      </div>

      {/* Save / Edit in context */}
      {onSave && !isEditing && (
        <Button
          variant="primary"
          size="lg"
          onClick={onSave}
          className="w-full"
        >
          Simpan Sesi Triage
        </Button>
      )}
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────

interface FieldGroupProps {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}

function FieldGroup({ icon, label, children }: FieldGroupProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  )
}

function EditableText({ value, onChange, className = '' }: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        'w-full px-2 py-1 text-sm rounded-lg border border-gray-300',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'bg-white',
        className,
      ].join(' ')}
    />
  )
}

function EditableTextArea({ value, onChange, rows = 3 }: {
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className={[
        'w-full px-2 py-1 text-sm rounded-lg border border-gray-300 resize-none',
        'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
        'bg-white',
      ].join(' ')}
    />
  )
}
