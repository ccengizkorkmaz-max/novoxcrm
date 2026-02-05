'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
    Mail,
    Calendar,
    Clock,
    User,
    Check,
    X,
    Phone,
    MessageSquare
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
import { useLocale } from 'next-intl'

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
    const [viewingItem, setViewingItem] = useState<InboxItem | null>(null)
    const [approving, setApproving] = useState(false)
    const [rejecting, setRejecting] = useState(false)

    // Editable fields
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editPhone, setEditPhone] = useState('')

    const handleViewItem = (item: InboxItem) => {
        setViewingItem(item)
        setEditName(item.name || '')
        setEditEmail(item.email || '')
        setEditPhone(item.phone || '')
    }

    const handleApprove = async () => {
        if (!viewingItem) return

        setApproving(true)
        const result = await approveInboxItem(viewingItem.id)
        setApproving(false)

        if (result.success) {
            alert('Lead CRM\'e başarıyla eklendi!')
            setViewingItem(null)
            window.location.reload()
        } else {
            alert('Hata: ' + (result.error || 'Bilinmeyen hata'))
        }
    }

    const handleReject = async () => {
        if (!viewingItem) return

        if (!confirm('Bu kaydı reddetmek istediğinize emin misiniz?')) {
            return
        }

        setRejecting(true)
        const result = await rejectInboxItem(viewingItem.id)
        setRejecting(false)

        if (result.success) {
            alert('Kayıt reddedildi')
            setViewingItem(null)
            window.location.reload()
        } else {
            alert('Hata: ' + (result.error || 'Bilinmeyen hata'))
        }
    }

    return (
        <>
            <Card className="overflow-hidden border-slate-200 shadow-sm">
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
                                                {item.message}
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
                                    <Label htmlFor="name">Müşteri Adı</Label>
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
                                        value={viewingItem.message}
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
