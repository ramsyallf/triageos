import { useCallback, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

export interface UploadedImageResult {
  previewDataUrl: string
  storageId: Id<'_storage'>
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.readAsDataURL(file)
  })
}

export function useConvexImageUpload() {
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const saveUploadedImageMetadata = useMutation(api.uploads.saveUploadedImageMetadata)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImages = useCallback(
    async (files: FileList | File[]): Promise<UploadedImageResult[]> => {
      const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'))
      if (fileArray.length === 0) {
        setError('Tidak ada file gambar yang valid.')
        return []
      }

      const oversize = fileArray.find((file) => file.size > MAX_FILE_SIZE_BYTES)
      if (oversize) {
        setError(`"${oversize.name}" terlalu besar. Maksimal 5 MB.`)
        return []
      }

      setIsUploading(true)
      setError(null)

      try {
        const uploaded = await Promise.all(
          fileArray.map(async (file) => {
            const [uploadUrl, previewDataUrl] = await Promise.all([
              generateUploadUrl(),
              readAsDataUrl(file),
            ])
            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: { 'Content-Type': file.type },
              body: file,
            })

            if (!response.ok) {
              throw new Error('Gagal mengunggah gambar.')
            }

            const { storageId } = (await response.json()) as { storageId: Id<'_storage'> }
            await saveUploadedImageMetadata({
              storageId,
              fileName: file.name,
              contentType: file.type,
              size: file.size,
            })
            return { previewDataUrl, storageId }
          })
        )
        return uploaded
      } catch {
        setError('Gagal mengunggah gambar ke Convex Storage.')
        return []
      } finally {
        setIsUploading(false)
      }
    },
    [generateUploadUrl, saveUploadedImageMetadata]
  )

  return { uploadImages, isUploading, error }
}
