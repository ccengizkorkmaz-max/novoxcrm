'use client'

import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Camera,
    Upload,
    X,
    Trash2,
    Loader2,
    ZoomIn,
    ImagePlus,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Download
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { uploadConstructionPhotos, deleteConstructionPhoto } from '@/app/[locale]/(dashboard)/projects/[id]/documents-actions'

interface ConstructionPhoto {
    id: string
    file_url: string
    file_name: string
    document_name: string
    description: string | null
    created_at: string
    uploader_name?: string
}

interface ConstructionGalleryProps {
    projectId: string
    photos: ConstructionPhoto[]
    isAdmin: boolean
}

export function ConstructionGallery({ projectId, photos: initialPhotos, isAdmin }: ConstructionGalleryProps) {
    const [photos, setPhotos] = useState<ConstructionPhoto[]>(initialPhotos)
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [caption, setCaption] = useState('')
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [showUploadArea, setShowUploadArea] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Group photos by date
    const photosByDate = photos.reduce((acc, photo) => {
        const date = new Date(photo.created_at).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(photo)
        return acc
    }, {} as Record<string, ConstructionPhoto[]>)

    const handleFileSelect = useCallback((files: FileList | File[]) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
        if (imageFiles.length === 0) {
            toast.error('Lütfen resim dosyası seçin.')
            return
        }
        setSelectedFiles(prev => [...prev, ...imageFiles])
        // Generate preview URLs
        const newPreviews = imageFiles.map(f => URL.createObjectURL(f))
        setPreviewUrls(prev => [...prev, ...newPreviews])
    }, [])

    const removeSelectedFile = (index: number) => {
        URL.revokeObjectURL(previewUrls[index])
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        setIsUploading(true)
        try {
            // Upload via Supabase Storage directly from client (bypass Vercel limits)
            const supabase = createClient()
            const uploadedPhotos: ConstructionPhoto[] = []

            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
                const filePath = `construction-photos/${projectId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('crm-images')
                    .upload(filePath, file)

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    toast.error(`${file.name} yüklenemedi`)
                    continue
                }

                const { data: urlData } = supabase.storage
                    .from('crm-images')
                    .getPublicUrl(filePath)

                uploadedPhotos.push({
                    id: `temp-${Date.now()}-${Math.random()}`,
                    file_url: urlData.publicUrl,
                    file_name: file.name,
                    document_name: caption || `Şantiye Fotoğrafı - ${new Date().toLocaleDateString('tr-TR')}`,
                    description: caption,
                    created_at: new Date().toISOString(),
                    uploader_name: 'Siz'
                })
            }

            // Save metadata via server action
            const formData = new FormData()
            selectedFiles.forEach(f => formData.append('photos', f))
            if (caption) formData.set('caption', caption)

            const result = await uploadConstructionPhotos(projectId, formData)

            if (result?.success) {
                toast.success(`${result.uploaded}/${result.total} fotoğraf başarıyla yüklendi!`)
                // Cleanup
                previewUrls.forEach(url => URL.revokeObjectURL(url))
                setSelectedFiles([])
                setPreviewUrls([])
                setCaption('')
                setShowUploadArea(false)
                // Reload to get fresh data
                window.location.reload()
            } else {
                toast.error(result?.error || 'Yükleme başarısız.')
            }
        } catch (err) {
            console.error('Upload error:', err)
            toast.error('Bir hata oluştu.')
        } finally {
            setIsUploading(false)
        }
    }

    const handleDelete = async (photoId: string) => {
        if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return

        const result = await deleteConstructionPhoto(photoId, projectId)
        if (result?.success) {
            setPhotos(prev => prev.filter(p => p.id !== photoId))
            toast.success('Fotoğraf silindi.')
            if (lightboxIndex !== null) setLightboxIndex(null)
        } else {
            toast.error(result?.error || 'Silme başarısız.')
        }
    }

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }
    const handleDragLeave = () => setIsDragOver(false)
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files)
    }

    // Lightbox navigation
    const openLightbox = (index: number) => setLightboxIndex(index)
    const closeLightbox = () => setLightboxIndex(null)
    const prevImage = () => setLightboxIndex(prev => prev !== null ? (prev - 1 + photos.length) % photos.length : null)
    const nextImage = () => setLightboxIndex(prev => prev !== null ? (prev + 1) % photos.length : null)

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Camera className="w-5 h-5 text-primary" />
                            Şantiye Fotoğrafları
                        </CardTitle>
                        <CardDescription>
                            Projeye ait güncel şantiye ve inşaat fotoğrafları.
                            {photos.length > 0 && (
                                <Badge variant="secondary" className="ml-2">{photos.length} fotoğraf</Badge>
                            )}
                        </CardDescription>
                    </div>
                    {isAdmin && (
                        <Button onClick={() => setShowUploadArea(!showUploadArea)} variant={showUploadArea ? "secondary" : "default"}>
                            {showUploadArea ? (
                                <><X className="w-4 h-4 mr-2" />İptal</>
                            ) : (
                                <><ImagePlus className="w-4 h-4 mr-2" />Fotoğraf Ekle</>
                            )}
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Upload Area */}
                    {showUploadArea && (
                        <div className="space-y-4 p-4 border-2 border-dashed rounded-xl bg-muted/30 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* Drop zone */}
                            <div
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
                                    isDragOver
                                        ? 'border-primary bg-primary/5 scale-[1.01]'
                                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className={`w-10 h-10 mb-3 ${isDragOver ? 'text-primary' : 'text-muted-foreground/50'}`} />
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fotoğrafları sürükleyip bırakın veya <span className="text-primary font-semibold">dosya seçin</span>
                                </p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    JPG, PNG, WebP — Birden fazla dosya seçebilirsiniz
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                                />
                            </div>

                            {/* Selected files preview */}
                            {previewUrls.length > 0 && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {previewUrls.map((url, i) => (
                                            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                                                <img src={url} alt="" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeSelectedFile(i) }}
                                                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1.5 py-0.5">
                                                    <p className="text-[9px] text-white truncate">{selectedFiles[i]?.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Caption */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-medium">Açıklama (opsiyonel)</Label>
                                        <Input
                                            placeholder="Örn: 3. kat kaba inşaat tamamlandı"
                                            value={caption}
                                            onChange={(e) => setCaption(e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>

                                    {/* Upload button */}
                                    <Button onClick={handleUpload} disabled={isUploading} className="w-full">
                                        {isUploading ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Yükleniyor...</>
                                        ) : (
                                            <><Upload className="w-4 h-4 mr-2" />{selectedFiles.length} Fotoğraf Yükle</>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Gallery */}
                    {photos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <Camera className="w-16 h-16 mb-4 opacity-15" />
                            <p className="text-lg font-medium">Henüz şantiye fotoğrafı yüklenmemiş</p>
                            <p className="text-sm mt-1">Güncel şantiye görüntülerini eklemek için "Fotoğraf Ekle" butonunu kullanın.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {Object.entries(photosByDate).map(([date, datePhotos]) => (
                                <div key={date}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <CalendarDays className="w-4 h-4 text-muted-foreground" />
                                        <h3 className="text-sm font-semibold text-muted-foreground">{date}</h3>
                                        <Badge variant="outline" className="text-[10px]">{datePhotos.length}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        {datePhotos.map((photo) => {
                                            const globalIndex = photos.findIndex(p => p.id === photo.id)
                                            return (
                                                <div
                                                    key={photo.id}
                                                    className="group relative aspect-square rounded-xl overflow-hidden border bg-muted cursor-pointer shadow-sm hover:shadow-lg transition-all hover:scale-[1.02]"
                                                    onClick={() => openLightbox(globalIndex)}
                                                >
                                                    <img
                                                        src={photo.file_url}
                                                        alt={photo.document_name}
                                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                        loading="lazy"
                                                    />
                                                    {/* Hover overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-0 left-0 right-0 p-2">
                                                            <p className="text-[11px] text-white/90 truncate font-medium">{photo.description || photo.document_name}</p>
                                                            <p className="text-[9px] text-white/60">
                                                                {new Date(photo.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                                                {photo.uploader_name && ` · ${photo.uploader_name}`}
                                                            </p>
                                                        </div>
                                                        {/* Zoom icon */}
                                                        <div className="absolute top-2 right-2">
                                                            <ZoomIn className="w-5 h-5 text-white/80" />
                                                        </div>
                                                        {/* Delete button */}
                                                        {isAdmin && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
                                                                className="absolute top-2 left-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                                                                title="Fotoğrafı Sil"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Lightbox */}
            {lightboxIndex !== null && photos[lightboxIndex] && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                        onClick={closeLightbox}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Nav prev */}
                    {photos.length > 1 && (
                        <button
                            className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                            onClick={(e) => { e.stopPropagation(); prevImage() }}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {/* Image */}
                    <div className="max-w-[90vw] max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={photos[lightboxIndex].file_url}
                            alt={photos[lightboxIndex].document_name}
                            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="mt-4 text-center">
                            <p className="text-white font-medium">
                                {photos[lightboxIndex].description || photos[lightboxIndex].document_name}
                            </p>
                            <p className="text-white/60 text-sm mt-1">
                                {new Date(photos[lightboxIndex].created_at).toLocaleDateString('tr-TR', {
                                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                                {photos[lightboxIndex].uploader_name && ` · ${photos[lightboxIndex].uploader_name}`}
                            </p>
                            <div className="flex items-center justify-center gap-3 mt-3">
                                <span className="text-white/40 text-xs">{lightboxIndex + 1} / {photos.length}</span>
                                <a
                                    href={photos[lightboxIndex].file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" /> İndir
                                </a>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(photos[lightboxIndex!].id)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Sil
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Nav next */}
                    {photos.length > 1 && (
                        <button
                            className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
                            onClick={(e) => { e.stopPropagation(); nextImage() }}
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}
        </>
    )
}
