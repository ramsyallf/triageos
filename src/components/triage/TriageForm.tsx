import { useEffect, useRef } from 'react'
import { Activity } from 'lucide-react'
import { useSession } from '~/contexts/SessionContext'
import { useGeminiTriage } from '~/hooks/useGeminiTriage'
import { TranscriptPanel } from '~/components/input/TranscriptPanel'
import { ImageAttachmentPanel } from '~/components/input/ImageAttachmentPanel'
import { VitalSignsForm } from '~/components/triage/VitalSignsForm'
import { TriageResult } from '~/components/triage/TriageResult'
import { GenerateButton } from '~/components/triage/GenerateButton'
import { Card, CardHeader, CardBody } from '~/components/ui/Card'
import { useToast } from '~/components/ui/Toast'
import type { VitalSignsInput } from '~/types'

interface TriageFormProps {
  onSaveSession: (session: {
    patientId: string
    patientName?: string
    transcript: string
    images: string[]
    triageNote: import('~/types').TriageNote | null
    esiLevel: number | null
    vitals: VitalSignsInput
  }) => void
  onResultChange?: (result: import('~/types').TriageNote | null) => void
}

export function TriageForm({ onSaveSession, onResultChange }: TriageFormProps) {
  const { state, setTriageNote, addImage, removeImage, setVitals, canGenerate } = useSession()
  const { generate, result, setResult, loading, error } = useGeminiTriage()
  const { addToast } = useToast()

  // Use ref to get latest onResultChange without causing effect re-runs
  const onResultChangeRef = useRef(onResultChange)
  onResultChangeRef.current = onResultChange

  // Restore result when loading a session from history
  useEffect(() => {
    if (state.triageNote && !result) {
      setResult(state.triageNote)
      onResultChangeRef.current?.(state.triageNote)
    }
  }, [state.triageNote, result, setResult])

  // Clear result when resetTriage is called (patient change or Sesi Baru)
  useEffect(() => {
    if (state.triageNote === null && result !== null && !loading) {
      setResult(null)
      onResultChangeRef.current?.(null)
    }
  }, [state.triageNote, loading, result, setResult])

  // Transcript is already synced by TranscriptPanel — use as single source to avoid duplication
  const transcript = state.transcript ?? ''
  const images = state.images ?? []

  const combinedTranscript = transcript

  async function handleGenerate() {
    if (!canGenerate) return
    const { result: genResult } = await generate(
      combinedTranscript,
      images,
      state.vitals
    )
    if (genResult) {
      // Simpan result ke SessionContext agar tidak hilang saat effect clear berjalan
      setTriageNote(genResult)
    }
    onResultChangeRef.current?.(genResult)
  }

  function handleAddImages(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          addImage(base64)
        }
        reader.readAsDataURL(file)
      }
    })
  }

  function handleRemoveImage(index: number) {
    removeImage(index)
  }

  function handleVitalsChange(updated: Partial<VitalSignsInput>) {
    setVitals(updated)
  }

  function handleSave() {
    const noteToSave = result
    if (!noteToSave) return
    onSaveSession({
      patientId: state.patientId,
      patientName: state.patientName || undefined,
      transcript: combinedTranscript,
      images: images,
      triageNote: noteToSave,
      esiLevel: noteToSave.esiLevel,
      vitals: state.vitals,
    })
    addToast('success', 'Sesi triage berhasil disimpan ke riwayat.')
    // Clear form after save
    setTriageNote(noteToSave)
  }

  function handleEditNote(updated: import('~/types').TriageNote) {
    setTriageNote(updated)
    addToast('info', 'Hasil triage telah diperbarui.')
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Transcript Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
            <span className="text-sm sm:text-base font-semibold text-gray-800">Anamnesis</span>
          </div>
        </CardHeader>
        <CardBody>
          <TranscriptPanel />
        </CardBody>
      </Card>

      {/* Image Attachment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Lampiran Foto</span>
          </div>
        </CardHeader>
        <CardBody>
          <ImageAttachmentPanel
            images={images}
            addImages={handleAddImages}
            removeImage={handleRemoveImage}
            error={null}
          />
        </CardBody>
      </Card>

      {/* Vital Signs */}
      <Card>
        <CardBody>
          <VitalSignsForm
            vitals={state.vitals}
            onChange={handleVitalsChange}
          />
        </CardBody>
      </Card>

      {/* Generate Button */}
      <GenerateButton
        canGenerate={canGenerate && !state.viewingSessionId}
        isLoading={loading}
        onClick={handleGenerate}
      />

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result — hidden at xl (rendered by TriagePage on desktop) */}
      {result && (
        <div className="xl:hidden">
          <TriageResult
            note={result}
            onSave={state.viewingSessionId ? undefined : handleSave}
            onEdit={handleEditNote}
          />
        </div>
      )}
    </div>
  )
}