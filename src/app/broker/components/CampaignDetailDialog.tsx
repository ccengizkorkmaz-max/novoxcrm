'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Zap, Calendar, Target, Trophy, Info } from "lucide-react"

interface IncentiveCampaign {
    id: string
    name: string
    description: string
    type: string
    bonus_value: number
    start_date: string
    end_date: string
    target_count: number
    current_progress?: number
    projects?: { name: string }
}

export default function CampaignDetailDialog({
    campaign,
    open,
    onOpenChange
}: {
    campaign: IncentiveCampaign | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    if (!campaign) return null

    const formatDate = (date: string) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] rounded-2xl">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                        <Zap className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">{campaign.name}</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Bu kampanya kapsamında kazanabileceğiniz ek teşvik ve ödüller.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kampanya Detayı</p>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                            {campaign.description || 'Bu kampanya belirli hedeflere ulaşan brokerlar için ek prim fırsatları sunar.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col items-center text-center">
                            <Trophy className="h-5 w-5 text-amber-500 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ek Bonus</p>
                            <p className="text-lg font-black text-slate-900">
                                {campaign.bonus_value.toLocaleString('tr-TR')} ₺
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col items-center text-center">
                            <Target className="h-5 w-5 text-blue-500 mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Hedef</p>
                            <p className="text-lg font-black text-slate-900">
                                {campaign.target_count || 1} {campaign.type === 'Visits' ? 'Ziyaret' : campaign.type === 'Volume' ? '₺ Hacim' : 'Satış'}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {campaign.target_count > 0 && (
                        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100/50">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">İlerleme Durumu</p>
                                <p className="text-[11px] font-black text-blue-900 uppercase">
                                    {campaign.current_progress || 0} / {campaign.target_count} {campaign.type === 'Visits' ? 'Ziyaret' : 'Adet'}
                                </p>
                            </div>
                            <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden border border-blue-200 shadow-inner">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                    style={{ width: `${Math.min(100, ((campaign.current_progress || 0) / campaign.target_count) * 100)}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-blue-600 font-bold mt-2 italic">
                                {((campaign.current_progress || 0) / campaign.target_count) >= 1
                                    ? "🎉 Tebrikler! Hedefe ulaştınız."
                                    : `Hedefe ulaşmak için ${Math.max(0, campaign.target_count - (campaign.current_progress || 0))} ${campaign.type === 'Visits' ? 'ziyaret' : 'satış'} daha gerekiyor.`}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                                <Calendar className="h-3 w-3" /> Başlangıç
                            </div>
                            <p className="text-xs font-bold text-slate-700">{formatDate(campaign.start_date)}</p>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase justify-end">
                                <Calendar className="h-3 w-3" /> Bitiş
                            </div>
                            <p className="text-xs font-bold text-slate-700">{formatDate(campaign.end_date)}</p>
                        </div>
                    </div>

                    {campaign.projects && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
                            <Info className="h-4 w-4 text-blue-600" />
                            <p className="text-xs font-bold text-blue-700">
                                Geçerli Proje: <span className="font-black underline">{campaign.projects.name}</span>
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
