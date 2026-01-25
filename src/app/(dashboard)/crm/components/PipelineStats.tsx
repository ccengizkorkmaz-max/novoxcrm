'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Clock, FileText, Handshake, CheckCircle2, Trophy, XCircle, Building2 } from "lucide-react"

// ... imports

interface PipelineStatsProps {
    sales: any[]
}

export default function PipelineStats({ sales }: PipelineStatsProps) {
    // Group counts
    const counts = {
        Lead: 0,
        Prospect: 0,
        Reservation: 0,
        Proposal: 0,
        Negotiation: 0,
        Sold: 0,
        Completed: 0,
        Lost: 0
    }

    if (sales) {
        sales.forEach(sale => {
            const s = sale.status
            if (s === 'Lead') counts.Lead++
            else if (['Prospect'].includes(s)) counts.Prospect++
            else if (['Reservation', 'Reserved', 'Opsiyon - Kapora Bekleniyor'].includes(s)) counts.Reservation++
            else if (['Proposal', 'Teklif - Kapora Bekleniyor'].includes(s)) counts.Proposal++
            else if (['Negotiation'].includes(s)) counts.Negotiation++
            else if (['Sold'].includes(s)) counts.Sold++
            else if (['Completed'].includes(s)) counts.Completed++
            else if (['Lost'].includes(s)) counts.Lost++
        })
    }

    const items = [
        { label: 'Lead', count: counts.Lead, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Fırsat', count: counts.Prospect, icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Opsiyon', count: counts.Reservation, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: 'Teklif', count: counts.Proposal, icon: FileText, color: 'text-cyan-500', bg: 'bg-cyan-50' },
        { label: 'Pazarlık', count: counts.Negotiation, icon: Handshake, color: 'text-violet-500', bg: 'bg-violet-50' },
        { label: 'Satıldı', count: counts.Sold, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: 'Kazanıldı', count: counts.Completed, icon: Trophy, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Kayıp', count: counts.Lost, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
            {items.map((item) => (
                <Card key={item.label} className="border-none shadow-sm">
                    <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 ${item.bg} rounded-t-lg px-4 pt-4`}>
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">{item.label}</CardTitle>
                        <item.icon className={`h-4 w-4 ${item.color}`} />
                    </CardHeader>
                    <CardContent className={`px-4 py-3 ${item.bg} bg-opacity-30 rounded-b-lg`}>
                        <div className="text-2xl font-bold">{item.count}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
