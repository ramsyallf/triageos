import { useState, type FormEvent } from 'react'
import { useMutation } from 'convex/react'
import { Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { StaffUser } from '~/types'

interface LoginPageProps {
  onAuthenticated: (staff: StaffUser) => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const loginWithEmailPassword = useMutation(api.users.loginWithEmailPassword)
  const createStaffWithEmailPassword = useMutation(api.users.createStaffWithEmailPassword)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const staff = mode === 'login'
        ? await loginWithEmailPassword({ email, password })
        : await createStaffWithEmailPassword({ name, email, password, role: 'staff' })
      onAuthenticated(staff)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk. Periksa email dan password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src="/TriageOS svgLogo.svg"
            alt="TriageOS Logo"
            className="h-16 sm:h-20 w-auto mx-auto object-contain"
          />
          <p className="text-sm text-gray-500 mt-3">Asisten triage IGD untuk dokter dan staf klinis</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-primary-600 px-6 py-4">
            <h1 className="text-base font-semibold text-white">
              {mode === 'login' ? 'Masuk ke TriageOS' : 'Buat Akun Staf'}
            </h1>
            <p className="text-xs text-primary-100 mt-0.5">Khusus dokter, perawat, dan staf IGD.</p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {mode === 'register' && (
              <label className="block">
                <span className="text-xs font-medium text-gray-600">Nama staf</span>
                <div className="relative mt-1">
                  <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Nama dokter/staf"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Email</span>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="nama@rumahsakit.id"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-600">Password</span>
              <div className="relative mt-1">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={4}
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Password"
                />
              </div>
            </label>

            {error && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            >
              {isLoading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Buat Akun'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="w-full text-xs font-semibold text-primary-700 hover:text-primary-800"
            >
              {mode === 'login' ? 'Belum punya akun staf? Buat akun' : 'Sudah punya akun? Masuk'}
            </button>

            <div className="flex items-start gap-2 rounded-xl bg-primary-50 border border-primary-100 px-3 py-3">
              <ShieldCheck className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary-800 leading-relaxed">
                Password disimpan sebagai hash MD5 sesuai konfigurasi sementara. Pasien tetap dicari dari data Convex.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
