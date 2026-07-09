'use client'

import React, { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'
import { toast } from 'sonner'
import {
    Mail,
    Calendar,
    Clock,
    User,
    Check,
    X,
    Phone,
    MessageSquare,
    Wand2,
    RefreshCw,
    Archive,
    Trash2,
    CheckSquare,
    Square,
    Filter
} from 'lucide-react'
import { approveInboxItem, rejectInboxItem, deleteArchivedItems, deleteAllArchivedItems, bulkApproveProjectInfoRequests, bulkArchiveNonProjectInfoRequests } from '../actions'
import { startOfDay, startOfWeek, startOfMonth, subDays, isAfter, isEqual } from 'date-fns'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'

interface InboxItem {
    id: string
    tenant_id: string
    name: string
    email: string | null
    phone: string | null
    message: string
    source: string
    status: string
    created_at: string
}

interface InboxListProps {
    initialItems: InboxItem[]
    archivedItems?: InboxItem[]
    pendingCount?: number
    archivedCount?: number
}

type Tab = 'pending' | 'archive'
type DateFilter = 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month'

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'Tümü' },
    { key: 'today', label: 'Bugün' },
    { key: 'yesterday', label: 'Dün' },
    { key: 'this_week', label: 'Bu Hafta' },
    { key: 'this_month', label: 'Bu Ay' },
]

function filterByDate(items: InboxItem[], filter: DateFilter): InboxItem[] {
    if (filter === 'all') return items
    const now = new Date()
    let from: Date
    let to: Date | null = null

    switch (filter) {
        case 'today':
            from = startOfDay(now)
            break
        case 'yesterday':
            from = startOfDay(subDays(now, 1))
            to = startOfDay(now)
            break
        case 'this_week':
            from = startOfWeek(now, { weekStartsOn: 1 })
            break
        case 'this_month':
            from = startOfMonth(now)
            break
        default:
            return items
    }

    return items.filter(item => {
        const d = new Date(item.created_at)
        if (to) return (isAfter(d, from) || isEqual(d, from)) && !isAfter(d, to)
        return isAfter(d, from) || isEqual(d, from)
    })
}

export function InboxList({ initialItems, archivedItems = [], pendingCount, archivedCount }: InboxListProps) {
    const t = useTranslations('Sidebar.Inbox')
    const locale = useLocale()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<Tab>('pending')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [viewingItem, setViewingItem] = useState<InboxItem | null>(null)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [deleting, setDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<'selected' | 'all' | null>(null)

    // Real-time updates
    useSupabaseRealtime({ table: 'inbox_items' })

    const [scanning, setScanning] = useState(false)
    const [bulkApproving, setBulkApproving] = useState(false)

    const handleBulkApprove = async () => {
        if (window.confirm("Mesajında 'Proje Bilgi Talep Formu' geçen tüm bekleyen kayıtlar otomatik olarak CRM'e aktarılacaktır. Devam etmek istiyor musunuz?")) {
            setBulkApproving(true)
            try {
                const res = await bulkApproveProjectInfoRequests()
                if (res.success) {
                    toast.success(res.message || 'Kayıtlar başarıyla aktarıldı')
                    router.refresh()
                } else {
                    toast.error(res.error || 'İşlem başarısız oldu')
                }
            } catch (err: any) {
                toast.error(err.message || 'Bir hata oluştu')
            } finally {
                setBulkApproving(false)
            }
        }
    }

    const [bulkArchiving, setBulkArchiving] = useState(false)

    const handleBulkArchive = async () => {
        if (window.confirm("Proje Bilgi Talep Formu dışındaki tüm bekleyen mesajlar arşive taşınacaktır. Devam etmek istiyor musunuz?")) {
            setBulkArchiving(true)
            try {
                const res = await bulkArchiveNonProjectInfoRequests()
                if (res.success) {
                    toast.success(res.message || 'Kayıtlar arşive taşındı')
                    router.refresh()
                } else {
                    toast.error(res.error || 'İşlem başarısız oldu')
                }
            } catch (err: any) {
                toast.error(err.message || 'Bir hata oluştu')
            } finally {
                setBulkArchiving(false)
            }
        }
    }
    React.useEffect(() => {
        handleRefresh(undefined, true)
    }, [])

    // Editable fields
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPhone, setEditPhone] = useState('')

    const handleRefresh = async (e?: React.MouseEvent, silent: boolean = false) => {
        if (e) e.stopPropagation()
        setScanning(true)
        try {
            const res = await fetch('/api/notifications/scan')
            const data = await res.json()
            if (data.success) {
                const newEmails = data.newEmails || 0
                if (newEmails > 0) {
                    toast.success(`${newEmails} yeni e-posta gelen kutusuna eklendi.`)
                    router.refresh()
                } else if (!silent) {
                    toast.success('Gelen kutusu güncel, yeni e-posta yok.')
                }
            } else if (!silent) {
                toast.error('Gelen kutusu güncellenirken hata oluştu.')
            }
        } catch {
            if (!silent) toast.error('Servise ulaşılamadı.')
        } finally {
            setScanning(false)
        }
    }

    const getDisplayMessage = (msg: string | null) => {
        if (!msg) return '';
        try {
            const parsed = JSON.parse(msg);
            if (parsed.json) {
                try {
                    const innerParsed = JSON.parse(parsed.json);
                    return innerParsed.message || msg;
                } catch {
                    return parsed.message || msg;
                }
            }
            if (typeof parsed === 'object' && parsed !== null) {
                return parsed.message || parsed.text || msg;
            }
            return msg;
        } catch {
            return msg;
        }
    }

    const parseMessageFields = (item: InboxItem) => {
        const message = getDisplayMessage(item.message)

        const nameMatch = message.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
        const parsedName = nameMatch ? nameMatch[1].trim() : null

        const emailMatch = message.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
        const parsedEmail = emailMatch ? emailMatch[1].trim() : null

        const phoneMatch = message.match(/(?:Telefon Numarası|Telefon No|Telefon|Tel):\s*([\d\s\+\-\(\)\.]+?)(?=\s*(?:Ad\s+Soyad|E-posta|Konu|Proje|Mesaj|$)|\r|\n)/i)
        const parsedPhone = phoneMatch ? phoneMatch[1].trim() : null

        return {
            name: parsedName || item.name || '',
            email: parsedEmail || item.email || '',
            phone: parsedPhone || item.phone || '',
        }
    }

    const handleViewItem = (item: InboxItem) => {
        setViewingItem(item)
        const parsed = parseMessageFields(item)
        setEditName(parsed.name)
        setEditEmail(parsed.email)
        setEditPhone(parsed.phone)
    }

    const handleParseMessage = () => {
        if (!viewingItem) return

        const message = getDisplayMessage(viewingItem.message)

        const nameMatch = message.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
        if (nameMatch) setEditName(nameMatch[1].trim())

        const emailMatch = message.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
        if (emailMatch) setEditEmail(emailMatch[1].trim())

        const phoneMatch = message.match(/(?:Telefon Numarası|Telefon No|Telefon|Tel):\s*([\d\s\+\-\(\)\.]+?)(?=\s*(?:Ad\s+Soyad|E-posta|Konu|Proje|Mesaj|$)|\r|\n)/i)
        if (phoneMatch) setEditPhone(phoneMatch[1].trim())

        toast.success('Bilgiler mesajdan ayıklandı')
    }

    const handleApprove = async () => {
        if (!viewingItem) return

        setApproving(true)
        const result = await approveInboxItem(viewingItem.id, undefined, {
            name: editName,
            email: editEmail,
            phone: editPhone
        })
        setApproving(false)

        if (result.success) {
            if (result.was_duplicate) {
                toast.success('Mevcut müşteri kaydına eklendi (çift kayıt önlendi)')
            } else {
                toast.success('Lead CRM\'e başarıyla eklendi!')
            }
            setViewingItem(null)
            router.refresh()
        } else {
            toast.error(result.error || 'Bilinmeyen hata')
        }
    }

    const handleReject = async () => {
        if (!viewingItem) return

        setRejecting(true)
        const result = await rejectInboxItem(viewingItem.id)
        setRejecting(false)

        if (result.success) {
            toast.success('Kayıt reddedildi')
            setViewingItem(null)
            router.refresh()
        } else {
            toast.error(result.error || 'Bilinmeyen hata')
        }
    }

    // Archive selection
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleSelectAll = () => {
        if (selectedIds.size === archivedItems.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(archivedItems.map(i => i.id)))
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return
        setDeleting(true)
        const result = await deleteArchivedItems(Array.from(selectedIds))
        setDeleting(false)
        setShowDeleteConfirm(null)
        if (result.success) {
            toast.success(`${result.deleted} kayıt kalıcı olarak silindi.`)
            setSelectedIds(new Set())
            router.refresh()
        } else {
            toast.error(result.error || 'Silme işlemi başarısız.')
        }
    }

    const handleDeleteAll = async () => {
        setDeleting(true)
        const result = await deleteAllArchivedItems()
        setDeleting(false)
        setShowDeleteConfirm(null)
        if (result.success) {
            toast.success(`${result.deleted} kayıt kalıcı olarak silindi.`)
            setSelectedIds(new Set())
            router.refresh()
        } else {
            toast.error(result.error || 'Silme işlemi başarısız.')
        }
    }

    const rawItems = activeTab === 'pending' ? initialItems : archivedItems
    const currentItems = filterByDate(rawItems, dateFilter)

    const renderStatusBadge = (status: string) => {
        if (status === 'approved') return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">Onaylandı</Badge>
        if (status === 'rejected') return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">Reddedildi</Badge>
        if (status === 'pending') return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">Bekliyor</Badge>
        return null
    }

    return (
        <>
            {/* Tab Bar + Date Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => { setActiveTab('pending'); setSelectedIds(new Set()) }}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'pending'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Mail className="h-4 w-4" />
                        Bekleyen
                        {(pendingCount ?? initialItems.length) > 0 && (
                            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {pendingCount ?? initialItems.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('archive')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            activeTab === 'archive'
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <Archive className="h-4 w-4" />
                        Arşiv
                        {(archivedCount ?? archivedItems.length) > 0 && (
                            <span className="bg-slate-200 text-slate-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                                {archivedCount ?? archivedItems.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-1.5">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg">
                        {DATE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setDateFilter(f.key)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                    dateFilter === f.key
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {dateFilter !== 'all' && (
                        <span className="text-[11px] text-slate-400 font-medium">
                            {currentItems.length} / {rawItems.length} kayıt
                        </span>
                    )}
                </div>
            </div>

            {/* Archive toolbar */}
            {activeTab === 'archive' && archivedItems.length > 0 && (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5">
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                            {selectedIds.size === archivedItems.length ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                                <Square className="h-4 w-4" />
                            )}
                            {selectedIds.size > 0 ? `${selectedIds.size} seçili` : 'Tümünü seç'}
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.size > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm('selected')}
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Seçilenleri Sil ({selectedIds.size})
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm('all')}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Tümünü Sil
                        </Button>
                    </div>
                </div>
            )}

            <Card className="overflow-hidden border-slate-200 shadow-sm relative">
                {activeTab === 'pending' && (
                    <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkApprove}
                            disabled={bulkApproving || bulkArchiving || scanning}
                            className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5 border-none active:scale-95"
                            title="Proje Bilgi Talep Formu yazan tüm kayıtları otomatik crm'e aktarır"
                        >
                            <Wand2 className={`h-3.5 w-3.5 ${bulkApproving ? 'animate-pulse' : ''}`} />
                            {bulkApproving ? 'Aktarılıyor...' : 'CRM Toplu Aktarım'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBulkArchive}
                            disabled={bulkArchiving || bulkApproving || scanning}
                            className="h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-amber-100 flex items-center gap-1.5 border-none active:scale-95"
                            title="Proje Bilgi Talep Formu dışındaki tüm mesajları arşive taşır"
                        >
                            <Archive className="h-3.5 w-3.5" />
                            {bulkArchiving ? 'Arşivleniyor...' : 'Temizle & Arşivle'}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={scanning || bulkApproving || bulkArchiving}
                            className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                            title="Taramayı Başlat (Yeni Mailler ve Formlar)"
                        >
                            <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                )}
                <CardContent className="p-0">
                    {currentItems.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
                            {activeTab === 'pending' ? (
                                <>
                                    <Mail className="h-10 w-10 mb-3 opacity-20" />
                                    <p>Inbox boş</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Web formdan gelen lead'ler burada görünecek
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Archive className="h-10 w-10 mb-3 opacity-20" />
                                    <p>Arşiv boş</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Onaylanan ve reddedilen kayıtlar burada görünecek
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {currentItems.map((item) => (
                                <div
                                    key={item.id}
                                    className={`p-4 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                                        selectedIds.has(item.id) ? 'bg-blue-50/50' : ''
                                    }`}
                                    onClick={() => activeTab === 'archive' ? toggleSelect(item.id) : handleViewItem(item)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1">
                                            {activeTab === 'archive' && (
                                                <div className="mt-0.5">
                                                    {selectedIds.has(item.id) ? (
                                                        <CheckSquare className="h-4 w-4 text-blue-600" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-slate-300" />
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="h-4 w-4 text-slate-500" />
                                                    <span className="font-medium">{item.name}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {item.source}
                                                    </Badge>
                                                    {renderStatusBadge(item.status)}
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                                    {item.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {item.email}
                                                        </span>
                                                    )}
                                                    {item.phone && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {item.phone}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                    {getDisplayMessage(item.message)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-4">
                                            <Clock className="h-3 w-3" />
                                            {format(
                                                new Date(item.created_at),
                                                'dd MMM yyyy HH:mm',
                                                { locale: locale === 'tr' ? tr : enUS }
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog (only for pending items) */}
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                    <DialogHeader>
                        <DialogTitle>Lead Detayları</DialogTitle>
                    </DialogHeader>

                    {viewingItem && (
                        <div className="space-y-4">
                            <div className="grid gap-4">
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="name">Müşteri Adı</Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 px-2"
                                            onClick={handleParseMessage}
                                        >
                                            <Wand2 className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium">Sihirbaz (Mesajdan Ayıkla)</span>
                                        </Button>
                                    </div>
                                    <Input
                                        id="name"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Ad Soyad"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="email">E-posta</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={editEmail}
                                            onChange={(e) => setEditEmail(e.target.value)}
                                            placeholder="email@example.com"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="phone">Telefon</Label>
                                        <Input
                                            id="phone"
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            placeholder="555 123 45 67"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Mesaj</Label>
                                    <Textarea
                                        value={getDisplayMessage(viewingItem.message)}
                                        readOnly
                                        rows={8}
                                        className="bg-slate-50"
                                    />
                                </div>

                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {format(
                                            new Date(viewingItem.created_at),
                                            'dd MMMM yyyy HH:mm',
                                            { locale: locale === 'tr' ? tr : enUS }
                                        )}
                                    </span>
                                    <Badge variant="outline">{viewingItem.source}</Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        {viewingItem?.status === 'pending' ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={handleReject}
                                    disabled={approving || rejecting}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reddet
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={approving || rejecting}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {approving ? 'Onaylanıyor...' : 'CRM\'e Onayla'}
                                </Button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm">
                                {viewingItem?.status === 'approved' ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                        <Check className="h-3 w-3 mr-1" /> Bu kayıt zaten CRM'e aktarılmış
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-700 border-red-200">
                                        <X className="h-3 w-3 mr-1" /> Bu kayıt reddedilmiş
                                    </Badge>
                                )}
                            </div>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
                <DialogContent className="max-w-md bg-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Trash2 className="h-5 w-5" />
                            Kalıcı Silme Onayı
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600">
                        {showDeleteConfirm === 'all'
                            ? `Arşivdeki tüm kayıtlar (${archivedItems.length} adet) kalıcı olarak silinecek. Bu işlem geri alınamaz.`
                            : `Seçili ${selectedIds.size} kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz.`
                        }
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} disabled={deleting}>
                            Vazgeç
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={showDeleteConfirm === 'all' ? handleDeleteAll : handleDeleteSelected}
                            disabled={deleting}
                        >
                            {deleting ? 'Siliniyor...' : 'Evet, Kalıcı Olarak Sil'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
