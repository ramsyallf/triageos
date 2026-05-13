import { useEffect, useRef } from 'react'
import { Activity } from 'lucide-react'
import { useSession } from '~/contexts/SessionContext'
import { useGeminiTriage } from '~/hooks/useGeminiTriage'
import { useConvexImageUpload } from '~/hooks/useConvexImageUpload'
import { TranscriptPanel } from '~/components/input/TranscriptPanel'
import { ImageAttachmentPanel } from '~/components/input/ImageAttachmentPanel'
import { VitalSignsForm } from '~/components/triage/VitalSignsForm'
import { TriageResult } from '~/components/triage/TriageResult'
import { GenerateButton } from '~/components/triage/GenerateButton'
import { Card, CardHeader, CardBody } from '~/components/ui/Card'
import { useToast } from '~/components/ui/Toast'
import type { Patient, TriageSessionStatus, VitalSignsInput } from '~/types'
import type { Id } from '../../../convex/_generated/dataModel'

interface TriageFormProps {
  onSaveSession: (session: {
    patientId: string
    convexPatientId?: Id<'patients'> | null
    selectedPatient?: Patient | null
    patientName?: string
    transcript: string
    images: string[]
    uploadedPhotoStorageIds?: Id<'_storage'>[]
    triageNote: import('~/types').TriageNote | null
    esiLevel: number | null
    vitals: VitalSignsInput
    status?: TriageSessionStatus
  }) => Promise<Id<'triageSessions'> | null>
  onResultChange?: (result: import('~/types').TriageNote | null) => void
}

export function TriageForm({ onSaveSession, onResultChange }: TriageFormProps) {
  const { state, setTriageNote, addImage, removeImage, setVitals, canGenerate } = useSession()
  const { generate, result, setResult, loading, error } = useGeminiTriage()
  const { uploadImages, isUploading, error: uploadError } = useConvexImageUpload()
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
      await onSaveSession({
        patientId: state.patientId,
        convexPatientId: state.convexPatientId,
        selectedPatient: state.selectedPatient,
        patientName: state.patientName || undefined,
        transcript: combinedTranscript,
        images,
        uploadedPhotoStorageIds: state.uploadedPhotoStorageIds,
        triageNote: genResult,
        esiLevel: genResult.esiLevel,
        vitals: state.vitals,
        status: 'generated',
      })
      addToast('success', 'Hasil triage otomatis tersimpan ke Convex.')
    }
    onResultChangeRef.current?.(genResult)
  }

  async function handleAddImages(files: FileList | File[]) {
    const uploadedImages = await uploadImages(files)
    uploadedImages.forEach((image) => addImage(image.previewDataUrl, image.storageId))
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
    void onSaveSession({
      patientId: state.patientId,
      convexPatientId: state.convexPatientId,
      selectedPatient: state.selectedPatient,
      patientName: state.patientName || undefined,
      transcript: combinedTranscript,
      images: images,
      uploadedPhotoStorageIds: state.uploadedPhotoStorageIds,
      triageNote: noteToSave,
      esiLevel: noteToSave.esiLevel,
      vitals: state.vitals,
      status: 'completed',
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
          {isUploading && (
            <p className="text-xs text-primary-600 mt-2">Mengunggah gambar ke Convex Storage...</p>
          )}
          {uploadError && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 mt-2">
              {uploadError}
            </p>
          )}
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
