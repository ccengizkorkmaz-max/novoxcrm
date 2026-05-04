'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Save, Shield, Home, Key, Banknote, Calendar,
    User, Building2, CheckCircle, Clock, AlertTriangle, FileText,
    Upload, Download, Trash2, Eye, Edit3, X, File, Image
} from 'lucide-react'

const TYPE_MAP: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    authorization: { label: 'Yetkilendirme Sözleşmesi', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
    sale: { label: 'Satış Sözleşmesi', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    rental: { label: 'Kiralama Sözleşmesi', icon: Key, color: 'text-violet-600', bg: 'bg-violet-100' },
    commission: { label: 'Komisyon Sözleşmesi', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-100' },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    draft: { label: 'Taslak', color: 'bg-slate-100 text-slate-600' },
    pending: { label: 'Onay Bekliyor', color: 'bg-amber-100 text-amber-600' },
    active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-600' },
    expired: { label: 'Süresi Dolmuş', color: 'bg-red-100 text-red-600' },
    cancelled: { label: 'İptal', color: 'bg-slate-100 text-slate-400' },
}

interface Props {
    contract: any
    documents: any[]
    customers: any[]
    portfolios: any[]
}

export function ContractDetail({ contract, documents: initialDocs, customers, portfolios }: Props) {
    const router = useRouter()
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [documents, setDocuments] = useState(initialDocs)

    // Edit form state
    const [title, setTitle] = useState(contract.title)
    const [status, setStatus] = useState(contract.status)
    const [customerId, setCustomerId] = useState(contract.customer_id || '')
    const [portfolioId, setPortfolioId] = useState(contract.portfolio_id || '')
    const [startDate, setStartDate] = useState(contract.start_date || '')
    const [endDate, setEndDate] = useState(contract.end_date || '')
    const [amount, setAmount] = useState(contract.amount || '')
    const [commissionRate, setCommissionRate] = useState(contract.commission_rate || '')
    const [currency, setCurrency] = useState(contract.currency || 'TRY')
    const [notes, setNotes] = useState(contract.notes || '')

    const typeInfo = TYPE_MAP[contract.contract_type] || TYPE_MAP.authorization
    const TypeIcon = typeInfo.icon
    const statusInfo = STATUS_MAP[status] || STATUS_MAP.draft
    const commissionAmount = amount && commissionRate ? (Number(amount) * Number(commissionRate) / 100) : null

    async function handleSave() {
        setSaving(true)
        try {
            const res = await fetch(`/api/broker-contracts/${contract.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title, status, customer_id: customerId || null, portfolio_id: portfolioId || null,
                    start_date: startDate || null, end_date: endDate || null,
                    amount: amount ? Number(amount) : null,
                    commission_rate: commissionRate ? Number(commissionRate) : null,
                    commission_amount: commissionAmount,
                    currency, notes
                })
            })
            if (!res.ok) throw new Error('Güncelleme başarısız')
            toast.success('Sözleşme güncellendi!')
            setEditing(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally { setSaving(false) }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files
        if (!files?.length) return
        setUploading(true)

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('contract_id', contract.id)

                const res = await fetch(`/api/broker-contracts/${contract.id}/documents`, {
                    method: 'POST',
                    body: formData
                })
                if (!res.ok) throw new Error('Yükleme başarısız')
                const doc = await res.json()
                setDocuments(prev => [doc, ...prev])
                toast.success(`"${file.name}" yüklendi`)
            } catch {
                toast.error(`"${file.name}" yüklenemedi`)
            }
        }
        setUploading(false)
        e.target.value = ''
    }

    async function handleDeleteDoc(docId: string) {
        if (!confirm('Bu dokümanı silmek istediğinize emin misiniz?')) return
        try {
            const res = await fetch(`/api/broker-contracts/${contract.id}/documents/${docId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Silinemedi')
            setDocuments(prev => prev.filter(d => d.id !== docId))
            toast.success('Doküman silindi')
        } catch { toast.error('Silinemedi') }
    }

    const getFileIcon = (name: string) => {
        const ext = name?.split('.').pop()?.toLowerCase()
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return Image
        return File
    }

    return (
        <div className="flex flex-col gap-6 w-full max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/broker-contracts')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", typeInfo.bg)}>
                    <TypeIcon className={cn("h-6 w-6", typeInfo.color)} />
                </div>
                <div className="flex-1">
                    {editing ? (
                        <Input value={title} onChange={e => setTitle(e.target.value)} className="text-lg font-bold h-10" />
                    ) : (
                        <h1 className="text-xl font-bold">{contract.title}</h1>
                    )}
                    <p className="text-sm text-muted-foreground">{typeInfo.label}</p>
                </div>
                <Badge className={cn("text-xs font-bold border-none", statusInfo.color)}>{statusInfo.label}</Badge>
                {!editing ? (
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(true)}>
                        <Edit3 className="h-3.5 w-3.5" /> Düzenle
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditing(false)}>
                            <X className="h-3.5 w-3.5 mr-1" /> İptal
                        </Button>
                        <Button size="sm" className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
                            <Save className="h-3.5 w-3.5" /> {saving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Details */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Contract Info */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold">Sözleşme Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Durum</Label>
                                    {editing ? (
                                        <select value={status} onChange={e => setStatus(e.target.value)}
                                            className="w-full h-9 px-3 rounded-lg border text-sm bg-white mt-1">
                                            <option value="draft">Taslak</option>
                                            <option value="pending">Onay Bekliyor</option>
                                            <option value="active">Aktif</option>
                                            <option value="expired">Süresi Dolmuş</option>
                                            <option value="cancelled">İptal</option>
                                        </select>
                                    ) : (
                                        <p className="text-sm font-medium mt-1">{statusInfo.label}</p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Sözleşme Türü</Label>
                                    <p className="text-sm font-medium mt-1">{typeInfo.label}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Kişi</Label>
                                    {editing ? (
                                        <select value={customerId} onChange={e => setCustomerId(e.target.value)}
                                            className="w-full h-9 px-3 rounded-lg border text-sm bg-white mt-1">
                                            <option value="">Seçiniz</option>
                                            {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                                            {contract.customer?.full_name || '—'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Portföy</Label>
                                    {editing ? (
                                        <select value={portfolioId} onChange={e => setPortfolioId(e.target.value)}
                                            className="w-full h-9 px-3 rounded-lg border text-sm bg-white mt-1">
                                            <option value="">Seçiniz</option>
                                            {portfolios.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                        </select>
                                    ) : (
                                        <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                            {contract.portfolio?.title || '—'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Başlangıç</Label>
                                    {editing ? (
                                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 h-9 text-sm" />
                                    ) : (
                                        <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            {contract.start_date ? new Date(contract.start_date).toLocaleDateString('tr-TR') : '—'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Bitiş</Label>
                                    {editing ? (
                                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 h-9 text-sm" />
                                    ) : (
                                        <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                            {contract.end_date ? new Date(contract.end_date).toLocaleDateString('tr-TR') : '—'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tutar</Label>
                                    {editing ? (
                                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 h-9 text-sm" />
                                    ) : (
                                        <p className="text-lg font-black text-emerald-600 mt-1">
                                            {contract.amount ? `₺${Number(contract.amount).toLocaleString('tr-TR')}` : '—'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Komisyon %</Label>
                                    {editing ? (
                                        <Input type="number" step="0.1" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} className="mt-1 h-9 text-sm" />
                                    ) : (
                                        <p className="text-lg font-black text-amber-600 mt-1">
                                            {contract.commission_rate ? `%${contract.commission_rate}` : '—'}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Komisyon Tutarı</Label>
                                    <p className="text-lg font-black text-violet-600 mt-1">
                                        {commissionAmount ? `₺${commissionAmount.toLocaleString('tr-TR')}` : (contract.commission_amount ? `₺${Number(contract.commission_amount).toLocaleString('tr-TR')}` : '—')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Notlar</Label>
                                {editing ? (
                                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                                        className="w-full px-3 py-2 rounded-lg border text-sm resize-none mt-1" />
                                ) : (
                                    <p className="text-sm text-muted-foreground mt-1">{contract.notes || 'Not eklenmemiş'}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" /> Dokümanlar
                                    {documents.length > 0 && <Badge variant="outline" className="text-[9px]">{documents.length}</Badge>}
                                </CardTitle>
                                <label className="cursor-pointer">
                                    <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={handleFileUpload} className="hidden" />
                                    <Button variant="outline" size="sm" className="text-xs gap-1.5 pointer-events-none" disabled={uploading}>
                                        <Upload className="h-3.5 w-3.5" /> {uploading ? 'Yükleniyor...' : 'Doküman Ekle'}
                                    </Button>
                                </label>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {documents.length > 0 ? (
                                <div className="space-y-2">
                                    {documents.map(doc => {
                                        const FileIcon = getFileIcon(doc.file_name)
                                        return (
                                            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-slate-50 transition-all group">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <FileIcon className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold truncate">{doc.file_name}</p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''} · {new Date(doc.created_at).toLocaleDateString('tr-TR')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {doc.url && (
                                                        <a href={doc.url} target="_blank" rel="noopener">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                                                        </a>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteDoc(doc.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                    <p className="text-xs font-medium">Henüz doküman eklenmemiş</p>
                                    <p className="text-[10px] mt-0.5">İmzalı sözleşme, ek belgeler yükleyebilirsiniz</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    {/* Quick Info */}
                    <Card className="border shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50">
                                <p className="text-3xl font-black text-blue-600">
                                    {contract.amount ? `₺${Number(contract.amount).toLocaleString('tr-TR')}` : '—'}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Sözleşme Tutarı</p>
                            </div>
                            {(contract.commission_rate || commissionAmount) && (
                                <div className="text-center p-3 rounded-xl bg-amber-50">
                                    <p className="text-xl font-black text-amber-600">
                                        ₺{(commissionAmount || Number(contract.commission_amount) || 0).toLocaleString('tr-TR')}
                                    </p>
                                    <p className="text-[10px] text-amber-500 font-bold">%{contract.commission_rate} Komisyon</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold">Zaman Çizelgesi</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="h-3 w-3" /></div>
                                <div>
                                    <p className="font-bold">Oluşturuldu</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(contract.created_at).toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                            {contract.start_date && (
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center"><Calendar className="h-3 w-3 text-blue-600" /></div>
                                    <div>
                                        <p className="font-bold">Başlangıç</p>
                                        <p className="text-[10px] text-muted-foreground">{new Date(contract.start_date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            )}
                            {contract.end_date && (
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="h-3 w-3 text-red-600" /></div>
                                    <div>
                                        <p className="font-bold">Bitiş</p>
                                        <p className="text-[10px] text-muted-foreground">{new Date(contract.end_date).toLocaleDateString('tr-TR')}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
