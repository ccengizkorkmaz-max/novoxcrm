'use client'

import { useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn, formatCurrency } from '@/lib/utils'
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Position {
    id: string
    x: number
    y: number
    unit: {
        id: string
        unit_number: string
        status: string
        price: number
        currency: string
        area_gross: number | null
        area_net: number | null
        type: string
    }
}

interface PlanViewerProps {
    imageUrl: string
    title: string
    positions: Position[]
    onUnitClick?: (unitId: string) => void
}

const STATUS_COLORS: Record<string, string> = {
    'For Sale': 'bg-emerald-500 border-emerald-600',
    'Sold': 'bg-red-500 border-red-600',
    'Reserved': 'bg-amber-500 border-amber-600',
    'Blocked': 'bg-slate-600 border-slate-700',
    'Option': 'bg-violet-500 border-violet-600',
    'Rented': 'bg-cyan-500 border-cyan-600',
    'Delivered': 'bg-green-700 border-green-800'
}

export function PlanViewer({ imageUrl, title, positions, onUnitClick }: PlanViewerProps) {
    const [scale, setScale] = useState(1)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))
    const handleReset = () => setScale(1)

    return (
        <div className="relative border rounded-xl overflow-hidden bg-slate-100/50 group h-full min-h-[500px]">
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-1 bg-white/90 backdrop-blur shadow-sm p-1 rounded-lg border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}><Maximize2 className="h-4 w-4" /></Button>
            </div>

            {/* Title Overlay */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                <p className="text-[10px] text-slate-500">{positions.length} ünite işaretli</p>
            </div>

            {/* Canvas Area */}
            <div
                className="w-full h-full overflow-auto flex items-center justify-center p-8 cursor-grab active:cursor-grabbing"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                <div
                    ref={containerRef}
                    className="relative transition-transform duration-200 ease-out origin-center shadow-2xl rounded-lg"
                    style={{ transform: `scale(${scale})` }}
                >
                    <img
                        src={imageUrl}
                        alt={title}
                        className="max-w-none rounded-lg select-none pointer-events-none"
                        draggable={false}
                    />

                    {/* Unit Markers */}
                    {positions.map((pos) => (
                        <div
                            key={pos.id}
                            className="absolute group/marker"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`
                            }}
                        >
                            <button
                                onClick={() => onUnitClick?.(pos.unit.id)}
                                className={cn(
                                    "absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 shadow-lg flex items-center justify-center text-[8px] font-black text-white hover:scale-125 transition-transform z-10",
                                    STATUS_COLORS[pos.unit.status] || 'bg-slate-400 border-slate-500'
                                )}
                            >
                                {scale > 1.2 ? <span className="text-[6px]">{pos.unit.unit_number}</span> : ''}
                            </button>

                            {/* Hover Tooltip - High Quality Mini Card */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max min-w-[180px] bg-white border border-slate-200 text-slate-900 p-0 rounded-xl shadow-2xl opacity-0 scale-90 group-hover/marker:opacity-100 group-hover/marker:scale-100 transition-all pointer-events-none z-20 origin-bottom ring-4 ring-black/5">
                                <div className="flex flex-col">
                                    {/* Header */}
                                    <div className={cn(
                                        "px-3 py-2 rounded-t-xl flex items-center justify-between gap-4 border-b",
                                        pos.unit.status === 'Sold' ? 'bg-red-50 border-red-100' :
                                            pos.unit.status === 'Reserved' ? 'bg-amber-50 border-amber-100' :
                                                'bg-slate-50 border-slate-100'
                                    )}>
                                        <span className="font-black text-xs tracking-tight">Ünite {pos.unit.unit_number}</span>
                                        <Badge className={cn(
                                            "text-[9px] h-4 px-1 border-none font-bold",
                                            STATUS_COLORS[pos.unit.status] || 'bg-slate-400'
                                        )}>
                                            {pos.unit.status}
                                        </Badge>
                                    </div>

                                    {/* Body */}
                                    <div className="p-3 space-y-2">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ünite Tipi</div>
                                            <div className="text-xs font-bold text-slate-700">{pos.unit.type || 'Belirtilmedi'}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pb-1">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Alan</div>
                                                <div className="text-xs font-bold text-slate-700">{pos.unit.area_net || '-'} m²</div>
                                            </div>
                                            <div className="flex flex-col gap-0.5 border-l pl-3">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brüt Alan</div>
                                                <div className="text-xs font-bold text-slate-700">{pos.unit.area_gross || '-'} m²</div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fiyat</span>
                                            <span className="text-sm font-black text-blue-600">
                                                {pos.unit.price ? formatCurrency(pos.unit.price, pos.unit.currency) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {/* Arrow */}
                                <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45 border-r border-b border-slate-200"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
