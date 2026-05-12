import { Mic, MicOff } from 'lucide-react'
import type { SpeechStatus } from '~/types'

interface MicButtonProps {
  status: SpeechStatus
  isAvailable: boolean
  onToggle: () => void
  disabled?: boolean
}

export function MicButton({ status, isAvailable, onToggle, disabled = false }: MicButtonProps) {
  const isListening = status === 'listening'

  if (!isAvailable) {
    return (
      <button
        disabled
        title="Speech Recognition tidak tersedia di browser ini"
        className={[
          'relative flex items-center justify-center rounded-xl transition-all duration-200',
          'w-12 h-12',
          'bg-gray-100 text-gray-400 cursor-not-allowed',
        ].join(' ')}
      >
        <MicOff className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      title={isListening ? 'Matikan perekam' : 'Mulai perekam percakapan'}
      className={[
        'relative flex items-center justify-center rounded-xl transition-all duration-200',
        'w-12 h-12',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        isListening
          ? [
              'bg-red-500 text-white shadow-lg shadow-red-200',
              'focus:ring-red-500',
              'animate-pulse',
            ].join(' ')
          : [
              'bg-primary-600 text-white hover:bg-primary-700',
              'shadow-sm hover:shadow-md hover:shadow-primary-200',
              'focus:ring-primary-500',
            ].join(' '),
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {isListening ? (
        <Mic className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}

      {/* Pulse ring when listening */}
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-20" />
        </>
      )}
    </button>
  )
}
