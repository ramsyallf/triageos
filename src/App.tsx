import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { SessionProvider, useSession } from '~/contexts/SessionContext'
import { SpeechProvider } from '~/contexts/SpeechContext'
import { ToastProvider, useToast } from '~/components/ui/Toast'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useLocalStorage } from '~/hooks/useLocalStorage'
import { PatientEntryPage } from '~/pages/PatientEntryPage'
import { TriagePage } from '~/pages/TriagePage'
import type { SessionListItem, TriageSession } from '~/types'

const STORAGE_KEY = 'triageos-sessions'

// ── Sidebar Layout (persistent shell) ──────────────────────

import { Menu, X, Plus, Inbox } from 'lucide-react'
import { SessionCard } from '~/components/history/SessionCard'

interface ShellProps {
  children: React.ReactNode
  allSessions: SessionListItem[]
  activeSessionId: string | null
  onSelectSession: (session: SessionListItem) => void
  onDeleteSession: (sessionId: string) => void
}

function Shell({ children, allSessions, activeSessionId, onSelectSession, onDeleteSession }: ShellProps) {
  const { state, resetTriage } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Only show sessions for the current patient
  const sessions = state.patientId
    ? allSessions.filter((s) => s.patientId === state.patientId)
    : []

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-30 w-64 sm:w-72 bg-gray-50 border-r border-gray-200',
          'flex flex-col',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <img
              src="/TriageOS svgIcon.svg"
              alt="TriageOS Icon"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight">TriageOS</h1>
              <p className="text-[10px] sm:text-xs text-gray-400 -mt-0.5">Asisten Triage IGD</p>
            </div>
          </div>

          <button
            onClick={() => {
              resetTriage()
              navigate('/triage')
            }}
            className={[
              'mt-2.5 sm:mt-3 w-full flex items-center justify-center gap-2 py-1.5 sm:py-2 rounded-xl',
              'bg-primary-600 text-white hover:bg-primary-700',
              'text-xs sm:text-sm font-medium transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
            ].join(' ')}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Sesi Baru
          </button>
        </div>

        {/* Session History */}
        <div className="flex-1 overflow-y-auto sidebar-scrollbar py-2 sm:py-3">
          <div className="px-2 sm:px-3 mb-2">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Riwayat Sesi
            </p>
          </div>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2 sm:mb-3">
                <Inbox className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-600">Belum ada sesi triage</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                Sesi yang disimpan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-2 px-2">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onClick={() => onSelectSession(session)}
                  onDelete={() => onDeleteSession(session.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:hidden w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Tutup sidebar"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile menu button */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── App Content ─────────────────────────────────────────────

function AppContent() {
  const { state, setPatientId, setPatientName, loadSession } = useSession()
  const { addToast } = useToast()

  // Load FULL sessions from localStorage (preserves triageNote + images)
  const [sessions, setSessions] = useLocalStorage<TriageSession[]>(
    STORAGE_KEY,
    []
  )

  // Derive sidebar list items from full sessions
  const sessionListItems: SessionListItem[] = sessions.map((s) => ({
    id: s.id,
    patientId: s.patientId,
    patientName: s.patientName,
    timestamp: s.timestamp,
    esiLevel: s.esiLevel,
    transcript: s.transcript,
  }))

  function handleSelectSession(session: SessionListItem) {
    const full = sessions.find((s) => s.id === session.id)
    if (!full) return
    loadSession(full)
  }

  function handleSaveSession(session: {
    patientId: string
    patientName?: string
    transcript: string
    images: string[]
    triageNote: import('~/types').TriageNote | null
    esiLevel: number | null
    vitals: import('~/types').VitalSignsInput
  }) {
    const newSession: TriageSession = {
      id: `session-${Date.now()}`,
      ...session,
      timestamp: new Date().toISOString(),
    }

    setSessions((prev) => [newSession, ...prev])
    addToast('success', `Sesi triage pasien ${session.patientName ?? session.patientId} berhasil disimpan.`)
  }

  return (
    <Routes>
      {/* Page 1: Patient Entry */}
      <Route
        path="/"
        element={
          <PatientEntryPage
            sessions={sessionListItems}
            onPatientIdentified={(patientId, patientName) => {
              setPatientId(patientId)
              setPatientName(patientName)
            }}
          />
        }
      />

      {/* Page 2: Live Triage */}
      <Route
        path="/triage"
        element={
          <Shell
            allSessions={sessionListItems}
            activeSessionId={state.viewingSessionId}
            onSelectSession={handleSelectSession}
            onDeleteSession={(id) => {
              setSessions((prev) => prev.filter((s) => s.id !== id))
              addToast('success', 'Sesi berhasil dihapus.')
            }}
          >
            <TriagePage
              onSaveSession={handleSaveSession}
              onBack={() => {
                setPatientId('')
                setPatientName('')
              }}
            />
          </Shell>
        }
      />
    </Routes>
  )
}

// ── Root ─────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SessionProvider>
          <SpeechProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </SpeechProvider>
        </SessionProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}