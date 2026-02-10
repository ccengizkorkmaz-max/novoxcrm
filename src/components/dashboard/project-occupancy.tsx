'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface ProjectOccupancyData {
    projectName: string
    total: number
    sold: number
    reserved: number
    available: number
}

interface ProjectOccupancyProps {
    data: ProjectOccupancyData[]
}

export function ProjectOccupancy({ data }: ProjectOccupancyProps) {
    const t = useTranslations('Dashboard')

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Henüz proje verisi bulunmuyor.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {data.map((project) => {
                const occupancyRate = project.total > 0
                    ? Math.round(((project.sold + project.reserved) / project.total) * 100)
                    : 0
                const soldPercent = project.total > 0 ? (project.sold / project.total) * 100 : 0
                const reservedPercent = project.total > 0 ? (project.reserved / project.total) * 100 : 0
                const availablePercent = project.total > 0 ? (project.available / project.total) * 100 : 0

                return (
                    <div key={project.projectName} className="group">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800 truncate max-w-[180px]">
                                    {project.projectName}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {project.total} ünite
                                </span>
                            </div>
                            <span className={`text-xs font-black ${occupancyRate >= 80 ? 'text-emerald-600' : occupancyRate >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>
                                %{occupancyRate}
                            </span>
                        </div>

                        {/* Stacked Bar */}
                        <div className="h-6 w-full rounded-lg overflow-hidden bg-slate-100 flex group-hover:shadow-sm transition-all">
                            {soldPercent > 0 && (
                                <div
                                    className="h-full bg-emerald-500 flex items-center justify-center transition-all duration-500 relative"
                                    style={{ width: `${soldPercent}%` }}
                                    title={`Satılan: ${project.sold}`}
                                >
                                    {soldPercent > 12 && (
                                        <span className="text-[9px] font-black text-white">{project.sold}</span>
                                    )}
                                </div>
                            )}
                            {reservedPercent > 0 && (
                                <div
                                    className="h-full bg-amber-400 flex items-center justify-center transition-all duration-500"
                                    style={{ width: `${reservedPercent}%` }}
                                    title={`Rezerve: ${project.reserved}`}
                                >
                                    {reservedPercent > 12 && (
                                        <span className="text-[9px] font-black text-white">{project.reserved}</span>
                                    )}
                                </div>
                            )}
                            {availablePercent > 0 && (
                                <div
                                    className="h-full bg-slate-200 flex items-center justify-center transition-all duration-500"
                                    style={{ width: `${availablePercent}%` }}
                                    title={`Satışta: ${project.available}`}
                                >
                                    {availablePercent > 12 && (
                                        <span className="text-[9px] font-black text-slate-500">{project.available}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Satılan</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Rezerve</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Satışta</span>
                </div>
            </div>
        </div>
    )
}
