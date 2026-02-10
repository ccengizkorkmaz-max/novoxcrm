'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFloorPlan } from '../../floor-plan-actions'

interface UploadDialogProps {
    projectId: string
    onSuccess?: () => void
}

export function UploadFloorPlanDialog({ projectId, onSuccess }: UploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!file || !title) return

        setLoading(true)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('project_id', projectId)
        formData.append('title', title)

        const result = await uploadFloorPlan(formData)
        setLoading(false)

        if (result.success) {
            toast.success('Kat planı yüklendi.')
            setOpen(false)
            setTitle('')
            setFile(null)
            onSuccess?.()
        } else {
            toast.error(result.error || 'Yükleme başarısız oldu.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Yeni Plan Ekle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kat Planı Yükle</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Plan Başlığı</Label>
                        <Input
                            placeholder="Örn: A Blok Zemin Kat"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Görsel Dosyası</Label>
                        <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            {file ? (
                                <div className="text-center">
                                    <ImageIcon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-emerald-700">{file.name}</p>
                                    <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                    <p className="text-sm">Dosya seçmek için tıklayın veya sürükleyin</p>
                                    <p className="text-xs mt-1">PNG, JPG, SVG (Max 5MB)</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleSubmit} disabled={!file || !title || loading}>
                        {loading ? 'Yükleniyor...' : 'Kaydet'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
