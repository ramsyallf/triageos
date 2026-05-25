import { useRef, useState } from 'react'
import { Camera, X, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface ImageAttachmentPanelProps {
    images: string[]
    addImages: (files: FileList | File[]) => void
    removeImage: (index: number) => void
    error: string | null
}

export function ImageAttachmentPanel({ images, addImages, removeImage, error }: ImageAttachmentPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files.length > 0) {
            addImages(e.target.files)
            e.target.value = ''
        }
    }

    function openLightbox(src: string) {
        setSelectedImage(src)
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    function closeLightbox() {
        setSelectedImage(null)
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setIsDragging(false)
    }

    function handleZoomIn() {
        setZoom((prev) => Math.min(prev + 0.5, 5))
    }

    function handleZoomOut() {
        setZoom((prev) => Math.max(prev - 0.5, 0.5))
    }

    function handleResetZoom() {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }

    function handleMouseDown(e: React.MouseEvent) {
        if (zoom > 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        }
    }

    function handleMouseMove(e: React.MouseEvent) {
        if (isDragging && zoom > 1) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            })
        }
    }

    function handleMouseUp() {
        setIsDragging(false)
    }

    return (
        <div className="space-y-3">
            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex flex-col"
                    onClick={closeLightbox}
                >
                    {/* Header Controls */}
                    <div className="flex items-center justify-between px-4 py-3 bg-black/50">
                        <p className="text-white text-sm font-medium">Pratinjau Gambar</p>
                        <div className="flex items-center gap-2">
                            {/* Zoom Controls */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleZoomOut() }}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Perkecil"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </button>
                            <span className="text-white text-sm font-medium w-16 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleZoomIn() }}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Perbesar"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleResetZoom() }}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Reset"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </button>
                            <div className="w-px h-6 bg-white/20 mx-1" />
                            <button
                                onClick={(e) => { e.stopPropagation(); closeLightbox() }}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                                title="Tutup"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Image Container */}
                    <div
                        className="flex-1 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img
                            src={selectedImage}
                            alt="Preview"
                            className="max-w-full max-h-full select-none"
                            style={{
                                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                            }}
                            draggable={false}
                        />
                    </div>

                    {/* Footer hint */}
                    <div className="px-4 py-2 bg-black/50 text-center">
                        <p className="text-white/60 text-xs">
                            {zoom > 1 ? 'Geser untuk memindahkan • Klik tanda × untuk menutup' : 'Klik gambar untuk memperbesar'}
                        </p>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className={[
                    'w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl',
                    'border-2 border-dashed border-gray-300 text-gray-600',
                    'hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50',
                    'transition-colors duration-150 cursor-pointer',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
                ].join(' ')}
            >
                <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs sm:text-sm font-medium">Ambil / Unggah Foto</span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Error */}
            {error && (
                <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    {error}
                </p>
            )}

            {/* Image count */}
            {images.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {images.length} gambar terlampir
                        <span className="text-gray-400 ml-1">(maks 5 MB/gambar)</span>
                    </p>
                    <button
                        type="button"
                        onClick={() => images.forEach((_, i) => removeImage(i))}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                    >
                        Hapus semua
                    </button>
                </div>
            )}

            {/* Thumbnail Grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                            <img
                                src={src}
                                alt={`Lampiran ${i + 1}`}
                                className="w-full h-full object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openLightbox(src)}
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => openLightbox(src)}
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-700 transition-colors"
                                    title="Perbesar"
                                >
                                    <ZoomIn className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeImage(i)}
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 hover:text-red-700 transition-colors"
                                    title="Hapus gambar"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state hint */}
            {images.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                    <ImageIcon className="h-4 w-4" />
                    <span>
                        Lampirkan foto luka, hasil EKG, atau monitor vital untuk analisis multimodal.
                    </span>
                </div>
            )}
        </div>
    )
}
