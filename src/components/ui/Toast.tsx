import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import type { ToastType } from '~/types'

// ── Context ────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ── Types ──────────────────────────────────────────────────

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

// ── Toast Provider ──────────────────────────────────────────

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastPortal toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ── Toast Portal ────────────────────────────────────────────

const iconMap: Record<ToastType, ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
}

const styleMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
}

function ToastItemComponent({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(item.id), 4000)
    return () => clearTimeout(timer)
  }, [item.id, onRemove])

  return (
    <div
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg',
        'transition-all duration-300 ease-out',
        styleMap[item.type],
      ].join(' ')}
    >
      {iconMap[item.type]}
      <p className="text-sm text-gray-800 flex-1 leading-relaxed">{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors mt-0.5"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

function ToastPortal({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return createPortal(
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {toasts.map((t) => (
        <ToastItemComponent key={t.id} item={t} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  )
}