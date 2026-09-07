'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
    Download, 
    Trash2, 
    Share2, 
    Lock, 
    CheckCircle2, 
    Loader2, 
    FileText,
    FileImage,
    FileSpreadsheet,
    File,
    ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { toggleDocumentShareable, deleteDocument } from '../documents-actions'

const CATEGORY_LABELS: Record<string, string> = {
    'catalog': 'Proje Kataloğu',
    'brochure': 'Proje Broşürü',
    'renders': '3D Render / Görseller',
    'virtual_tour': 'Sanal Tur',
    'video': 'Tanıtım Videosu',
    'floor_plan': 'Kat Planı',
    'site_plan': 'Vaziyet Planı',
    'land_plan': 'Arsa Planı',
    'price_list': 'Fiyat Listesi',
    'payment_plan': 'Ödeme Planı',
    'technical_spec': 'Teknik Şartname',
    'permits': 'Ruhsat ve İzinler',
    'sample_contract': 'Örnek Sözleşme',
    'construction_photo': 'Şantiye Fotoğrafı'
}

interface ProjectDocumentItem {
    id: string
    document_name: string
    file_name: string
    file_url: string
    file_type?: string
    file_size?: number
    description?: string
    category?: string
    permissions?: string
    is_customer_shareable?: boolean | null
    created_at: string
    uploaded_by?: string
    uploader_name?: string
}

interface ProjectDocumentsTableProps {
    projectId: string
    initialDocuments: ProjectDocumentItem[]
    isAdmin: boolean
}

function getFileIcon(fileName?: string, fileType?: string) {
    if (fileType?.startsWith('image/') || fileName?.match(/\.(jpg|jpeg|png|webp|avif)$/i)) {
        return <FileImage className="h-4 w-4 text-blue-500 shrink-0" />
    }
    if (fileType?.includes('sheet') || fileName?.match(/\.(xlsx|xls|csv)$/i)) {
        return <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
    }
    return <FileText className="h-4 w-4 text-purple-500 shrink-0" />
}

export function ProjectDocumentsTable({
    projectId,
    initialDocuments = [],
    isAdmin
}: ProjectDocumentsTableProps) {
    const [documents, setDocuments] = useState<ProjectDocumentItem[]>(initialDocuments)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Check if customer shareable: true if is_customer_shareable is true, or fallback to permissions === 'public'
    const isDocShareable = (doc: ProjectDocumentItem) => {
        if (typeof doc.is_customer_shareable === 'boolean') {
            return doc.is_customer_shareable
        }
        return doc.permissions === 'public'
    }

    const handleToggleShareable = async (doc: ProjectDocumentItem) => {
        if (!isAdmin || togglingId) return

        const currentStatus = isDocShareable(doc)
        const nextStatus = !currentStatus
        setTogglingId(doc.id)

        // Optimistic update
        setDocuments(prev => prev.map(d => d.id === doc.id ? { 
            ...d, 
            is_customer_shareable: nextStatus,
            permissions: nextStatus ? 'public' : 'internal'
        } : d))

        try {
            const res = await toggleDocumentShareable(doc.id, projectId, nextStatus)
            if (res?.error) {
                // Revert
                setDocuments(prev => prev.map(d => d.id === doc.id ? { 
                    ...d, 
                    is_customer_shareable: currentStatus,
                    permissions: currentStatus ? 'public' : 'internal'
                } : d))
                toast.error(res.error)
            } else {
                toast.success(
                    nextStatus 
                        ? 'Doküman müşteri katalog paylaşımlarına açıldı.' 
                        : 'Doküman sadece iç kullanıma alındı (katalog paylaşımlarından gizlendi).'
                )
            }
        } catch (err) {
            // Revert
            setDocuments(prev => prev.map(d => d.id === doc.id ? { 
                ...d, 
                is_customer_shareable: currentStatus,
                permissions: currentStatus ? 'public' : 'internal'
            } : d))
            toast.error('Paylaşım durumu değiştirilemedi.')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDelete = async (docId: string) => {
        if (!isAdmin || deletingId) return
        if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return

        setDeletingId(docId)
        try {
            const res = await deleteDocument(docId, projectId)
            if (res?.error) {
                toast.error(res.error)
            } else {
                setDocuments(prev => prev.filter(d => d.id !== docId))
                toast.success('Doküman başarıyla silindi.')
            }
        } catch (err) {
            toast.error('Doküman silinirken bir hata oluştu.')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Döküman Adı</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Müşteri Paylaşımı</TableHead>
                        <TableHead>Açıklama</TableHead>
                        <TableHead>Yükleme Tarihi</TableHead>
                        <TableHead>Yükleyen</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents && documents.length > 0 ? (
                        documents.map((doc) => {
                            const shareable = isDocShareable(doc)
                            const isToggling = togglingId === doc.id
                            const isDeleting = deletingId === doc.id

                            return (
                                <TableRow key={doc.id} className="hover:bg-muted/40 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {getFileIcon(doc.file_name, doc.file_type)}
                                            <span className="truncate max-w-[200px]" title={doc.document_name}>
                                                {doc.document_name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {CATEGORY_LABELS[doc.category || ''] || doc.category || '-'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {isAdmin ? (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleShareable(doc)}
                                                disabled={isToggling}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer select-none ${
                                                    shareable
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
                                                        : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80'
                                                }`}
                                                title="Müşteri ve katalog paylaşımlarında listelenme durumunu değiştirmek için tıklayın"
                                            >
                                                {isToggling ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : shareable ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Lock className="h-3.5 w-3.5 text-slate-500" />
                                                )}
                                                <span>
                                                    {shareable ? 'Müşteriyle Paylaşılabilir' : 'Sadece İç Kullanım'}
                                                </span>
                                            </button>
                                        ) : (
                                            shareable ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium">
                                                    <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                                                    Müşteriyle Paylaşılabilir
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 font-medium">
                                                    <Lock className="h-3 w-3 mr-1 text-slate-500" />
                                                    Sadece İç Kullanım
                                                </Badge>
                                            )
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground text-xs">
                                        {doc.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {doc.uploader_name || 'Bilinmiyor'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1.5 items-center">
                                            <Link href={doc.file_url} target="_blank">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="İndir / Görüntüle">
                                                    <Download className="h-4 w-4 text-slate-600" />
                                                </Button>
                                            </Link>
                                            {isAdmin && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={isDeleting}
                                                    title="Sil"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                Henüz döküman yüklenmemiş.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
