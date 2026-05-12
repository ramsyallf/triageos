import { useState, useCallback } from 'react'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

interface UseImageUploadReturn {
  images: string[]
  addImages: (files: FileList | File[]) => void
  removeImage: (index: number) => void
  clearImages: () => void
  error: string | null
}

/**
 * Handles file selection → base64 conversion with 5 MB size cap.
 */
export function useImageUpload(): UseImageUploadReturn {
  const [images, setImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      setError('Tidak ada file gambar yang valid.')
      return
    }

    let hasOversize = false
    const validFiles: File[] = []
    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`"${file.name}" terlalu besar. Maksimal 5 MB.`)
        hasOversize = true
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0 && !hasOversize) {
      setError('Tidak ada file gambar yang valid.')
      return
    }

    Promise.all(
      validFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target?.result as string)
            reader.readAsDataURL(file)
          })
      )
    ).then((results) => {
      setImages((prev) => [...prev, ...results])
      setError(null)
    })
  }, [])

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearImages = useCallback(() => {
    setImages([])
  }, [])

  return { images, addImages, removeImage, clearImages, error }
}
