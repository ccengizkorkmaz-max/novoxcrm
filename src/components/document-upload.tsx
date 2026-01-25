'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2 } from 'lucide-react'
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
    onUpload: (formData: FormData) => Promise<any>
}

export function DocumentUpload({ projectId, onUpload }: DocumentUploadProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('project_id', projectId)

        try {
            const result = await onUpload(formData)

            setLoading(false)

            if (result?.success) {
                alert('Döküman başarıyla yüklendi!')
                setOpen(false)
                setSelectedFile(null)
                    ; (e.target as HTMLFormElement).reset()
                // Force page reload to show new document
                window.location.reload()
            } else {
                alert(result?.error || 'Yükleme başarısız. Lütfen tekrar deneyin.')
            }
        } catch (error) {
            setLoading(false)
            console.error('Upload error:', error)
            alert('Bir hata oluştu. Lütfen konsolu kontrol edin.')
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
