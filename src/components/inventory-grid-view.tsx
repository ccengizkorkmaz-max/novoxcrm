'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Building2, Maximize2, ArrowUpDown } from 'lucide-react'

interface Unit {
    id: string
    unit_number: string
    block: string | null
    floor: number | null
    status: string
    type: string
    price: number
    currency: string
    area_gross: number | null
    area_net: number | null
    direction: string | null
    view: string | null
    project_id: string
    projects?: { name: string }
}

interface InventoryGridViewProps {
    units: Unit[]
    onUnitClick?: (unit: Unit) => void
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
    'For Sale': { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-white', label: 'Satışta' },
    'Sold': { bg: 'bg-red-500', border: 'border-red-400', text: 'text-white', label: 'Satıldı' },
    'Reserved': { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-white', label: 'Rezerve' },
    'Reservation': { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-white', label: 'Rezerve' },
}

const getStatusStyle = (status: string) => {
    return STATUS_COLORS[status] || { bg: 'bg-slate-300', border: 'border-slate-200', text: 'text-white', label: status }
}

export function InventoryGridView({ units, onUnitClick }: InventoryGridViewProps) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
    const [selectedBlock, setSelectedBlock] = useState<string>('all')

    // Group units by block, then by floor
    const gridData = useMemo(() => {
        const filtered = selectedBlock === 'all'
            ? units
            : units.filter(u => (u.block || 'Blok') === selectedBlock)

        const blockMap: Record<string, Record<number, Unit[]>> = {}

        filtered.forEach(unit => {
            const block = unit.block || 'Blok'
            const floor = unit.floor ?? 0

            if (!blockMap[block]) blockMap[block] = {}
            if (!blockMap[block][floor]) blockMap[block][floor] = []
            blockMap[block][floor].push(unit)
        })

        // Sort units within each floor by unit_number
        Object.values(blockMap).forEach(floors => {
            Object.values(floors).forEach(floorUnits => {
                floorUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
            })
        })

        return blockMap
    }, [units, selectedBlock])

    // Get unique blocks
    const blocks = useMemo(() => {
        const blockSet = new Set<string>()
        units.forEach(u => blockSet.add(u.block || 'Blok'))
        return Array.from(blockSet).sort()
    }, [units])

    // Get max units per floor for consistent column widths
    const maxUnitsPerFloor = useMemo(() => {
        let max = 0
        Object.values(gridData).forEach(floors => {
            Object.values(floors).forEach(floorUnits => {
                if (floorUnits.length > max) max = floorUnits.length
            })
        })
        return max
    }, [gridData])

    // Stats
    const stats = useMemo(() => {
        const total = units.length
        const forSale = units.filter(u => u.status === 'For Sale').length
        const sold = units.filter(u => u.status === 'Sold').length
        const reserved = units.filter(u => u.status === 'Reserved' || u.status === 'Reservation').length
        return { total, forSale, sold, reserved }
    }, [units])

    const handleUnitClick = (unit: Unit) => {
        setSelectedUnit(unit)
        onUnitClick?.(unit)
    }

    const formatPrice = (price: number, currency: string = 'TRY') => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0
        }).format(price)
    }

    return (
        <div className="space-y-4">
            {/* Legend & Block Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Block Filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Blok:</span>
                    <Button
                        variant={selectedBlock === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs px-2.5"
                        onClick={() => setSelectedBlock('all')}
                    >
                        Tümü
                    </Button>
                    {blocks.map(block => (
                        <Button
                            key={block}
                            variant={selectedBlock === block ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 text-xs px-2.5"
                            onClick={() => setSelectedBlock(block)}
                        >
                            {block}
                        </Button>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500">Satışta ({stats.forSale})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-red-500" />
                        <span className="text-[10px] font-bold text-slate-500">Satıldı ({stats.sold})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-amber-400" />
                        <span className="text-[10px] font-bold text-slate-500">Rezerve ({stats.reserved})</span>
                    </div>
                </div>
            </div>

            {/* Grid Blocks */}
            <div className="grid gap-6 xl:grid-cols-2">
                {Object.entries(gridData)
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                    .map(([blockName, floors]) => {
                        const sortedFloors = Object.entries(floors)
                            .sort(([a], [b]) => Number(b) - Number(a)) // Top floor first

                        const blockUnits = Object.values(floors).flat()
                        const blockSold = blockUnits.filter(u => u.status === 'Sold').length
                        const blockTotal = blockUnits.length
                        const occupancyRate = blockTotal > 0 ? Math.round((blockSold / blockTotal) * 100) : 0

                        return (
                            <Card key={blockName} className="border-none shadow-sm overflow-hidden">
                                {/* Block Header */}
                                <CardHeader className="pb-2 bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-slate-300" />
                                            <CardTitle className="text-sm font-black tracking-wider">{blockName}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-300 font-medium">
                                                {blockSold}/{blockTotal} satıldı
                                            </span>
                                            <Badge className={`text-[9px] px-1.5 border-none ${occupancyRate >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                                                    occupancyRate >= 50 ? 'bg-amber-500/20 text-amber-300' :
                                                        'bg-slate-500/20 text-slate-300'
                                                }`}>
                                                %{occupancyRate}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-2">
                                    <div className="space-y-0.5">
                                        {sortedFloors.map(([floorNum, floorUnits]) => (
                                            <div key={floorNum} className="flex items-stretch gap-1">
                                                {/* Floor Label */}
                                                <div className="w-10 flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-[10px] font-black text-slate-400">
                                                        {Number(floorNum) === 0 ? 'Z' : `K${floorNum}`}
                                                    </span>
                                                </div>

                                                {/* Unit Cells */}
                                                <div className="flex-1 flex gap-0.5">
                                                    {floorUnits.map(unit => {
                                                        const style = getStatusStyle(unit.status)
                                                        return (
                                                            <button
                                                                key={unit.id}
                                                                className={`
                                                                    flex-1 min-w-0 ${style.bg} ${style.text}
                                                                    rounded-md px-1 py-2 text-center
                                                                    transition-all duration-200
                                                                    hover:scale-105 hover:shadow-lg hover:z-10
                                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                                                    cursor-pointer relative group
                                                                `}
                                                                onClick={() => handleUnitClick(unit)}
                                                                title={`${unit.unit_number} - ${unit.type} - ${formatPrice(unit.price, unit.currency)}`}
                                                            >
                                                                <div className="text-[10px] font-black leading-tight truncate">
                                                                    {unit.unit_number}
                                                                </div>
                                                                <div className="text-[8px] opacity-80 leading-tight truncate">
                                                                    {unit.type}
                                                                </div>

                                                                {/* Hover tooltip */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 pointer-events-none">
                                                                    <div className="bg-slate-900 text-white text-[9px] px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                                                                        <div className="font-bold">{unit.unit_number} • {unit.type}</div>
                                                                        <div>{formatPrice(unit.price, unit.currency)}</div>
                                                                        {unit.area_gross && <div>{unit.area_gross} m²</div>}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
            </div>

            {/* Unit Detail Panel */}
            {selectedUnit && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUnit(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Detail Header */}
                        <div className={`${getStatusStyle(selectedUnit.status).bg} px-6 py-4 flex items-center justify-between`}>
                            <div>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-wider">
                                    {selectedUnit.projects?.name} • {selectedUnit.block}
                                </p>
                                <h3 className="text-white text-2xl font-black">{selectedUnit.unit_number}</h3>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUnit(null)} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Detail Body */}
                        <div className="p-6 space-y-4">
                            {/* Price */}
                            <div className="text-center py-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fiyat</p>
                                <p className="text-2xl font-black text-slate-900">{formatPrice(selectedUnit.price, selectedUnit.currency)}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <DetailItem label="Durum" value={getStatusStyle(selectedUnit.status).label} />
                                <DetailItem label="Tip" value={selectedUnit.type} />
                                <DetailItem label="Kat" value={selectedUnit.floor?.toString() || '-'} />
                                <DetailItem label="Brüt Alan" value={selectedUnit.area_gross ? `${selectedUnit.area_gross} m²` : '-'} />
                                <DetailItem label="Net Alan" value={selectedUnit.area_net ? `${selectedUnit.area_net} m²` : '-'} />
                                <DetailItem label="Yön" value={selectedUnit.direction || '-'} />
                                <DetailItem label="Manzara" value={selectedUnit.view || '-'} />
                                <DetailItem label="Blok" value={selectedUnit.block || '-'} />
                            </div>

                            {/* Action buttons */}
                            {selectedUnit.status === 'For Sale' && (
                                <div className="flex gap-2 pt-2">
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm font-bold" asChild>
                                        <a href={`/tr/inventory/${selectedUnit.id}`}>Detaya Git</a>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-slate-50/80 rounded-lg px-3 py-2">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
        </div>
    )
}
