'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Zap, ChevronRight, Info } from "lucide-react"
import CampaignDetailDialog from './CampaignDetailDialog'

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

export default function IncentiveCampaignsList({ campaigns }: { campaigns: IncentiveCampaign[] }) {
    const [selectedCampaign, setSelectedCampaign] = useState<IncentiveCampaign | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleOpenDetail = (campaign: IncentiveCampaign) => {
        setSelectedCampaign(campaign)
        setIsDialogOpen(true)
    }

    return (
        <>
            <Card className="border-none shadow-sm bg-slate-900 text-white rounded-xl overflow-hidden shadow-xl shadow-slate-200/50">
                <CardHeader className="px-4 py-3 border-b border-white/10">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-blue-400" />
                        Aktif Teşvikler
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-1">
                    {campaigns && campaigns.length > 0 ? (
                        campaigns.map((camp) => (
                            <button
                                key={camp.id}
                                onClick={() => handleOpenDetail(camp)}
                                className="w-full text-left p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-start gap-2.5 group hover:bg-white/10 transition-all border-transparent hover:border-white/10"
                            >
                                <div className="h-7 w-7 shrink-0 rounded bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </div>
                                <div className="min-w-0 flex-1 pr-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[11px] font-bold truncate leading-tight mt-0.5">{camp.name}</p>
                                        {camp.target_count && (
                                            <span className="shrink-0 text-[10px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                {camp.current_progress || 0}/{camp.target_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                                        {camp.projects?.name || 'Genel'} • {camp.bonus_value.toLocaleString('tr-TR')} ₺ Bonus
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <Info className="h-5 w-5 mx-auto mb-2 opacity-20" />
                            <p className="text-[9px] text-slate-500 italic">Aktif kampanya bulunmuyor.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <CampaignDetailDialog
                campaign={selectedCampaign}
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </>
    )
}
