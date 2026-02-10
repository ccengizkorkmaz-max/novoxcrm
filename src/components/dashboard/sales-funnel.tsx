'use client'

import { useTranslations } from 'next-intl'

interface FunnelStage {
    stage: string
    count: number
    color: string
}

interface SalesFunnelProps {
    data: FunnelStage[]
}

export function SalesFunnel({ data }: SalesFunnelProps) {
    const t = useTranslations('Dashboard')
    const maxCount = Math.max(...data.map(d => d.count), 1)

    return (
        <div className="space-y-2">
            {data.map((stage, index) => {
                const widthPercentage = Math.max((stage.count / maxCount) * 100, 15)
                const conversionRate = index > 0 && data[index - 1].count > 0
                    ? ((stage.count / data[index - 1].count) * 100).toFixed(0)
                    : null

                return (
                    <div key={stage.stage} className="relative group">
                        {/* Conversion arrow */}
                        {conversionRate && (
                            <div className="flex items-center justify-center -mt-1 mb-0.5">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                        <path d="M4 0L4 6M4 6L1 3M4 6L7 3" stroke="currentColor" strokeWidth="1.5" />
                                    </svg>
                                    {conversionRate}%
                                </div>
                            </div>
                        )}
                        {/* Bar */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <div
                                    className="h-10 rounded-lg flex items-center px-4 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-md cursor-default"
                                    style={{
                                        width: `${widthPercentage}%`,
                                        backgroundColor: stage.color,
                                        marginLeft: `${(100 - widthPercentage) / 2}%`,
                                    }}
                                >
                                    <span className="text-white text-xs font-bold truncate">
                                        {stage.stage}
                                    </span>
                                </div>
                            </div>
                            <div className="w-12 text-right">
                                <span className="text-lg font-black text-slate-800">{stage.count}</span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
