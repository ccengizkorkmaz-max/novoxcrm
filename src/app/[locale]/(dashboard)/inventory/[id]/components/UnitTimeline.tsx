'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, TrendingUp, TrendingDown, ImagePlus, ArrowRightLeft, MessageSquare, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TimelineItem {
    id: string
    type: string
    description: string
    oldValue?: string | null
    newValue?: string | null
    date: string
    user: string
    source: string
}

interface UnitTimelineProps {
    timeline: TimelineItem[]
}

const ICON_MAP: Record<string, React.ReactNode> = {
    'price_change': <DollarSign className="h-3.5 w-3.5 text-blue-500" />,
    'status_change': <ArrowRightLeft className="h-3.5 w-3.5 text-orange-500" />,
    'image_upload': <ImagePlus className="h-3.5 w-3.5 text-green-500" />,
    'negotiation': <MessageSquare className="h-3.5 w-3.5 text-purple-500" />,
    'reservation': <TrendingUp className="h-3.5 w-3.5 text-amber-500" />,
    'sale': <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
    'note': <MessageSquare className="h-3.5 w-3.5 text-slate-400" />,
}

const TYPE_LABELS: Record<string, string> = {
    'price_change': 'Fiyat Değişikliği',
    'status_change': 'Durum Değişikliği',
    'image_upload': 'Görsel',
    'negotiation': 'Pazarlık',
    'reservation': 'Rezervasyon',
    'sale': 'Satış',
    'note': 'Not',
}

export function UnitTimeline({ timeline }: UnitTimelineProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Ünite Geçmişi ({timeline.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {timeline.length > 0 ? (
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                        <div className="space-y-4">
                            {timeline.map((item) => (
                                <div key={item.id} className="relative flex gap-3 pl-2">
                                    {/* Dot on line */}
                                    <div className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-background border-2 border-border">
                                        {ICON_MAP[item.type] || <History className="h-3 w-3 text-slate-400" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pb-3">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-bold">
                                                {TYPE_LABELS[item.type] || item.type}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground">
                                                {format(new Date(item.date), 'dd MMM yyyy HH:mm', { locale: tr })}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-start gap-2">
                                                {item.type === 'price_change' && item.oldValue && item.newValue && (
                                                    <div className="mt-0.5">
                                                        {Number(item.newValue) > Number(item.oldValue) ? (
                                                            <TrendingUp className="h-3.5 w-3.5 text-rose-500" />
                                                        ) : (
                                                            <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                )}
                                                <p className="text-xs text-foreground leading-relaxed font-medium">
                                                    {item.description}
                                                </p>
                                            </div>

                                            <p className="text-[10px] text-muted-foreground">
                                                {item.user} tarafından gerçekleştirildi
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        <History className="h-6 w-6 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">Henüz kayıtlı aktivite yok</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
