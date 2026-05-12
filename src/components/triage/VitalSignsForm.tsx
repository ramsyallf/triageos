import { Activity } from 'lucide-react'
import type { VitalSignsInput } from '~/types'

interface VitalSignsFormProps {
  vitals: VitalSignsInput
  onChange: (updated: Partial<VitalSignsInput>) => void
}

interface VitalFieldProps {
  label: string
  sublabel?: string
  unit: string
  value: string
  onChange: (v: string) => void
  min?: number
  max?: number
  warnIf?: (v: number) => boolean
  warnColor?: string
}

function VitalField({ label, sublabel, unit, value, onChange, min, max, warnIf, warnColor = 'border-red-400' }: VitalFieldProps) {
  const num = parseFloat(value)
  const isWarn = warnIf ? !isNaN(num) && warnIf(num) : false

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">
        {label}
        {sublabel && <span className="font-normal normal-case tracking-normal ml-1 text-gray-400">{sublabel}</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className={[
            'w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border bg-white',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors duration-150 text-gray-900 placeholder:text-gray-300',
            isWarn
              ? `border ${warnColor} bg-red-50`
              : 'border-gray-200 hover:border-gray-300',
          ].join(' ')}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-gray-400 pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  )
}

export function VitalSignsForm({ vitals, onChange }: VitalSignsFormProps) {
  function setField<K extends keyof VitalSignsInput>(key: K, raw: string) {
    if (raw === '') {
      // clear the field
      onChange({ [key]: undefined as any })
      return
    }
    const num = parseFloat(raw)
    if (!isNaN(num)) {
      onChange({ [key]: num })
    }
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
        <span className="text-sm sm:text-base font-semibold text-gray-800">
          Vital Signs
        </span>
      </div>

      {/* 2-column grid on sm+, 1-column on xs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">

        {/* Blood Pressure — systolic + diastolic in one cell */}
        <div className="col-span-2 sm:col-span-2">
          <label className="block text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Tekanan Darah
          </label>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 relative">
              <input
                type="number"
                inputMode="decimal"
                value={vitals.systolicBP ?? ''}
                onChange={(e) => setField('systolicBP', e.target.value)}
                placeholder="SYS"
                min={50} max={300}
                className={[
                  'w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'transition-colors duration-150 text-gray-900 placeholder:text-gray-300 placeholder:text-[10px]',
                  !isNaN(vitals.systolicBP ?? NaN) && (vitals.systolicBP! < 90 || vitals.systolicBP! > 220)
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">mmHg</span>
            </div>
            <span className="text-gray-400 text-xs font-medium">/</span>
            <div className="flex-1 relative">
              <input
                type="number"
                inputMode="decimal"
                value={vitals.diastolicBP ?? ''}
                onChange={(e) => setField('diastolicBP', e.target.value)}
                placeholder="DIA"
                min={30} max={200}
                className={[
                  'w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  'transition-colors duration-150 text-gray-900 placeholder:text-gray-300 placeholder:text-[10px]',
                  'border-gray-200 hover:border-gray-300',
                ].join(' ')}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">mmHg</span>
            </div>
          </div>
        </div>

        {/* Heart Rate */}
        <VitalField
          label="HR"
          sublabel="(detak jantung)"
          unit="bpm"
          value={vitals.heartRate?.toString() ?? ''}
          onChange={(v) => setField('heartRate', v)}
          min={20} max={300}
          warnIf={(v) => v > 140 || v < 50}
          warnColor="border-red-400"
        />

        {/* SpO2 */}
        <VitalField
          label="SpO₂"
          sublabel="(saturasi O₂)"
          unit="%"
          value={vitals.spO2?.toString() ?? ''}
          onChange={(v) => setField('spO2', v)}
          min={50} max={100}
          warnIf={(v) => v < 94}
          warnColor="border-red-400"
        />

        {/* Temperature */}
        <VitalField
          label="Suhu"
          unit="°C"
          value={vitals.temperature?.toString() ?? ''}
          onChange={(v) => setField('temperature', v)}
          min={30} max={45}
          warnIf={(v) => v > 39.5}
          warnColor="border-orange-400"
        />

        {/* Respiratory Rate */}
        <VitalField
          label="RR"
          sublabel="(laju napas)"
          unit="/min"
          value={vitals.respiratoryRate?.toString() ?? ''}
          onChange={(v) => setField('respiratoryRate', v)}
          min={4} max={60}
          warnIf={(v) => v > 30 || v < 8}
          warnColor="border-red-400"
        />

        {/* GCS */}
        <VitalField
          label="GCS"
          sublabel="(3–15)"
          unit="/15"
          value={vitals.gcs?.toString() ?? ''}
          onChange={(v) => setField('gcs', v)}
          min={3} max={15}
          warnIf={(v) => v < 14}
          warnColor="border-red-400"
        />

        {/* Pain Score */}
        <VitalField
          label="Skor Nyeri"
          sublabel="(0–10)"
          unit="/10"
          value={vitals.painScore?.toString() ?? ''}
          onChange={(v) => setField('painScore', v)}
          min={0} max={10}
          warnIf={(v) => v >= 8}
          warnColor="border-orange-400"
        />

      </div>

      {/* Warning indicators */}
      <div className="flex flex-wrap gap-1.5">
        {vitals.spO2 !== undefined && vitals.spO2 < 90 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            SpO₂ &lt;90% — ESI 2
          </span>
        )}
        {vitals.systolicBP !== undefined && vitals.systolicBP < 90 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            TD Sistolik &lt;90 — Hemodinamik tidak stabil
          </span>
        )}
        {vitals.systolicBP !== undefined && vitals.systolicBP > 220 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            TD Sistolik &gt;220 — Hipertensi Emergency
          </span>
        )}
        {vitals.gcs !== undefined && vitals.gcs <= 13 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            GCS {vitals.gcs} — Penurunan Kesadaran
          </span>
        )}
        {vitals.heartRate !== undefined && (vitals.heartRate > 140 || vitals.heartRate < 50) && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            HR {vitals.heartRate} bpm — Risiko Aritmia
          </span>
        )}
        {vitals.painScore !== undefined && vitals.painScore >= 8 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-medium border border-yellow-200">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            Nyeri berat ({vitals.painScore}/10) — ESI 3+
          </span>
        )}
      </div>
    </div>
  )
}
