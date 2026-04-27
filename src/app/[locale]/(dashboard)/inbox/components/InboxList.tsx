'use client'

import React, { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime'
import toast from 'react-hot-toast'
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
    RefreshCw
} from 'lucide-react'
import { approveInboxItem, rejectInboxItem } from '../actions'
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
}

export function InboxList({ initialItems }: InboxListProps) {
    const t = useTranslations('Sidebar.Inbox')
    const locale = useLocale()
    const router = useRouter()
    const [viewingItem, setViewingItem] = useState<InboxItem | null>(null)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)

    // Real-time updates
    useSupabaseRealtime({ table: 'inbox_items' })

    const [scanning, setScanning] = useState(false)

    // Automatically refresh on mount
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
                const total = (data.expiringReservations || 0) + (data.overduePayments || 0) + (data.approachingPapers || 0) + (data.staleLeads || 0) + (data.newEmails || 0)
                if (total > 0) {
                    toast.success(`Tarama tamamlandı: ${total} yeni kayıt bulundu.`)
                    router.refresh() // Reload server data to show new items
                } else if (!silent) {
                    toast.success('Gelen kutusu güncel.')
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

        // Try to parse name from message first
        const nameMatch = message.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
        const parsedName = nameMatch ? nameMatch[1].trim() : null

        // Try to parse email from message
        const emailMatch = message.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
        const parsedEmail = emailMatch ? emailMatch[1].trim() : null

        // Try to parse phone from message
        const phoneMatch = message.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|Proje|$)|\r|\n)/i)
        const parsedPhone = phoneMatch ? phoneMatch[1].trim() : null

        return {
            name: parsedName || item.name || '',
            email: parsedEmail || item.email || '',
            phone: parsedPhone || item.phone || '',
        }
    }

    const handleViewItem = (item: InboxItem) => {
        setViewingItem(item)
        // Auto-parse message fields on open; fallback to DB values if not found
        const parsed = parseMessageFields(item)
        setEditName(parsed.name)
        setEditEmail(parsed.email)
        setEditPhone(parsed.phone)
    }

    const handleParseMessage = () => {
        if (!viewingItem) return

        const message = getDisplayMessage(viewingItem.message)

        // Parse name
        const nameMatch = message.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
        if (nameMatch) setEditName(nameMatch[1].trim())

        // Parse email
        const emailMatch = message.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
        if (emailMatch) setEditEmail(emailMatch[1].trim())

        // Parse phone
        const phoneMatch = message.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|Proje|$)|\r|\n)/i)
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
            toast.success('Lead CRM\'e başarıyla eklendi!')
            setViewingItem(null)
        } else {
            toast.error(result.error || 'Bilinmeyen hata')
        }
    }

    const handleReject = async () => {
        if (!viewingItem) return

        // Toast will show confirmation via UI, for now proceed directly
        // TODO: Add proper confirmation dialog later

        setRejecting(true)
        const result = await rejectInboxItem(viewingItem.id)
        setRejecting(false)

        if (result.success) {
            toast.success('Kayıt reddedildi')
            setViewingItem(null)
        } else {
            toast.error(result.error || 'Bilinmeyen hata')
        }
    }

    return (
        <>
            <Card className="overflow-hidden border-slate-200 shadow-sm relative">
                <div className="absolute top-3 right-3 z-10">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={scanning}
                        className="h-8 w-8 p-0 rounded-full bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                        title="Taramayı Başlat (Yeni Mailler ve Formlar)"
                    >
                        <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <CardContent className="p-0">
                    {initialItems.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground bg-slate-50/50">
                            <Mail className="h-10 w-10 mb-3 opacity-20" />
                            <p>Inbox boş</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Web formdan gelen lead'ler burada görünecek
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {initialItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    onClick={() => handleViewItem(item)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="h-4 w-4 text-slate-500" />
                                                <span className="font-medium">{item.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {item.source}
                                                </Badge>
                                                {item.status === 'approved' && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                        Onaylandı
                                                    </Badge>
                                                )}
                                                {item.status === 'rejected' && (
                                                    <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                                        Reddedildi
                                                    </Badge>
                                                )}
                                                {item.status === 'pending' && (
                                                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                        Bekliyor
                                                    </Badge>
                                                )}
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

            {/* Detail Dialog */}
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Lead Detayları</DialogTitle>
                    </DialogHeader>

                    {viewingItem && (
                        <div className="space-y-4">
                            {/* Editable Fields */}
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
        </>
    )
}
