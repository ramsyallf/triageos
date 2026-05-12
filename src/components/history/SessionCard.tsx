import { Clock, Trash2 } from 'lucide-react'
import type { SessionListItem } from '~/types'
import { Badge } from '~/components/ui/Badge'

interface SessionCardProps {
  session: SessionListItem
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}

function formatRelativeTime(isoString: string): string {
  try {
    const then = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - then.getTime()
    if (isNaN(diffMs)) return 'Tidak diketahui'
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit lalu`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} jam lalu`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} hari lalu`
  } catch {
    return 'Tidak diketahui'
  }
}

const esiBorderColor: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'border-l-red-500',
  2: 'border-l-orange-500',
  3: 'border-l-yellow-400',
  4: 'border-l-green-500',
  5: 'border-l-blue-500',
}

/**
 * Formats the card header as "Nama pasien - ID BPJS" for easy recognition.
 * Falls back to just the patientId if no name is available.
 */
function formatCardTitle(patientName: string | null | undefined, patientId: string): string {
  const name = patientName ?? ''
  if (name.trim().length > 0) {
    return `${name.trim()} - ${patientId}`
  }
  return patientId
}

export function SessionCard({ session, isActive, onClick, onDelete }: SessionCardProps) {
  const esiLevel = session.esiLevel as 1 | 2 | 3 | 4 | 5 | null
  const borderColor = esiLevel ? esiBorderColor[esiLevel] : 'border-l-gray-300'

  // Guard: transcript can be undefined or null from legacy storage
  const transcriptSafe = session.transcript ?? ''
  const truncatedComplaint = transcriptSafe.length > 0
    ? transcriptSafe.slice(0, 60) + (transcriptSafe.length > 60 ? '...' : '')
    : 'Tanpa transkrip'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={[
        'w-full text-left rounded-xl border-l-4 px-3 py-3 transition-all duration-150 cursor-pointer',
        borderColor,
        isActive
          ? 'bg-primary-50 border-y border-r border-primary-200 shadow-sm'
          : 'bg-white border-y border-r border-gray-100 hover:bg-gray-50 hover:shadow-sm',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 leading-tight">
            {formatCardTitle(session.patientName, session.patientId)}
          </p>
          <p className="text-xs text-gray-700 mt-1 leading-snug line-clamp-2">
            {truncatedComplaint}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {esiLevel && <Badge level={esiLevel} size="sm" />}
          <span className="flex items-center gap-0.5 text-xs text-gray-400">
            <Clock className="h-2.5 w-2.5" />
            {formatRelativeTime(session.timestamp)}
          </span>
        </div>
      </div>

      {/* Delete button — bottom right, non-intrusive */}
      {onDelete && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onDelete()
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Hapus sesi"
          >
            <Trash2 className="h-3 w-3" />
            <span>Hapus</span>
          </button>
        </div>
      )}
    </div>
  )
}
