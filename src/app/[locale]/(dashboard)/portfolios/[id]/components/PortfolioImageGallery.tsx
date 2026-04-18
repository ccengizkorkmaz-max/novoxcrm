'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { uploadPortfolioImage, deletePortfolioImage, setCoverImage } from '../../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ImagePlus, Trash2, Star, StarOff, Loader2, X, Camera } from 'lucide-react'

interface Props {
    portfolioId: string
    images: Array<{
        id: string
        url: string
        is_cover: boolean
        caption: string | null
        order_index: number
    }>
}

export function PortfolioImageGallery({ portfolioId, images }: Props) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

    const sortedImages = [...images].sort((a, b) => {
        if (a.is_cover && !b.is_cover) return -1
        if (!a.is_cover && b.is_cover) return 1
        return a.order_index - b.order_index
    })

    async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        const totalFiles = files.length
        let uploaded = 0

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                if (file.size > 10 * 1024 * 1024) {
                    toast.error(`${file.name}: Dosya 10MB'dan büyük olamaz`)
                    continue
                }

                // Convert to base64
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                const isCover = images.length === 0 && i === 0 // First image is cover if no images
                await uploadPortfolioImage(portfolioId, base64, file.name, isCover)
                uploaded++
                toast.success(`${file.name} yüklendi (${uploaded}/${totalFiles})`)
            }

            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Görsel yüklenemedi')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleDelete(imageId: string) {
        setDeletingId(imageId)
        try {
            await deletePortfolioImage(imageId, portfolioId)
            toast.success('Görsel silindi')
            router.refresh()
        } catch {
            toast.error('Silinemedi')
        } finally {
            setDeletingId(null)
        }
    }

    async function handleSetCover(imageId: string) {
        try {
            await setCoverImage(imageId, portfolioId)
            toast.success('Kapak görseli güncellendi')
            router.refresh()
        } catch {
            toast.error('Güncellenemedi')
        }
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Camera className="h-4 w-4 text-emerald-600" />
                        Görseller
                        <Badge variant="outline" className="text-[10px] ml-1">
                            {images.length} görsel
                        </Badge>
                    </CardTitle>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            multiple
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Yükleniyor...</>
                            ) : (
                                <><ImagePlus className="h-3.5 w-3.5" /> Görsel Ekle</>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {sortedImages.length === 0 ? (
                    <div
                        className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-500">Görsel eklemek için tıklayın</p>
                        <p className="text-xs text-muted-foreground mt-1">JPG, PNG veya WebP • Maks. 10MB • Çoklu yükleme desteklenir</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {sortedImages.map((img, idx) => (
                            <div
                                key={img.id}
                                className="group relative rounded-xl overflow-hidden border shadow-sm aspect-[4/3] cursor-pointer"
                                onClick={() => setSelectedImageIndex(idx)}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                                {img.is_cover && (
                                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-bold border-none gap-1">
                                        <Star className="h-2.5 w-2.5" /> Kapak
                                    </Badge>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                    {!img.is_cover && (
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="h-8 w-8 bg-white/90 hover:bg-white"
                                            onClick={(e) => { e.stopPropagation(); handleSetCover(img.id) }}
                                            title="Kapak yap"
                                        >
                                            <Star className="h-3.5 w-3.5 text-amber-500" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 bg-white/90 hover:bg-red-50"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}
                                        disabled={deletingId === img.id}
                                        title="Sil"
                                    >
                                        {deletingId === img.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {/* Upload new tile */}
                        <div
                            className="rounded-xl border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-8 w-8 text-slate-300 mb-1" />
                            <span className="text-[10px] text-slate-400 font-bold">Ekle</span>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Lightbox */}
            {selectedImageIndex !== null && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setSelectedImageIndex(null)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/20 h-10 w-10"
                        onClick={() => setSelectedImageIndex(null)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <img
                        src={sortedImages[selectedImageIndex]?.url}
                        alt=""
                        className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {sortedImages.length > 1 && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                            {sortedImages.map((img, idx) => (
                                <button
                                    key={img.id}
                                    className={`h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                                        idx === selectedImageIndex ? 'border-emerald-400 scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                                    }`}
                                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx) }}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="absolute bottom-6 right-6 text-white/60 text-sm">
                        {selectedImageIndex + 1} / {sortedImages.length}
                    </div>
                </div>
            )}
        </Card>
    )
}
