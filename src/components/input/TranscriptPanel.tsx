import { useRef, useEffect, useState } from 'react'
import { MicButton } from './MicButton'
import { useSpeech } from '~/contexts/SpeechContext'
import { useSession } from '~/contexts/SessionContext'
import { ChevronDown, Info } from 'lucide-react'

// ── Placeholder Examples for Anamnesis ───────────────────────

const EXAMPLE_CATEGORIES = [
  {
    label: '🔴 Nyeri Dada / Jantung',
    value: `Pasien laki-laki 52 tahun, mengeluh nyeri dada seperti tertekan di belakang tulang dada sejak 1 jam yang lalu. Nyeri menjalar ke lengan kiri dan rahang. Disertai keringat dingin, mual, dan sesak napas. Pasien memiliki riwayat hipertensi dan diabetes.`,
  },
  {
    label: '🧒 Demam + Kejang (Anak)',
    value: `Pasien anak 8 tahun, dibawa oleh ibunya, mengeluh demam tinggi 39.5°C sejak 2 jam yang lalu. Saat demam naik, pasien kejang selama 2 menit, mata memutar ke atas, tangan dan kaki kaku. Tidak ada riwayat kejang sebelumnya. BAB normal, masih mau minum ASI.`,
  },
  {
    label: '🟡 Nyeri Perut',
    value: `Pasien perempuan 35 tahun, mengeluh nyeri perut kanan bawah sejak 6 jam yang lalu. Nyeri bersifat terus-menerus, makin hebat saat bergerak. Disertai mual, muntah 2 kali, dan demam 38.2°C. Pasien tidak memiliki riwayat operasi perut sebelumnya.`,
  },
  {
    label: '💥 Trauma / Cedera',
    value: `Pasien laki-laki 28 tahun, jatuh dari motor 2 jam yang lalu. Benturan di kepala bagian belakang. Pasien pusing, mual, muntah 1 kali. Tidak ada kehilangan kesadaran. Luka robek di dahi ±5cm, perdarahan sudah terhenti.`,
  },
  {
    label: '🧠 Stroke / Lumpuh',
    value: `Pasien perempuan 65 tahun, mengeluh mendadak tidak bisa menggerakkan tangan dan kaki kiri sejak 30 menit yang lalu. Mulut mencong ke kanan, bicara pelo. Pasien memiliki riwayat tekanan darah tinggi dan kolesterol.`,
  },
  {
    label: '😮 Sesak Napas / Asma',
    value: `Pasien laki-laki 40 tahun, mengeluh sesak napas sejak 3 jam yang lalu. Riwayat asma sejak kecil. Sesak makin parah saat malam hari, disertai bunyi mengi saat bernapas. Sudah minum obat asma tapi tidak membantu.`,
  },
]

export function TranscriptPanel() {
  const speech = useSpeech()
  const { state, setTranscript } = useSession()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showExamples, setShowExamples] = useState(false)
  const [showTips, setShowTips] = useState(false)

  // Guard against undefined values from context
  const finalTranscript = speech.finalTranscript ?? ''
  const transcript = state.transcript ?? ''
  const interimTranscript = speech.interimTranscript ?? ''

  // Sync new speech final transcripts into session transcript
  const prevFinalRef = useRef('')
  const prevTranscriptRef = useRef('')

  useEffect(() => {
    const currentFinal = finalTranscript
    // Detect only genuinely NEW text appended to speech (not replay)
    if (currentFinal.length > prevFinalRef.current.length) {
      const newText = currentFinal.slice(prevFinalRef.current.length)
      // Append new speech text to manual transcript
      const combined = transcript ? `${transcript} ${newText}` : newText
      setTranscript(combined)
    }
    prevFinalRef.current = currentFinal
    prevTranscriptRef.current = transcript
  }, [finalTranscript, transcript, setTranscript])

  // Auto-scroll textarea on interim results
  useEffect(() => {
    const el = textareaRef.current
    if (el && interimTranscript) {
      el.scrollTop = el.scrollHeight
    }
  }, [interimTranscript])

  // Display: interim if listening, else session transcript
  const displayValue =
    speech.status === 'listening'
      ? (transcript
          ? `${transcript}${interimTranscript ? ` ${interimTranscript}` : ''}`
          : interimTranscript)
      : transcript

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTranscript(e.target.value)
    // Update ref to prevent re-syncing old speech text
    prevFinalRef.current = finalTranscript
  }

  const handleSelectExample = (example: string) => {
    setTranscript(example)
    // Update ref to prevent re-syncing old speech text
    prevFinalRef.current = finalTranscript
    setShowExamples(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Example Selector & Tips Buttons */}
      {speech.status !== 'listening' && (
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setShowExamples(!showExamples)
                setShowTips(false)
              }}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200',
              ].join(' ')}
            >
              <span>📋 Contoh Anamnesis</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>

            {/* Example Dropdown */}
            {showExamples && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                  <p className="text-[10px] text-gray-500 font-medium">Klik untuk menggunakan contoh:</p>
                </div>
                {EXAMPLE_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectExample(cat.value)}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50 text-xs transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <span className="font-medium text-gray-700">{cat.label}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                      {cat.value.slice(0, 80)}...
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowTips(!showTips)
              setShowExamples(false)
            }}
            className={[
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
              showTips
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200',
            ].join(' ')}
          >
            <Info className="h-3 w-3" />
            <span>Tips Anamnesis</span>
          </button>
        </div>
      )}

      {/* Tips Panel */}
      {showTips && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-[11px] text-blue-800">
          <p className="font-semibold text-blue-900 mb-1.5">📝 Format Anamnesis yang Baik (S-O-P-Q-R-S-T):</p>
          <ul className="space-y-0.5 text-blue-700">
            <li><span className="font-medium">S</span> — Siapa & usia, jenis kelamin</li>
            <li><span className="font-medium">O</span> — Onset, kapan mulai, berapa lama</li>
            <li><span className="font-medium">P</span> — Provokatif/palliatif, apa yang memicu/meringankan</li>
            <li><span className="font-medium">Q</span> — Quality, seperti apa sakitnya (tajam/tumpul/menekan?)</li>
            <li><span className="font-medium">R</span> — Region/radiation, di mana, menjalar ke mana</li>
            <li><span className="font-medium">S</span> — Severity, skala nyeri 0-10</li>
            <li><span className="font-medium">T</span> — Time, apakah berubah seiring waktu</li>
          </ul>
          <p className="mt-2 pt-2 border-t border-blue-100 text-[10px] text-blue-600">
            💡 Jangan lupa cantumkan: <span className="font-medium">riwayat penyakit</span>, <span className="font-medium">alergi obat</span>, dan <span className="font-medium">obat yang sedang diminum</span>.
          </p>
        </div>
      )}

      {/* Textarea */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={handleTextChange}
            placeholder={
              speech.status === 'listening'
                ? 'Sedang mendengarkan...'
                : 'Ketik detail keluhan pasien di sini atau aktifkan mikrofon untuk perekaman otomatis.'
            }
            rows={6}
            className={[
              'w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-xl border resize-none custom-scrollbar',
              'placeholder:text-gray-400 placeholder:text-xs sm:placeholder:text-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-colors duration-150',
              'bg-white border-gray-200 hover:border-gray-300',
            ].join(' ')}
          />
        </div>

        {/* Mic Button */}
        <div className="flex sm:flex-col justify-center sm:justify-start sm:pt-1">
          <MicButton
            status={speech.status}
            isAvailable={speech.isAvailable}
            onToggle={speech.toggle}
          />
          {speech.status === 'unavailable' && (
            <p className="text-xs text-red-500 mt-2 text-center sm:max-w-[56px] leading-tight hidden sm:block">
              Mic tidak tersedia
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
