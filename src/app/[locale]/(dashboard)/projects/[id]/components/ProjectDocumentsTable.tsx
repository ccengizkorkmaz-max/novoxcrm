'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { 
    Download, 
    Trash2, 
    Lock, 
    CheckCircle2, 
    Loader2, 
    FileText,
    FileImage,
    FileSpreadsheet,
    Pencil
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { toggleDocumentShareable, deleteDocument, updateDocument } from '../documents-actions'

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

    // Edit modal state
    const [editingDoc, setEditingDoc] = useState<ProjectDocumentItem | null>(null)
    const [editDocName, setEditDocName] = useState('')
    const [editCategory, setEditCategory] = useState('brochure')
    const [editDescription, setEditDescription] = useState('')
    const [editIsCustomerShareable, setEditIsCustomerShareable] = useState(true)
    const [editFile, setEditFile] = useState<File | null>(null)
    const [savingEdit, setSavingEdit] = useState(false)

    // Check if customer shareable: true if is_customer_shareable is true, or fallback to permissions === 'public'
    const isDocShareable = (doc: ProjectDocumentItem) => {
        if (typeof doc.is_customer_shareable === 'boolean') {
            return doc.is_customer_shareable
        }
        return doc.permissions === 'public'
    }

    const openEditModal = (doc: ProjectDocumentItem) => {
        setEditingDoc(doc)
        setEditDocName(doc.document_name || '')
        setEditCategory(doc.category || 'brochure')
        setEditDescription(doc.description || '')
        setEditIsCustomerShareable(isDocShareable(doc))
        setEditFile(null)
    }

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingDoc || !editDocName.trim()) {
            toast.error('Döküman adı zorunludur.')
            return
        }

        setSavingEdit(true)
        try {
            let updatedFileUrl: string | undefined = undefined
            let updatedFileName: string | undefined = undefined
            let updatedFileType: string | undefined = undefined
            let updatedFileSize: number | undefined = undefined

            // If user selected a replacement file, upload it
            if (editFile) {
                const supabase = createClient()
                const fileExt = editFile.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
                const filePath = `project-documents/${projectId}/${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('crm-images')
                    .upload(filePath, editFile)

                if (uploadError) {
                    console.error('Edit upload error:', uploadError)
                    toast.error('Yeni dosya yüklenemedi.')
                    setSavingEdit(false)
                    return
                }

                const { data: urlData } = supabase.storage
                    .from('crm-images')
                    .getPublicUrl(filePath)

                updatedFileUrl = urlData.publicUrl
                updatedFileName = editFile.name
                updatedFileType = editFile.type
                updatedFileSize = editFile.size
            }

            const res = await updateDocument(editingDoc.id, projectId, {
                documentName: editDocName.trim(),
                description: editDescription.trim(),
                category: editCategory,
                isCustomerShareable: editIsCustomerShareable,
                permissions: editIsCustomerShareable ? 'public' : 'internal',
                fileUrl: updatedFileUrl,
                fileName: updatedFileName,
                fileType: updatedFileType,
                fileSize: updatedFileSize
            })

            if (res?.error) {
                toast.error(res.error)
            } else {
                setDocuments(prev => prev.map(d => d.id === editingDoc.id ? {
                    ...d,
                    document_name: editDocName.trim(),
                    description: editDescription.trim(),
                    category: editCategory,
                    is_customer_shareable: editIsCustomerShareable,
                    permissions: editIsCustomerShareable ? 'public' : 'internal',
                    ...(updatedFileUrl ? {
                        file_url: updatedFileUrl,
                        file_name: updatedFileName || d.file_name,
                        file_type: updatedFileType || d.file_type,
                        file_size: updatedFileSize || d.file_size
                    } : {})
                } : d))

                toast.success('Döküman başarıyla güncellendi.')
                setEditingDoc(null)
            }
        } catch (err) {
            console.error('Update doc error:', err)
            toast.error('Döküman güncellenirken bir hata oluştu.')
        } finally {
            setSavingEdit(false)
        }
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
        <div className="space-y-4">
            <div className="rounded-md border bg-white overflow-hidden">
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
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => openEditModal(doc)}
                                                            title="Dökümanı Düzenle"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
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
                                                    </>
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

            {/* Döküman Düzenleme Modalı */}
            {editingDoc && (
                <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Pencil className="h-5 w-5 text-blue-600" />
                                Dökümanı Düzenle
                            </DialogTitle>
                            <DialogDescription>
                                Dökümanın adını, kategorisini, açıklamasını ve paylaşım durumunu güncelleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveEdit}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit_document_name">Döküman Adı *</Label>
                                    <Input
                                        id="edit_document_name"
                                        value={editDocName}
                                        onChange={(e) => setEditDocName(e.target.value)}
                                        placeholder="Örn: İmar Planı"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edit_category">Kategori *</Label>
                                    <select
                                        id="edit_category"
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
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
                                    <Label htmlFor="edit_description">Açıklama</Label>
                                    <Textarea
                                        id="edit_description"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        placeholder="Döküman hakkında kısa açıklama"
                                        rows={3}
                                    />
                                </div>

                                {/* Müşteri ile Paylaşılabilir Checkbox */}
                                <div className="flex items-start space-x-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-slate-50">
                                    <input
                                        type="checkbox"
                                        id="edit_is_customer_shareable"
                                        checked={editIsCustomerShareable}
                                        onChange={(e) => setEditIsCustomerShareable(e.target.checked)}
                                        className="h-4 w-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <div className="space-y-0.5 select-none">
                                        <Label htmlFor="edit_is_customer_shareable" className="font-semibold text-xs cursor-pointer text-slate-900 flex items-center gap-1.5">
                                            Müşteri ile paylaşılabilir
                                        </Label>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            İşaretli olduğunda doküman müşteri katalog ve WhatsApp/e-posta paylaşımlarında listelenir. İşaretsiz ise sadece kurum içi kullanım içindir.
                                        </p>
                                    </div>
                                </div>

                                {/* Yeni Dosya Yükle (Opsiyonel) */}
                                <div className="space-y-2 border-t pt-3">
                                    <Label htmlFor="edit_file" className="text-xs text-muted-foreground">
                                        Dosyayı Değiştir (İsteğe Bağlı)
                                    </Label>
                                    <Input
                                        id="edit_file"
                                        type="file"
                                        onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                                    />
                                    <p className="text-[11px] text-slate-500">
                                        Mevcut Dosya: <span className="font-medium text-slate-700">{editingDoc.file_name}</span>
                                    </p>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingDoc(null)}
                                    disabled={savingEdit}
                                >
                                    İptal
                                </Button>
                                <Button type="submit" disabled={savingEdit}>
                                    {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Değişiklikleri Kaydet
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
