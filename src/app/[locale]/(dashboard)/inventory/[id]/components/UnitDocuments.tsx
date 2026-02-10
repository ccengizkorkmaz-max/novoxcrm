'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Trash2, Upload, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadUnitDocument, deleteUnitDocument } from '../../unit-details-actions'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Document {
    id: string
    name: string
    file_url: string
    size_bytes: number
    created_at: string
    uploaded_by: { full_name: string }
}

export function UnitDocuments({ unitId, documents }: { unitId: string, documents: Document[] }) {
    const [uploadOpen, setUploadOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append('unit_id', unitId)
        formData.append('file', file)

        const result = await uploadUnitDocument(formData)
        setUploading(false)

        if (result.success) {
            toast.success('Dosya yüklendi.')
            setUploadOpen(false)
            setFile(null)
        } else {
            toast.error(result.error || 'Yüklenemedi.')
        }
    }

    const handleDelete = async (docId: string) => {
        if (!confirm('Bu dosyayı silmek istediğinize emin misiniz?')) return

        setDeletingId(docId)
        const result = await deleteUnitDocument(docId, unitId)
        setDeletingId(null)

        if (result.success) {
            toast.success('Dosya silindi.')
        } else {
            toast.error('Silinemedi.')
        }
    }

    const formatBytes = (bytes: number, decimals = 2) => {
        if (!bytes) return '0 Bytes'
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Dokümanlar
                </CardTitle>
                <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Upload className="h-3 w-3" /> Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Doküman Yükle</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 relative">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                {file ? (
                                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                        <FileText className="h-5 w-5" />
                                        {file.name}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground">
                                        <Upload className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-sm">Dosya seçmek için tıklayın</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadOpen(false)}>İptal</Button>
                            <Button onClick={handleUpload} disabled={!file || uploading}>
                                {uploading ? 'Yükleniyor...' : 'Yükle'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-center py-4">
                        Henüz doküman eklenmemiş.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {documents.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="h-8 w-8 rounded bg-white border flex items-center justify-center flex-shrink-0 text-slate-500">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate max-w-[150px]">{doc.name}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {formatBytes(doc.size_bytes)} • {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: tr })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                                        <a href={doc.file_url} target="_blank" download>
                                            <Download className="h-3.5 w-3.5" />
                                        </a>
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        onClick={() => handleDelete(doc.id)}
                                        disabled={deletingId === doc.id}
                                    >
                                        {deletingId === doc.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
