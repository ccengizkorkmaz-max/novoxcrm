'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { saveDocumentMetadata } from '@/app/[locale]/(dashboard)/projects/[id]/documents-actions'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface DocumentUploadProps {
    projectId: string
}

export function DocumentUpload({ projectId }: DocumentUploadProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const file = formData.get('file') as File
        const documentName = formData.get('document_name') as string
        const description = formData.get('description') as string
        const category = formData.get('category') as string
        const permissions = formData.get('permissions') as string

        if (!file || !documentName) {
            toast.error('Dosya ve döküman adı zorunludur.')
            setLoading(false)
            return
        }

        try {
            // 1. Upload to Supabase Storage directly from client (bypasses Vercel 4.5MB function limit)
            const supabase = createClient()
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
            const filePath = `project-documents/${projectId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('crm-images')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Storage upload error:', uploadError)
                toast.error('Dosya yükleme başarısız. Lütfen tekrar deneyin.')
                setLoading(false)
                return
            }

            // 2. Get public URL
            const { data: urlData } = supabase.storage
                .from('crm-images')
                .getPublicUrl(filePath)

            // 3. Save metadata to database via Server Action (passes only small metadata object)
            const result = await saveDocumentMetadata({
                projectId,
                fileName: file.name,
                fileUrl: urlData.publicUrl,
                fileType: file.type,
                fileSize: file.size,
                documentName,
                description,
                category,
                permissions
            })

            setLoading(false)

            if (result?.success) {
                toast.success('Döküman başarıyla yüklendi!')
                setOpen(false)
                setSelectedFile(null)
                ; (e.target as HTMLFormElement).reset()
                // Force page reload to show new document while staying on documents tab
                setTimeout(() => {
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem(`project_tab_${projectId}`, 'documents')
                        if (!window.location.search.includes('tab=')) {
                            window.location.href = `${window.location.pathname}?tab=documents`
                        } else {
                            window.location.reload()
                        }
                    }
                }, 1000)
            } else {
                toast.error(result?.error || 'Yükleme başarısız. Lütfen tekrar deneyin.')
            }
        } catch (error) {
            setLoading(false)
            console.error('Upload error:', error)
            toast.error('Bir hata oluştu. Lütfen tekrar deneyin.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Döküman Yükle
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni Döküman Yükle</DialogTitle>
                    <DialogDescription>
                        Projeye ait döküman yükleyin (PDF, resim, Word, Excel vb.)
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="document_name">Döküman Adı *</Label>
                            <Input
                                id="document_name"
                                name="document_name"
                                placeholder="Örn: İmar Planı"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Açıklama</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Döküman hakkında kısa açıklama"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Kategori *</Label>
                                <select
                                    id="category"
                                    name="category"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="brochure">Proje Broşürü</option>
                                    <option value="catalog">Proje Kataloğu</option>
                                    <option value="renders">3D Render / Görseller</option>
                                    <option value="virtual_tour">Sanal Tur / 3D Gösterim</option>
                                    <option value="video">Tanıtım Videosu</option>
                                    <option value="floor_plan">Kat Planı</option>
                                    <option value="site_plan">Vaziyet Planı</option>
                                    <option value="land_plan">Arsa / İmar Planı</option>
                                    <option value="price_list">Fiyat Listesi</option>
                                    <option value="payment_plan">Ödeme Planı Şablonu</option>
                                    <option value="technical_spec">Teknik Şartname</option>
                                    <option value="permits">Ruhsat ve İzinler</option>
                                    <option value="sample_contract">Örnek Sözleşme</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="permissions">İzin Seviyesi *</Label>
                                <select
                                    id="permissions"
                                    name="permissions"
                                    required
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="public">Kamusal (Müşteriye Açık)</option>
                                    <option value="internal">Dahili (Sadece Firma)</option>
                                    <option value="broker_only">Sadece Brokerlar</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Dosya *</Label>
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                required
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            />
                            {selectedFile && (
                                <p className="text-xs text-muted-foreground">
                                    Seçili: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            İptal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yükle
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
