'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Phone, Calendar, Clock, CheckCircle2, RefreshCw, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { logCallActivityOutcome } from '@/app/[locale]/(dashboard)/crm/activities/actions'
import { cn, toTurkeyDateTimeLocal } from '@/lib/utils'

export interface QuickCallOutcomeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    activity: {
        id: string
        summary?: string
        type?: string
        customer_id?: string
        customerName?: string
        customerPhone?: string
        projectName?: string
    }
    onSuccess?: () => void
}

const OUTCOME_OPTIONS = [
    { value: 'Aradım, Olumlu', label: '🟢 Aradım, Olumlu', color: 'border-emerald-300 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100', defaultFollowup: true },
    { value: 'Değerlendiriyor', label: '🤔 Değerlendiriyor', color: 'border-purple-300 bg-purple-50/80 text-purple-900 hover:bg-purple-100', defaultFollowup: true },
    { value: 'Tekrar Aranacak', label: '🔄 Tekrar Aranacak', color: 'border-blue-300 bg-blue-50/80 text-blue-900 hover:bg-blue-100 font-bold', defaultFollowup: true },
    { value: 'Randevu Alındı', label: '📅 Randevu Alındı', color: 'border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 font-bold', defaultFollowup: false },
    { value: 'Aradım, Olumsuz', label: '🔴 Aradım, Olumsuz', color: 'border-red-300 bg-red-50/80 text-red-900 hover:bg-red-100', defaultFollowup: false },
    { value: 'Ulaşamadım - Cevap Vermiyor', label: '📵 Ulaşamadım - Cevap Yok', color: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100', defaultFollowup: true },
    { value: 'Ulaşamadım - Meşgul / Reddetti', label: '⏳ Meşgul / Reddetti', color: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100', defaultFollowup: true },
    { value: 'Ulaşamadım - Kapalı / Ulaşılamıyor', label: '📴 Kapalı / Ulaşılamıyor', color: 'border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100', defaultFollowup: true },
    { value: 'Ulaşamadım - WhatsApp / SMS Atıldı', label: '💬 WhatsApp / SMS Atıldı', color: 'border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100', defaultFollowup: true },
    { value: 'Ulaşamadım - Hatalı Numara', label: '🚫 Hatalı / Yanlış Numara', color: 'border-rose-200 bg-rose-50/50 text-rose-800 hover:bg-rose-100', defaultFollowup: false },
    { value: 'Ulaşamadım - Numara Kullanılmıyor', label: '❌ Numara Kullanılmıyor', color: 'border-rose-200 bg-rose-50/50 text-rose-800 hover:bg-rose-100', defaultFollowup: false },
    { value: 'Ulaşamadım - Yanlış Kişi', label: '👤 Yanlış Kişi', color: 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100', defaultFollowup: false },
]

export function QuickCallOutcomeModal({
    open,
    onOpenChange,
    activity,
    onSuccess
}: QuickCallOutcomeModalProps) {
    const router = useRouter()
    const [selectedOutcome, setSelectedOutcome] = useState<string>('Tekrar Aranacak')
    const [notes, setNotes] = useState('')
    const [needsFollowup, setNeedsFollowup] = useState<boolean>(true)
    const [nextActionDate, setNextActionDate] = useState<string>(() => {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        return toTurkeyDateTimeLocal(tomorrow.toISOString())
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSelectOutcome = (opt: typeof OUTCOME_OPTIONS[0]) => {
        setSelectedOutcome(opt.value)
        setNeedsFollowup(opt.defaultFollowup)
    }

    const setQuickTime = (hoursFromNow: number, targetHour?: number) => {
        const d = new Date()
        if (targetHour !== undefined) {
            d.setDate(d.getDate() + (hoursFromNow >= 24 ? Math.floor(hoursFromNow / 24) : 0))
            d.setHours(targetHour, 0, 0, 0)
        } else {
            d.setHours(d.getHours() + hoursFromNow)
        }
        setNextActionDate(toTurkeyDateTimeLocal(d.toISOString()))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedOutcome) {
            toast.error('Lütfen bir sonuç seçin.')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await logCallActivityOutcome({
                activityId: activity.id,
                outcome: selectedOutcome,
                notes: notes.trim() || undefined,
                nextActionDate: needsFollowup ? nextActionDate : undefined,
                nextActionType: 'Call',
                nextActionSummary: `📞 Takip Araması: ${activity.customerName || 'Müşteri'} (${selectedOutcome})`
            })

            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Görüşme sonucu kaydedildi ✅')
                if (needsFollowup) {
                    toast.info('Bir sonraki takip araması ajandaya eklendi 📅')
                }
                onOpenChange(false)
                if (onSuccess) onSuccess()
                router.refresh()
            }
        } catch (err: any) {
            toast.error(err?.message || 'Bir hata oluştu')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden rounded-2xl border-slate-200">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-4 pb-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <Phone className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white leading-tight">
                                    Görüşme Sonucunu Kaydet
                                </DialogTitle>
                                <p className="text-xs text-blue-100 font-medium mt-0.5">
                                    {activity.customerName || 'Müşteri'} {activity.customerPhone ? `(${activity.customerPhone})` : ''}
                                    {activity.projectName ? ` • ${activity.projectName}` : ''}
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
                        {/* Outcome Grid */}
                        <div>
                            <Label className="text-xs font-bold text-slate-700 block mb-2">
                                İlk Temas &amp; Arama Sonucu <span className="text-red-500">*</span>
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {OUTCOME_OPTIONS.map((opt) => {
                                    const isSelected = selectedOutcome === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleSelectOutcome(opt)}
                                            className={cn(
                                                "p-2 text-left rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-between",
                                                opt.color,
                                                isSelected
                                                    ? "ring-2 ring-blue-600 border-blue-500 shadow-xs font-bold scale-[1.01]"
                                                    : "opacity-85 hover:opacity-100"
                                            )}
                                        >
                                            <span className="truncate">{opt.label}</span>
                                            {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Follow-up Section if needed */}
                        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={needsFollowup}
                                        onChange={(e) => setNeedsFollowup(e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span>Tekrar Arama / Takip Planla</span>
                                </Label>
                                {needsFollowup && (
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                        Yeni Aktivite Oluşturulacak
                                    </span>
                                )}
                            </div>

                            {needsFollowup && (
                                <div className="space-y-2 pt-1 border-t border-slate-200/70">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Hızlı Seçim:</span>
                                        <button
                                            type="button"
                                            onClick={() => setQuickTime(1)}
                                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 font-medium"
                                        >
                                            +1 Saat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickTime(3)}
                                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 font-medium"
                                        >
                                            +3 Saat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickTime(24, 10)}
                                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 font-medium"
                                        >
                                            Yarın 10:00
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickTime(24, 14)}
                                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 font-medium"
                                        >
                                            Yarın 14:00
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setQuickTime(48, 11)}
                                            className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 font-medium"
                                        >
                                            2 Gün Sonra
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                        <div>
                                            <Label className="text-[10px] font-semibold text-slate-600">Takip Tarihi &amp; Saati</Label>
                                            <input
                                                type="datetime-local"
                                                value={nextActionDate}
                                                onChange={(e) => setNextActionDate(e.target.value)}
                                                required={needsFollowup}
                                                className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-blue-500 font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Process Notes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">
                                Süreç Notu / Müşteri Geri Bildirimi
                            </Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Örn: Müşteri müsait değildi, yarın sabah tekrar aranmasını rica etti veya fiyat bilgisini değerlendirecek..."
                                rows={3}
                                className="text-xs resize-none border-slate-200 focus:border-blue-500 rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            className="text-xs text-slate-500 hover:text-slate-800"
                        >
                            Vazgeç
                        </Button>

                        <Button
                            type="submit"
                            size="sm"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-sm cursor-pointer"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Sonucu Kaydet &amp; Tamamla
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
