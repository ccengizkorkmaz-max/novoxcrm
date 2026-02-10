'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ImagePlus, Trash2, Star, X } from 'lucide-react'
import { uploadUnitImage, deleteUnitImage } from '../../actions'

interface UnitImageGalleryProps {
    unitId: string
    projectId: string
    images: any[]
    disabled?: boolean
}

export function UnitImageGallery({ unitId, projectId, images, disabled }: UnitImageGalleryProps) {
    const [uploading, setUploading] = useState(false)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('unit_id', unitId)
        formData.append('project_id', projectId)
        formData.append('is_cover', images.length === 0 ? 'true' : 'false')

        const result = await uploadUnitImage(formData)
        setUploading(false)

        if (result.success) {
            toast.success('Görsel başarıyla yüklendi.')
        } else {
            toast.error(result.error || 'Yükleme başarısız.')
        }
    }

    const handleDelete = async (imageId: string) => {
        if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return

        const result = await deleteUnitImage(imageId, unitId)
        if (result.success) {
            toast.success('Görsel silindi.')
        } else {
            toast.error(result.error || 'Silme başarısız.')
        }
    }

    const coverImage = images.find((img: any) => img.is_cover) || images[0]

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <ImagePlus className="h-4 w-4 text-primary" />
                        Ünite Görselleri ({images.length})
                    </CardTitle>
                    {!disabled && (
                        <Label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 rounded-md transition-colors">
                                <ImagePlus className="h-3.5 w-3.5" />
                                {uploading ? 'Yükleniyor...' : 'Görsel Ekle'}
                            </div>
                            <Input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                                disabled={uploading || disabled}
                            />
                        </Label>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {images.length > 0 ? (
                    <div className="space-y-3">
                        {/* Cover image large */}
                        {coverImage && (
                            <div
                                className="relative aspect-video rounded-lg overflow-hidden cursor-pointer bg-muted group"
                                onClick={() => setSelectedImage(coverImage.image_url)}
                            >
                                <img
                                    src={coverImage.image_url}
                                    alt={coverImage.caption || 'Ünite görseli'}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute top-2 left-2">
                                    <Badge className="bg-yellow-500 text-white text-[9px]">
                                        <Star className="h-2.5 w-2.5 mr-1" /> Kapak
                                    </Badge>
                                </div>
                            </div>
                        )}

                        {/* Thumbnail grid */}
                        <div className="grid grid-cols-4 gap-2">
                            {images.map((img: any) => (
                                <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden bg-muted">
                                    <img
                                        src={img.image_url}
                                        alt={img.caption || ''}
                                        className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-110"
                                        onClick={() => setSelectedImage(img.image_url)}
                                    />
                                    {!disabled && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(img.id) }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground rounded-lg border-2 border-dashed">
                        <ImagePlus className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs">Henüz görsel eklenmemiş</p>
                        {!disabled && <p className="text-[10px] mt-1">Yukarıdaki butonu kullanarak görsel ekleyebilirsiniz</p>}
                    </div>
                )}
            </CardContent>

            {/* Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Büyük görüntü"
                        className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </Card>
    )
}
