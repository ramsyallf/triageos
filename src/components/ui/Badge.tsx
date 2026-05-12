import { type HTMLAttributes } from 'react'
import { ESI_COLORS, ESI_LABELS } from '~/types'

type ESILevel = 1 | 2 | 3 | 4 | 5

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  level?: ESILevel
  showLabel?: boolean
  size?: 'sm' | 'md'
}

const sizeClasses = {
  sm: 'px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs',
  md: 'px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-semibold',
}

export function Badge({ level, showLabel = false, size = 'md', className = '', ...props }: BadgeProps) {
  if (!level) {
    return (
      <span
        className={[
          'inline-flex items-center rounded-full bg-gray-100 text-gray-600',
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        —
      </span>
    )
  }

  const colorMap: Record<ESILevel, string> = {
    1: 'bg-red-100 text-red-700',
    2: 'bg-orange-100 text-orange-700',
    3: 'bg-yellow-100 text-yellow-700',
    4: 'bg-green-100 text-green-700',
    5: 'bg-blue-100 text-blue-700',
  }

  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 sm:gap-1 rounded-full font-semibold',
        colorMap[level as ESILevel],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      <span
        className={['inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', ESI_COLORS[level as ESILevel]].join(' ')}
      />
      ESI-{level}
      {showLabel && <span className="font-normal ml-0.5 sm:ml-1 hidden sm:inline">— {ESI_LABELS[level as ESILevel]}</span>}
    </span>
  )
}
