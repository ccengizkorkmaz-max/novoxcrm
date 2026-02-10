'use client'

import { useTranslations } from 'next-intl'
import { Trophy, Medal, Award, TrendingUp, Phone, Calendar } from 'lucide-react'

interface SalesPersonData {
    name: string
    totalSales: number
    contractCount: number
    activitiesCount: number
}

interface SalesLeaderboardProps {
    data: SalesPersonData[]
    currency?: string
}

const rankIcons = [
    { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', ring: 'ring-yellow-500/20' },
    { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200', ring: 'ring-slate-400/20' },
    { icon: Award, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', ring: 'ring-amber-700/20' },
]

export function SalesLeaderboard({ data, currency = 'TRY' }: SalesLeaderboardProps) {
    const t = useTranslations('Dashboard')

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Henüz satış verisi bulunmuyor.
            </div>
        )
    }

    const maxSales = Math.max(...data.map(d => d.totalSales), 1)

    return (
        <div className="space-y-2">
            {data.slice(0, 10).map((person, index) => {
                const rank = rankIcons[index] || null
                const barWidth = (person.totalSales / maxSales) * 100

                return (
                    <div
                        key={person.name}
                        className={`flex items-center gap-3 p-2.5 rounded-xl transition-all hover:shadow-sm ${index < 3 ? `border ${rank?.bg}` : 'hover:bg-slate-50'
                            }`}
                    >
                        {/* Rank */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${index < 3 ? `${rank?.ring} ring-2` : 'bg-slate-100'
                            }`}>
                            {rank ? (
                                <rank.icon className={`h-4 w-4 ${rank.color}`} />
                            ) : (
                                <span className="text-slate-400">{index + 1}</span>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-sm font-bold truncate ${index < 3 ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {person.name}
                                </span>
                                <span className={`text-xs font-black whitespace-nowrap ${index === 0 ? 'text-yellow-600' : 'text-slate-700'}`}>
                                    {person.totalSales.toLocaleString('tr-TR', {
                                        style: 'currency',
                                        currency,
                                        maximumFractionDigits: 0
                                    })}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-400'
                                        }`}
                                    style={{ width: `${barWidth}%` }}
                                />
                            </div>

                            {/* Mini stats */}
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <TrendingUp className="h-3 w-3" />
                                    <span className="font-bold">{person.contractCount} satış</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Phone className="h-3 w-3" />
                                    <span className="font-bold">{person.activitiesCount} aktivite</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
