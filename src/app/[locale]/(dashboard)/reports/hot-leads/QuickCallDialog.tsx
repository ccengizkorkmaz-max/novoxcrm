'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
    Phone, 
    User, 
    Copy, 
    Check, 
    Save, 
    Sparkles, 
    ThumbsUp, 
    Calendar, 
    PhoneOff, 
    Clock, 
    ThumbsDown,
    MessageSquare,
    History
} from 'lucide-react'
import { toast } from 'sonner'
import { saveCampaignLeadCallNote } from '../actions'

export type CallStatusType = 'positive' | 'appointment' | 'callback' | 'unreachable' | 'negative'

interface QuickCallDialogProps {
    lead: any | null
    isOpen: boolean
    onClose: () => void
    onSuccess: (updatedLead: any) => void
}

const CALL_STATUS_OPTIONS: { id: CallStatusType; label: string; icon: any; color: string; activeColor: string }[] = [
    { 
        id: 'positive', 
        label: 'Görüşüldü - Olumlu', 
        icon: ThumbsUp, 
        color: 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100',
        activeColor: 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300'
    },
    { 
        id: 'appointment', 
        label: 'Randevu Alındı', 
        icon: Calendar, 
        color: 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100',
        activeColor: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
    },
    { 
        id: 'callback', 
        label: 'Tekrar Aranacak', 
        icon: Clock, 
        color: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100',
        activeColor: 'bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
    },
    { 
        id: 'unreachable', 
        label: 'Ulaşılamadı / Meşgul', 
        icon: PhoneOff, 
        color: 'border-slate-200 text-slate-700 bg-slate-100 hover:bg-slate-200',
        activeColor: 'bg-slate-700 text-white border-slate-700 ring-2 ring-slate-300'
    },
    { 
        id: 'negative', 
        label: 'Olumsuz / Vazgeçti', 
        icon: ThumbsDown, 
        color: 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100',
        activeColor: 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
    },
]

export default function QuickCallDialog({ lead, isOpen, onClose, onSuccess }: QuickCallDialogProps) {
    const [selectedStatus, setSelectedStatus] = useState<CallStatusType>('positive')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    // Reset when lead changes
    React.useEffect(() => {
        if (lead) {
            setNote('')
            setSelectedStatus('positive')
        }
    }, [lead])

    if (!lead) return null

    const handleCopyPhone = () => {
        navigator.clipboard.writeText((lead.customerPhone || '').replace(/\s+/g, ''))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSave = async () => {
        if (!selectedStatus) {
            toast.error('Lütfen bir arama durumu seçiniz.')
            return
        }

        setSaving(true)
        const statusObj = CALL_STATUS_OPTIONS.find(s => s.id === selectedStatus)
        const statusLabel = statusObj?.label || 'Görüşüldü'

        try {
            const res = await saveCampaignLeadCallNote({
                customerId: lead.customerId,
                saleId: lead.saleId,
                callStatus: selectedStatus,
                callStatusLabel: statusLabel,
                note: note.trim()
            })

            if (res.error) {
                toast.error(`Hata: ${res.error}`)
            } else {
                toast.success('Görüşme notu ve satış kartı başarıyla güncellendi!')
                onSuccess({
                    ...lead,
                    isCalled: true,
                    firstContact: res.firstContact,
                    lastCallNote: res.lastNote,
                    lastCallDate: new Date().toISOString()
                })
                onClose()
            }
        } catch (err: any) {
            console.error('Call note save error:', err)
            toast.error('Kayıt yapılırken bir hata oluştu.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[540px] rounded-3xl p-6 bg-white shadow-2xl border-slate-100">
                <DialogHeader className="gap-1">
                    <div className="flex items-center justify-between gap-2">
                        <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Phone className="h-5 w-5 text-blue-600" />
                            Hızlı Görüşme & Arama Notu
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-slate-500 font-medium">
                        Arama sonucunu seçip notunuzu girdiğinizde CRM ve satış kartı otomatik güncellenir.
                    </DialogDescription>
                </DialogHeader>

                {/* Lead Summary Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 my-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                                {lead.customerName ? lead.customerName.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-extrabold text-slate-900 text-sm truncate">{lead.customerName}</h4>
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {lead.assignedTo ? `Temsilci: ${lead.assignedTo}` : 'Temsilci atanmamış'}
                                </span>
                            </div>
                        </div>

                        {lead.buttonReply && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-bold shrink-0">
                                {lead.buttonReply}
                            </Badge>
                        )}
                    </div>

                    {/* Phone Call Trigger */}
                    <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 shadow-xs">
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-blue-600" />
                            <span className="font-bold text-slate-800 text-sm">{lead.customerPhone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCopyPhone}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Numarayı Kopyala"
                            >
                                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </button>
                            <a
                                href={`tel:${(lead.customerPhone || '').replace(/\s+/g, '')}`}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5" />
                                Hemen Ara
                            </a>
                        </div>
                    </div>

                    {/* Previous Note / Status if exists */}
                    {(lead.lastCallNote || lead.firstContact) && (
                        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
                            <History className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-bold text-amber-800">
                                    Mevcut Durum: {lead.firstContact || 'Görüşüldü'}
                                </span>
                                {lead.lastCallNote && (
                                    <span className="text-amber-700/90 text-[11px] line-clamp-2">
                                        &ldquo;{lead.lastCallNote}&rdquo;
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Selection Buttons */}
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-700">Arama Sonucu / Durum</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {CALL_STATUS_OPTIONS.map((status) => {
                            const Icon = status.icon
                            const isSelected = selectedStatus === status.id
                            return (
                                <button
                                    key={status.id}
                                    type="button"
                                    onClick={() => setSelectedStatus(status.id)}
                                    className={`p-2.5 rounded-xl border font-bold text-xs flex items-center gap-2 transition-all cursor-pointer text-left ${
                                        isSelected ? status.activeColor : status.color
                                    }`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{status.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Note Textarea */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Görüşme Notu</span>
                        <span className="text-[10px] text-slate-400 font-normal">CRM Satış kartına ve aktivitelere işlenir</span>
                    </label>
                    <Textarea
                        placeholder="Müşteri ne söyledi? Katalog istendi mi, ne zaman tekrar aranacak? vb."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[80px]"
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={saving}
                        className="rounded-xl border-slate-200 text-slate-600 font-semibold"
                    >
                        Vazgeç
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 gap-1.5"
                    >
                        {saving ? (
                            <>Kaydediliyor...</>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Kaydet & CRM&apos;e İşle
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
