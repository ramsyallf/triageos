import { useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const { signIn } = useAuthActions()
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleLogin() {
    setIsLoading(true)
    try {
      await signIn('google')
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
            <h1 className="text-base font-semibold text-white">Masuk ke TriageOS</h1>
            <p className="text-xs text-primary-100 mt-0.5">Khusus dokter, perawat, dan staf IGD.</p>
          </div>

          <div className="px-6 py-6 space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={[
                'w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl',
                'border border-gray-200 bg-white text-gray-800 text-sm font-semibold',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                'disabled:opacity-60 disabled:cursor-not-allowed',
              ].join(' ')}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 text-xs font-bold text-red-500">
                G
              </span>
              {isLoading ? 'Menghubungkan...' : 'Continue with Google'}
            </button>

            <div className="flex items-start gap-2 rounded-xl bg-primary-50 border border-primary-100 px-3 py-3">
              <ShieldCheck className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-primary-800 leading-relaxed">
                Akun Google hanya digunakan untuk identitas staf. Pasien dicari dari data yang sudah ada di Convex.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
