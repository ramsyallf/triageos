import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-sm w-full bg-white rounded-2xl border border-red-200 shadow-lg overflow-hidden">
            <div className="bg-red-50 px-6 py-5 border-b border-red-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-800">Terjadi Kesalahan</h2>
                <p className="text-xs text-red-600 mt-0.5">Aplikasi crash secara tidak terduga</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 mb-4">
                Maaf, terjadi kesalahan yang tidak terduga. Silakan muat ulang aplikasi.
              </p>
              {this.state.error && (
                <pre className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-4 overflow-auto max-h-24">
                  {this.state.error.message}
                </pre>
              )}
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Muat Ulang Aplikasi
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
