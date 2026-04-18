'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { uploadDocument, deleteDocument, verifyDocument } from '@/app/[locale]/(dashboard)/documents/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    FileText, Upload, Trash2, Download, Eye, CheckCircle,
    Clock, AlertTriangle, FolderOpen, Loader2, Shield,
    FileImage, FileSpreadsheet, File, X, Plus, Search
} from 'lucide-react'

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
    authorization: { label: 'Yetki Belgesi', icon: Shield, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    title_deed: { label: 'Tapu', icon: FileText, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    identity: { label: 'Kimlik', icon: FileText, color: 'bg-violet-50 text-violet-600 border-violet-200' },
    contract: { label: 'Sözleşme', icon: FileText, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    appraisal: { label: 'Ekspertiz', icon: FileSpreadsheet, color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    zoning: { label: 'İmar Durumu', icon: FileText, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    floor_plan: { label: 'Kat Planı', icon: FileImage, color: 'bg-pink-50 text-pink-600 border-pink-200' },
    energy_cert: { label: 'Enerji Kimlik', icon: FileText, color: 'bg-lime-50 text-lime-600 border-lime-200' },
    insurance: { label: 'Sigorta', icon: Shield, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    invoice: { label: 'Fatura', icon: FileSpreadsheet, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    receipt: { label: 'Makbuz', icon: FileText, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    photo: { label: 'Fotoğraf', icon: FileImage, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    other: { label: 'Diğer', icon: File, color: 'bg-slate-50 text-slate-600 border-slate-200' },
}

interface DocumentManagerProps {
    entityType: 'portfolio' | 'customer' | 'sale' | 'agent'
    entityId: string
    documents: any[]
    canManage?: boolean
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1_048_576).toFixed(1)} MB`
}

function getFileIcon(fileType: string) {
    if (fileType?.startsWith('image/')) return FileImage
    if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) return FileSpreadsheet
    return FileText
}

export function DocumentManager({ entityType, entityId, documents, canManage = true }: DocumentManagerProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [showUploadForm, setShowUploadForm] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState('other')
    const [description, setDescription] = useState('')
    const [expiryDate, setExpiryDate] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const filteredDocs = filterCategory === 'all'
        ? documents
        : documents.filter(d => d.category === filterCategory)

    // Count by category
    const categoryCounts: Record<string, number> = {}
    documents.forEach(d => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1
    })

    // Expiring documents
    const expiringDocs = documents.filter(d => {
        if (!d.expiry_date) return false
        const daysLeft = Math.ceil((new Date(d.expiry_date).getTime() - Date.now()) / 86400000)
        return daysLeft >= 0 && daysLeft <= 30
    })

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 25 * 1024 * 1024) {
            toast.error('Dosya 25MB\'dan büyük olamaz')
            return
        }

        setUploading(true)
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            const formData = new FormData()
            formData.set('entity_type', entityType)
            formData.set('entity_id', entityId)
            formData.set('category', selectedCategory)
            formData.set('description', description)
            formData.set('expiry_date', expiryDate)
            formData.set('file_base64', base64)
            formData.set('file_name', file.name)
            formData.set('file_type', file.type)
            formData.set('file_size', String(file.size))

            await uploadDocument(formData)
            toast.success(`${file.name} yüklendi`)
            setShowUploadForm(false)
            setDescription('')
            setExpiryDate('')
            setSelectedCategory('other')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Yükleme başarısız')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleDelete(docId: string) {
        if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return
        setDeletingId(docId)
        try {
            await deleteDocument(docId)
            toast.success('Doküman silindi')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setDeletingId(null)
        }
    }

    async function handleVerify(docId: string) {
        try {
            await verifyDocument(docId)
            toast.success('Doküman onaylandı')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    return (
        <Card className="border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-amber-600" />
                        Belgeler
                        <Badge variant="outline" className="text-[10px] ml-1">{documents.length}</Badge>
                        {expiringDocs.length > 0 && (
                            <Badge className="bg-red-100 text-red-600 border-red-200 text-[9px] font-bold animate-pulse ml-1">
                                ⚠️ {expiringDocs.length} süresi doluyor
                            </Badge>
                        )}
                    </CardTitle>
                    {canManage && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => setShowUploadForm(!showUploadForm)}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Belge Ekle
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Form */}
                {showUploadForm && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Kategori</Label>
                                <select
                                    value={selectedCategory}
                                    onChange={e => setSelectedCategory(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg border text-xs bg-white mt-1"
                                >
                                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Son Geçerlilik (opsiyonel)</Label>
                                <Input
                                    type="date"
                                    value={expiryDate}
                                    onChange={e => setExpiryDate(e.target.value)}
                                    className="h-9 text-xs mt-1"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Açıklama (opsiyonel)</Label>
                            <Input
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Belge hakkında not..."
                                className="h-9 text-xs mt-1"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={handleUpload}
                            />
                            <Button
                                size="sm"
                                className="text-xs gap-1.5 bg-amber-600 hover:bg-amber-700"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Yükleniyor...</>
                                ) : (
                                    <><Upload className="h-3.5 w-3.5" /> Dosya Seç ve Yükle</>
                                )}
                            </Button>
                            <span className="text-[10px] text-muted-foreground">PDF, DOC, XLS, JPG • Maks. 25MB</span>
                        </div>
                    </div>
                )}

                {/* Category Filter */}
                {documents.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <button
                            onClick={() => setFilterCategory('all')}
                            className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0",
                                filterCategory === 'all' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            )}
                        >
                            Tümü ({documents.length})
                        </button>
                        {Object.entries(categoryCounts).map(([cat, count]) => {
                            const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.other
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setFilterCategory(cat)}
                                    className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex-shrink-0",
                                        filterCategory === cat ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {cfg.label} ({count})
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Document List */}
                {filteredDocs.length > 0 ? (
                    <div className="space-y-2">
                        {filteredDocs.map(doc => {
                            const cfg = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other
                            const CatIcon = cfg.icon
                            const FileIcon = getFileIcon(doc.file_type)
                            const isExpiring = doc.expiry_date && Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000) <= 30
                            const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()

                            return (
                                <div key={doc.id} className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm",
                                    isExpired ? "border-red-200 bg-red-50/30" :
                                    isExpiring ? "border-amber-200 bg-amber-50/30" : ""
                                )}>
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 border", cfg.color)}>
                                        <CatIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold truncate">{doc.file_name}</span>
                                            {doc.is_verified && (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[8px] gap-0.5 font-bold">
                                                    <CheckCircle className="h-2.5 w-2.5" /> Onaylı
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                            <Badge variant="outline" className={cn("text-[8px] py-0", cfg.color)}>{cfg.label}</Badge>
                                            <span>{formatFileSize(doc.file_size)}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.created_at).toLocaleDateString('tr-TR')}</span>
                                            {doc.profiles?.full_name && <span>• {doc.profiles.full_name}</span>}
                                        </div>
                                        {doc.description && (
                                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{doc.description}</p>
                                        )}
                                        {isExpired && (
                                            <span className="text-[10px] text-red-600 font-bold">⚠️ Süresi dolmuş!</span>
                                        )}
                                        {isExpiring && !isExpired && (
                                            <span className="text-[10px] text-amber-600 font-bold">
                                                ⏰ {Math.ceil((new Date(doc.expiry_date).getTime() - Date.now()) / 86400000)} gün kaldı
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Görüntüle">
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </a>
                                        <a href={doc.file_url} download={doc.file_name}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="İndir">
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                        </a>
                                        {canManage && !doc.is_verified && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="Onayla" onClick={() => handleVerify(doc.id)}>
                                                <CheckCircle className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        {canManage && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
                                                title="Sil"
                                                onClick={() => handleDelete(doc.id)}
                                                disabled={deletingId === doc.id}
                                            >
                                                {deletingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div
                        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all"
                        onClick={() => canManage && setShowUploadForm(true)}
                    >
                        <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">Henüz belge yok</p>
                        {canManage && <p className="text-[10px] text-muted-foreground mt-1">Belge eklemek için tıklayın</p>}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
