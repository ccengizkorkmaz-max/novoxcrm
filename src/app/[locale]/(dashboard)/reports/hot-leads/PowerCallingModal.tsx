'use client'

import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
    Phone, 
    User, 
    Copy, 
    Check, 
    Save, 
    ChevronRight, 
    ChevronLeft, 
    SkipForward, 
    Zap, 
    ThumbsUp, 
    Calendar, 
    PhoneOff, 
    Clock, 
    ThumbsDown,
    CheckCircle2,
    History,
    Sparkles,
    PartyPopper
} from 'lucide-react'
import { toast } from 'sonner'
import { saveCampaignLeadCallNote } from '../actions'
import { CallStatusType } from './QuickCallDialog'

interface PowerCallingModalProps {
    leads: any[]
    isOpen: boolean
    onClose: () => void
    onLeadUpdated: (updatedLead: any) => void
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

export default function PowerCallingModal({ leads, isOpen, onClose, onLeadUpdated }: PowerCallingModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedStatus, setSelectedStatus] = useState<CallStatusType>('positive')
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)
    const [completedCount, setCompletedCount] = useState(0)

    // Current lead
    const currentLead = leads[currentIndex] || null
    const totalCount = leads.length
    const progressPercent = totalCount > 0 ? Math.round(((currentIndex) / totalCount) * 100) : 0

    React.useEffect(() => {
        if (isOpen) {
            // Aranmamış ilk kişiyi bulmaya çalış
            const firstUncalledIdx = leads.findIndex(l => !l.isCalled)
            if (firstUncalledIdx !== -1) {
                setCurrentIndex(firstUncalledIdx)
            } else {
                setCurrentIndex(0)
            }
            setCompletedCount(0)
        }
    }, [isOpen, leads])

    React.useEffect(() => {
        setNote('')
        setSelectedStatus('positive')
        setCopied(false)
    }, [currentIndex])

    if (!isOpen) return null

    const handleCopyPhone = () => {
        if (!currentLead) return
        navigator.clipboard.writeText((currentLead.customerPhone || '').replace(/\s+/g, ''))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSaveAndNext = async () => {
        if (!currentLead) return

        setSaving(true)
        const statusObj = CALL_STATUS_OPTIONS.find(s => s.id === selectedStatus)
        const statusLabel = statusObj?.label || 'Görüşüldü'

        try {
            const res = await saveCampaignLeadCallNote({
                customerId: currentLead.customerId,
                saleId: currentLead.saleId,
                callStatus: selectedStatus,
                callStatusLabel: statusLabel,
                note: note.trim()
            })

            if (res.error) {
                toast.error(`Hata: ${res.error}`)
            } else {
                toast.success(`${currentLead.customerName} için arama kaydedildi!`)
                onLeadUpdated({
                    ...currentLead,
                    isCalled: true,
                    firstContact: res.firstContact,
                    lastCallNote: res.lastNote,
                    lastCallDate: new Date().toISOString()
                })
                setCompletedCount(prev => prev + 1)

                // Sıradakine geç
                if (currentIndex < totalCount - 1) {
                    setCurrentIndex(prev => prev + 1)
                } else {
                    toast.success('🎉 Tebrikler! Tüm listedeki aramaları tamamladınız!')
                }
            }
        } catch (err: any) {
            console.error('Call note save error:', err)
            toast.error('Kayıt yapılırken bir hata oluştu.')
        } finally {
            setSaving(false)
        }
    }

    const handleSkip = () => {
        if (currentIndex < totalCount - 1) {
            setCurrentIndex(prev => prev + 1)
        } else {
            toast.info('Listenin sonuna geldiniz.')
        }
    }

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[620px] rounded-3xl p-6 bg-white shadow-2xl border-slate-100 max-h-[95vh] overflow-y-auto">
                <DialogHeader className="gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                                <Zap className="h-5 w-5 fill-amber-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    Seri Arama Modu
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    Sayfa değiştirmeden sırayla arama yapın ve notlarınızı işleyin.
                                </DialogDescription>
                            </div>
                        </div>

                        <Badge className="bg-slate-900 text-white font-mono text-xs px-3 py-1 rounded-full">
                            {currentIndex + 1} / {totalCount}
                        </Badge>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mt-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500">
                            <span>İlerleme: %{progressPercent}</span>
                            <span>{completedCount} kişi notlandı</span>
                        </div>
                        <Progress value={progressPercent} className="h-2 rounded-full bg-slate-100" />
                    </div>
                </DialogHeader>

                {totalCount === 0 || !currentLead ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                        <PartyPopper className="h-12 w-12 text-amber-500 animate-bounce" />
                        <h3 className="text-lg font-black text-slate-800">Arama Listesi Tamamlandı!</h3>
                        <p className="text-xs text-slate-500 max-w-sm">
                            Bu filtredeki tüm müşteriler işlendi veya aranacak uygun kayıt kalmadı.
                        </p>
                        <Button onClick={onClose} className="rounded-xl font-bold mt-2">
                            Pencereyi Kapat
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Current Customer Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 md:p-5 shadow-lg relative overflow-hidden">
                            <div className="flex items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center font-black text-lg shrink-0">
                                        {currentLead.customerName ? currentLead.customerName.charAt(0).toUpperCase() : 'M'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-black tracking-tight truncate">{currentLead.customerName}</h3>
                                            {currentLead.isCalled && (
                                                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-bold">
                                                    Arandı
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            {currentLead.assignedTo ? `Temsilci: ${currentLead.assignedTo}` : 'Temsilci atanmamış'}
                                        </p>
                                    </div>
                                </div>

                                {currentLead.buttonReply && (
                                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs font-bold shrink-0">
                                        {currentLead.buttonReply}
                                    </Badge>
                                )}
                            </div>

                            {/* Big Call Button & Phone Bar */}
                            <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-emerald-400" />
                                    <span className="font-mono text-base font-bold text-white tracking-wide">
                                        {currentLead.customerPhone}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyPhone}
                                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                        title="Numarayı Kopyala"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                </div>

                                <a
                                    href={`tel:${(currentLead.customerPhone || '').replace(/\s+/g, '')}`}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 cursor-pointer"
                                >
                                    <Phone className="h-4 w-4 fill-white" />
                                    Tek Tıkla Ara
                                </a>
                            </div>

                            {/* Previous note if exists */}
                            {(currentLead.lastCallNote || currentLead.firstContact) && (
                                <div className="mt-3 bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-300 flex items-start gap-2">
                                    <History className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <span className="font-bold text-amber-300">Önceki Arama: {currentLead.firstContact || 'Görüşüldü'}</span>
                                        {currentLead.lastCallNote && (
                                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">&ldquo;{currentLead.lastCallNote}&rdquo;</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Buttons */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">Arama Sonucunu Seçin</label>
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
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 flex justify-between">
                                <span>Görüşme Notu</span>
                                <span className="text-[10px] text-slate-400 font-normal">Otomatik CRM&apos;e eklenir</span>
                            </label>
                            <Textarea
                                placeholder="Görüşme özeti, müşterinin talebi vb..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="rounded-xl border-slate-200 text-sm focus:border-blue-500 min-h-[75px]"
                            />
                        </div>

                        {/* Navigation & Action Bar */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevious}
                                    disabled={currentIndex === 0 || saving}
                                    className="rounded-xl border-slate-200 text-xs font-bold text-slate-600 gap-1 flex-1 sm:flex-none"
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    Önceki
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleSkip}
                                    disabled={currentIndex >= totalCount - 1 || saving}
                                    className="rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 gap-1 flex-1 sm:flex-none"
                                >
                                    Atla
                                    <SkipForward className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <Button
                                type="button"
                                onClick={handleSaveAndNext}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm h-11 px-5 rounded-xl shadow-lg shadow-blue-500/25 gap-2 w-full sm:w-auto"
                            >
                                {saving ? (
                                    <>İşleniyor...</>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Kaydet & Sıradakine Geç
                                        <ChevronRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
