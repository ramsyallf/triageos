import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { SessionProvider, useSession } from '~/contexts/SessionContext'
import { SpeechProvider } from '~/contexts/SpeechContext'
import { ToastProvider, useToast } from '~/components/ui/Toast'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useRecentTriageSessions, useTriageSessionMutations } from '~/hooks/useTriageSessions'
import { PatientEntryPage } from '~/pages/PatientEntryPage'
import { TriagePage } from '~/pages/TriagePage'
import { LoginPage } from '~/pages/LoginPage'
import { toConvexVitals, toSessionListItem, toTriageSession } from '~/utils/convexMappers'
import type { Patient, SessionListItem, StaffUser, TriageSavePayload, TriageSession } from '~/types'
import type { Id } from '../convex/_generated/dataModel'

// ── Sidebar Layout (persistent shell) ──────────────────────

import { Menu, X, Plus, Inbox } from 'lucide-react'
import { SessionCard } from '~/components/history/SessionCard'

interface ShellProps {
  children: React.ReactNode
  allSessions: SessionListItem[]
  activeSessionId: string | null
  currentStaff: StaffUser | null | undefined
  onSelectSession: (session: SessionListItem) => void
}

function Shell({ children, allSessions, activeSessionId, currentStaff, onSelectSession }: ShellProps) {
  const { resetTriage, setSelectedPatient } = useSession()
  const { signOut } = useAuthActions()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const sessions = allSessions

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

          {currentStaff && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-100 px-2.5 py-2">
              {currentStaff.avatarUrl || currentStaff.image ? (
                <img
                  src={currentStaff.avatarUrl ?? currentStaff.image}
                  alt={currentStaff.name ?? 'Staf IGD'}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                  {(currentStaff.name ?? currentStaff.email ?? 'S').slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate">{currentStaff.name ?? 'Staf IGD'}</p>
                <p className="text-[10px] text-gray-500 truncate">{currentStaff.email}</p>
              </div>
              <button
                onClick={() => void signOut()}
                className="text-[10px] font-semibold text-gray-500 hover:text-red-600"
              >
                Keluar
              </button>
            </div>
          )}

          <button
            onClick={() => {
              resetTriage()
              setSelectedPatient(null)
              navigate('/')
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
  const { state, setSelectedPatient, loadSession } = useSession()
  const { addToast } = useToast()
  const currentStaff = useCurrentUser()
  const recentSessions = useRecentTriageSessions(25) ?? []
  const { createTriageSession, updateTriageSession, getTriageSessionById } = useTriageSessionMutations()

  const sessionListItems: SessionListItem[] = recentSessions.map(toSessionListItem)

  async function handleSelectSession(session: SessionListItem) {
    const full = await getTriageSessionById(session.id as Id<'triageSessions'>)
    loadSession(toTriageSession(full))
  }

  async function handleSaveSession(session: TriageSavePayload): Promise<Id<'triageSessions'> | null> {
    if (!session.convexPatientId) {
      addToast('error', 'Data pasien belum tersimpan di Convex.')
      return null
    }

    const payload = {
      anamnesisText: session.transcript,
      uploadedPhotoStorageIds: session.uploadedPhotoStorageIds ?? [],
      vitalSigns: toConvexVitals(session.vitals),
      generatedTriageNote: session.triageNote ?? undefined,
      status: session.status ?? (session.triageNote ? 'generated' as const : 'draft' as const),
    }

    if (state.viewingSessionId) {
      await updateTriageSession({
        triageSessionId: state.viewingSessionId as Id<'triageSessions'>,
        ...payload,
      })
      addToast('success', 'Sesi triage berhasil diperbarui di Convex.')
      return state.viewingSessionId as Id<'triageSessions'>
    }

    const triageSessionId = await createTriageSession({
      patientId: session.convexPatientId,
      ...payload,
    })

    const savedSession: TriageSession = {
      id: triageSessionId,
      ...session,
      convexPatientId: session.convexPatientId,
      selectedPatient: session.selectedPatient ?? state.selectedPatient,
      uploadedPhotoStorageIds: session.uploadedPhotoStorageIds ?? [],
      timestamp: new Date().toISOString(),
      status: session.status ?? 'generated',
    }
    loadSession(savedSession)
    addToast('success', `Sesi triage pasien ${session.patientName ?? session.patientId} tersimpan di Convex.`)
    return triageSessionId
  }

  return (
    <Routes>
      {/* Page 1: Patient Entry */}
      <Route
        path="/"
        element={
          <PatientEntryPage
            sessions={sessionListItems}
            onPatientIdentified={(patient: Patient) => setSelectedPatient(patient)}
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
            currentStaff={currentStaff}
            onSelectSession={handleSelectSession}
          >
            <TriagePage
              onSaveSession={handleSaveSession}
              onBack={() => {
                setSelectedPatient(null)
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
              <AuthLoading>
                <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
                  Memuat autentikasi...
                </div>
              </AuthLoading>
              <Unauthenticated>
                <LoginPage />
              </Unauthenticated>
              <Authenticated>
                <AppContent />
              </Authenticated>
            </BrowserRouter>
          </SpeechProvider>
        </SessionProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
