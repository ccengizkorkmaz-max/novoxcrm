'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Bot, User, Check, Loader2, Sparkles } from 'lucide-react'
import { updateLeadScoreOverride } from '@/app/[locale]/(dashboard)/crm/lead-score-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ScoreHistoryItem {
    date: string
    actor: string
    from: string
    to: string
    reason?: string
}

interface LeadScoreBadgeProps {
    leadId?: string
    customerId?: string
    score: string | null | undefined
    source?: string
    history?: any[]
    userRole: string
}

export function LeadScoreBadge({
    leadId,
    customerId,
    score,
    source = 'ai',
    history = [],
    userRole
}: LeadScoreBadgeProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [selectedScore, setSelectedScore] = useState<string>(score || 'cold')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const canEdit = ['admin', 'owner', 'crm_manager', 'manager', 'sales', 'broker', 'sales_rep', 'agent', 'user'].includes(userRole)
    const scoreSource = source || 'ai'

    const getScoreDetails = (s: string | null | undefined) => {
        switch (s) {
            case 'hot':
                return { label: '🔥 Hot', cls: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' }
            case 'warm':
                return { label: '🌡️ Warm', cls: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' }
            case 'cold':
                return { label: '❄️ Cold', cls: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' }
            case 'call_requested':
                return { label: '📞 Arama', cls: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' }
            case 'disqualified':
                return { label: '⛔ DQ', cls: 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100' }
            default:
                return { label: 'Bilinmiyor', cls: 'bg-slate-50 text-slate-400 border-slate-200' }
        }
    }

    const currentScoreDetails = getScoreDetails(score)

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setLoading(true)
        try {
            const res = await updateLeadScoreOverride({
                leadId,
                customerId,
                newScore: selectedScore,
                reason: reason.trim() || undefined
            })

            if (res.success) {
                toast.success('Lead skoru başarıyla güncellendi.')
                setOpen(false)
                setReason('')
                router.refresh()
            } else {
                toast.error(res.error || 'Skor güncellenirken hata oluştu.')
            }
        } catch (err: any) {
            toast.error(err.message || 'Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const renderTooltipContent = () => {
        const historyItems: ScoreHistoryItem[] = Array.isArray(history) ? history : []
        
        return (
            <div className="space-y-2 p-1 max-w-[280px]">
                <div className="flex items-center gap-1.5 font-bold border-b pb-1 text-slate-700 text-xs">
                    {scoreSource === 'manual' ? (
                        <>
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span>Manuel Override</span>
                        </>
                    ) : (
                        <>
                            <Bot className="w-3.5 h-3.5 text-purple-500" />
                            <span>AI Skorlama</span>
                        </>
                    )}
                </div>

                {historyItems.length > 0 ? (
                    <div className="relative border-l border-slate-200 pl-3 ml-1.5 space-y-2 text-[11px] py-1">
                        {historyItems.map((item, idx) => (
                            <div key={idx} className="relative">
                                {/* Bullet indicator */}
                                <div className="absolute -left-[16.5px] top-1 w-2.5 h-2.5 rounded-full border border-white bg-slate-300" />
                                <div className="font-semibold text-slate-800">
                                    {item.actor}
                                </div>
                                <div className="text-slate-500 font-mono text-[9px]">
                                    {new Date(item.date).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-slate-700 mt-0.5 flex items-center gap-1 font-medium">
                                    <span className="line-through text-slate-400">{getScoreDetails(item.from).label}</span>
                                    <span>➔</span>
                                    <span className="text-slate-900">{getScoreDetails(item.to).label}</span>
                                </div>
                                {item.reason && (
                                    <div className="text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 mt-1 italic leading-tight">
                                        "{item.reason}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-slate-500 text-[11px] py-1 leading-normal">
                        Bu skor {scoreSource === 'manual' ? 'temsilci' : 'AI'} tarafından atanmıştır. Henüz skor değişim geçmişi bulunmuyor.
                    </div>
                )}
            </div>
        )
    }

    const badgeContent = (
        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-sm transition-all cursor-pointer select-none ${currentScoreDetails.cls}`}>
            {currentScoreDetails.label}
            {scoreSource === 'manual' ? (
                <User className="w-2.5 h-2.5 text-blue-500" />
            ) : (
                <Bot className="w-2.5 h-2.5 text-purple-500" />
            )}
        </span>
    )

    if (!canEdit) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                        {badgeContent}
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-white border shadow-md rounded-lg p-2.5 text-slate-800 z-50">
                        {renderTooltipContent()}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <Popover open={open} onOpenChange={setOpen}>
                <Tooltip delayDuration={300} disableHoverableContent={open}>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            {badgeContent}
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-white border shadow-md rounded-lg p-2.5 text-slate-800 z-50">
                        {renderTooltipContent()}
                    </TooltipContent>
                </Tooltip>

                <PopoverContent className="w-64 p-4 z-50 bg-white border rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-4">
                        <div className="font-bold text-xs text-slate-800 border-b pb-1.5 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Skoru Güncelle</span>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skor Seçin</label>
                            <div className="grid grid-cols-2 gap-1.5">
                                {['hot', 'warm', 'cold', 'call_requested', 'disqualified'].map((s) => {
                                    const details = getScoreDetails(s)
                                    const isSelected = selectedScore === s
                                    return (
                                        <button
                                            key={s}
                                            onClick={() => setSelectedScore(s)}
                                            className={`text-left text-[11px] px-2 py-1.5 rounded-lg border font-semibold flex items-center justify-between transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{details.label}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Neden (İsteğe Bağlı)</label>
                            <textarea
                                className="w-full text-xs p-2 border rounded-lg resize-none min-h-[50px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Güncelleme nedeni yazın..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                            <button
                                onClick={() => { setOpen(false); setReason(''); }}
                                className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-2.5 py-1.5 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                            >
                                {loading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    'Kaydet'
                                )}
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
}
