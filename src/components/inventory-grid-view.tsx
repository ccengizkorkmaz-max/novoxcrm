'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, Building2, Thermometer } from 'lucide-react'

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

type ColorMode = 'status' | 'heatmap'

interface InventoryGridViewProps {
    units: Unit[]
    onUnitClick?: (unit: Unit) => void
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
    'For Sale': { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-white', label: 'Satışta' },
    'Sold': { bg: 'bg-red-500', border: 'border-red-400', text: 'text-white', label: 'Satıldı' },
    'Reserved': { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-white', label: 'Rezerve' },
    'Reservation': { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-white', label: 'Rezerve' },
    'Blocked': { bg: 'bg-slate-600', border: 'border-slate-500', text: 'text-white', label: 'Bloke' },
    'Option': { bg: 'bg-violet-500', border: 'border-violet-400', text: 'text-white', label: 'Opsiyon' },
    'Rented': { bg: 'bg-cyan-500', border: 'border-cyan-400', text: 'text-white', label: 'Kirada' },
    'Delivered': { bg: 'bg-green-800', border: 'border-green-700', text: 'text-white', label: 'Teslim Edildi' },
}

const getStatusStyle = (status: string) => {
    return STATUS_COLORS[status] || { bg: 'bg-slate-300', border: 'border-slate-200', text: 'text-white', label: status }
}

export function InventoryGridView({ units, onUnitClick }: InventoryGridViewProps) {
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
    const [selectedBlock, setSelectedBlock] = useState<string>('all')
    const [selectedProject, setSelectedProject] = useState<string>('all')
    const [colorMode, setColorMode] = useState<ColorMode>('status')

    // Calculate m² price range for heat map coloring
    const pricePerM2Stats = useMemo(() => {
        const relevantUnits = units.filter(u => u.area_gross && u.area_gross > 0 && u.price > 0)
        if (relevantUnits.length === 0) return { min: 0, max: 1, avg: 0 }
        const prices = relevantUnits.map(u => u.price / (u.area_gross || 1))
        const min = Math.min(...prices)
        const max = Math.max(...prices)
        const avg = prices.reduce((s, v) => s + v, 0) / prices.length
        return { min, max, avg }
    }, [units])

    // Get heat map color based on m² price
    const getHeatMapStyle = (unit: Unit) => {
        if (!unit.area_gross || unit.area_gross === 0 || unit.price === 0) {
            return { bg: 'bg-slate-200', border: 'border-slate-300', text: 'text-slate-600', label: 'N/A' }
        }
        const pricePerM2 = unit.price / unit.area_gross
        const range = pricePerM2Stats.max - pricePerM2Stats.min
        const ratio = range > 0 ? (pricePerM2 - pricePerM2Stats.min) / range : 0.5

        // Green (cheap) → Yellow → Orange → Red (expensive)
        if (ratio <= 0.25) return { bg: 'bg-emerald-500', border: 'border-emerald-400', text: 'text-white', label: `₺${Math.round(pricePerM2).toLocaleString('tr-TR')}/m²` }
        if (ratio <= 0.50) return { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-white', label: `₺${Math.round(pricePerM2).toLocaleString('tr-TR')}/m²` }
        if (ratio <= 0.75) return { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-white', label: `₺${Math.round(pricePerM2).toLocaleString('tr-TR')}/m²` }
        return { bg: 'bg-red-500', border: 'border-red-400', text: 'text-white', label: `₺${Math.round(pricePerM2).toLocaleString('tr-TR')}/m²` }
    }

    const getUnitStyle = (unit: Unit) => {
        if (colorMode === 'heatmap') return getHeatMapStyle(unit)
        return getStatusStyle(unit.status)
    }

    // Group units by project, then by block, then by floor
    const gridData = useMemo(() => {
        let filtered = units

        if (selectedProject !== 'all') {
            filtered = filtered.filter(u => u.projects?.name === selectedProject)
        }

        if (selectedBlock !== 'all') {
            filtered = filtered.filter(u => (u.block || 'Blok') === selectedBlock)
        }

        const projectMap: Record<string, Record<string, Record<number, Unit[]>>> = {}

        filtered.forEach(unit => {
            const project = unit.projects?.name || 'Projesiz'
            const block = unit.block || 'Blok'
            const floor = unit.floor ?? 0

            if (!projectMap[project]) projectMap[project] = {}
            if (!projectMap[project][block]) projectMap[project][block] = {}
            if (!projectMap[project][block][floor]) projectMap[project][block][floor] = []
            projectMap[project][block][floor].push(unit)
        })

        // Sort units within each floor by unit_number
        Object.values(projectMap).forEach(blocks => {
            Object.values(blocks).forEach(floors => {
                Object.values(floors).forEach(floorUnits => {
                    floorUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))
                })
            })
        })

        return projectMap
    }, [units, selectedBlock, selectedProject])

    // Get unique projects
    const allProjects = useMemo(() => {
        const projectSet = new Set<string>()
        units.forEach(u => projectSet.add(u.projects?.name || 'Projesiz'))
        return Array.from(projectSet).sort()
    }, [units])

    // Get unique blocks (filtered by project if selected)
    const blocks = useMemo(() => {
        const blockSet = new Set<string>()
        const relevantUnits = selectedProject === 'all'
            ? units
            : units.filter(u => u.projects?.name === selectedProject)

        relevantUnits.forEach(u => blockSet.add(u.block || 'Blok'))
        return Array.from(blockSet).sort()
    }, [units, selectedProject])

    // Reset block filter when project changes
    const handleProjectChange = (project: string) => {
        setSelectedProject(project)
        setSelectedBlock('all')
    }

    // Stats
    const stats = useMemo(() => {
        const currentUnits = selectedProject === 'all'
            ? units
            : units.filter(u => u.projects?.name === selectedProject)

        const total = currentUnits.length
        const forSale = currentUnits.filter(u => u.status === 'For Sale').length
        const sold = currentUnits.filter(u => u.status === 'Sold' || u.status === 'Delivered').length
        const reserved = currentUnits.filter(u => u.status === 'Reserved' || u.status === 'Reservation').length
        const blocked = currentUnits.filter(u => u.status === 'Blocked').length
        const option = currentUnits.filter(u => u.status === 'Option').length
        const rented = currentUnits.filter(u => u.status === 'Rented').length
        return { total, forSale, sold, reserved, blocked, option, rented }
    }, [units, selectedProject])

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

    const formatM2Price = (price: number, area: number | null) => {
        if (!area || area === 0) return '-'
        return `₺${Math.round(price / area).toLocaleString('tr-TR')}`
    }

    return (
        <div className="space-y-6">
            {/* Legend & Filters */}
            <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Filters Group */}
                    <div className="flex flex-col gap-3">
                        {/* Project Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[50px]">Proje:</span>
                            <Button
                                variant={selectedProject === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs px-3 rounded-full font-bold"
                                onClick={() => handleProjectChange('all')}
                            >
                                Tümü
                            </Button>
                            {allProjects.map(project => (
                                <Button
                                    key={project}
                                    variant={selectedProject === project ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-3 rounded-full font-bold"
                                    onClick={() => handleProjectChange(project)}
                                >
                                    {project}
                                </Button>
                            ))}
                        </div>

                        {/* Block Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[50px]">Blok:</span>
                            <Button
                                variant={selectedBlock === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs px-3 rounded-full font-bold"
                                onClick={() => setSelectedBlock('all')}
                            >
                                Tümü
                            </Button>
                            {blocks.map(block => (
                                <Button
                                    key={block}
                                    variant={selectedBlock === block ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-7 text-xs px-3 rounded-full font-bold"
                                    onClick={() => setSelectedBlock(block)}
                                >
                                    {block}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 items-end">
                        {/* Color Mode Toggle */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant={colorMode === 'status' ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-[10px] px-3 rounded-full font-bold gap-1.5"
                                onClick={() => setColorMode('status')}
                            >
                                <Building2 className="h-3 w-3" />
                                Durum
                            </Button>
                            <Button
                                variant={colorMode === 'heatmap' ? 'default' : 'outline'}
                                size="sm"
                                className={`h-7 text-[10px] px-3 rounded-full font-bold gap-1.5 ${colorMode === 'heatmap' ? 'bg-gradient-to-r from-emerald-600 via-yellow-500 to-red-500 border-none hover:opacity-90' : ''}`}
                                onClick={() => setColorMode('heatmap')}
                            >
                                <Thermometer className="h-3 w-3" />
                                m² Fiyat
                            </Button>
                        </div>

                        {/* Legend - Changes based on color mode */}
                        {colorMode === 'status' ? (
                            <div className="flex items-center gap-4 flex-wrap bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Satışta <span className="text-slate-400 font-medium">({stats.forSale})</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Satıldı <span className="text-slate-400 font-medium">({stats.sold})</span></span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                    <span className="text-[10px] font-bold text-slate-600">Rezerve <span className="text-slate-400 font-medium">({stats.reserved})</span></span>
                                </div>
                                {stats.blocked > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                                        <span className="text-[10px] font-bold text-slate-600">Bloke <span className="text-slate-400 font-medium">({stats.blocked})</span></span>
                                    </div>
                                )}
                                {stats.option > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                                        <span className="text-[10px] font-bold text-slate-600">Opsiyon <span className="text-slate-400 font-medium">({stats.option})</span></span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">m² Fiyat:</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Düşük</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Orta</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Yüksek</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    <span className="text-[10px] font-bold text-slate-600">Premium</span>
                                </div>
                                <div className="h-4 w-px bg-slate-200" />
                                <span className="text-[9px] text-slate-400 font-medium">
                                    ₺{Math.round(pricePerM2Stats.min).toLocaleString('tr-TR')} — ₺{Math.round(pricePerM2Stats.max).toLocaleString('tr-TR')}/m²
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grid Grouped by Project */}
            <div className="space-y-10">
                {Object.entries(gridData)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([projectName, blocks]) => (
                        <div key={projectName} className="space-y-4">
                            {/* Project Section Heading */}
                            <div className="flex items-center gap-3 border-l-4 border-blue-600 pl-4 py-1">
                                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                                    {projectName}
                                </h1>
                                <Badge variant="outline" className="text-[10px] font-bold text-blue-600 border-blue-200">
                                    {Object.keys(blocks).length} Blok
                                </Badge>
                            </div>

                            <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
                                {Object.entries(blocks)
                                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                                    .map(([blockName, floors]) => {
                                        const sortedFloors = Object.entries(floors)
                                            .sort(([a], [b]) => Number(b) - Number(a)) // Top floor first

                                        const blockUnits = Object.values(floors).flat()
                                        const blockSold = blockUnits.filter(u => u.status === 'Sold').length
                                        const blockTotal = blockUnits.length
                                        const occupancyRate = blockTotal > 0 ? Math.round((blockSold / blockTotal) * 100) : 0

                                        return (
                                            <Card key={blockName} className="border-none shadow-md overflow-hidden bg-white hover:shadow-lg transition-shadow duration-300">
                                                {/* Block Header */}
                                                <CardHeader className="pb-2 bg-slate-800 text-white py-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <CardTitle className="text-xs font-black tracking-widest opacity-80 uppercase">{projectName}</CardTitle>
                                                            <div className="w-1 h-1 rounded-full bg-slate-500" />
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

                                                <CardContent className="p-4">
                                                    <div className="space-y-2">
                                                        {sortedFloors.map(([floorNum, floorUnits]) => (
                                                            <div key={floorNum} className="flex items-stretch gap-3 group/floor">
                                                                {/* Floor Label */}
                                                                <div className="w-10 flex-shrink-0 flex items-center justify-center bg-slate-50 rounded group-hover/floor:bg-slate-100 transition-colors">
                                                                    <span className="text-[10px] font-black text-slate-400">
                                                                        {Number(floorNum) === 0 ? 'Z' : `K${floorNum}`}
                                                                    </span>
                                                                </div>

                                                                {/* Unit Cells - Dynamic width with flex-grow and max-width */}
                                                                <div className="flex-1 flex flex-wrap gap-1.5 pb-1">
                                                                    {floorUnits.map(unit => {
                                                                        const style = getUnitStyle(unit)
                                                                        return (
                                                                            <button
                                                                                key={unit.id}
                                                                                className={`
                                                                                    flex-1 min-w-[48px] max-w-[90px] ${style.bg} ${style.text}
                                                                                    rounded-md px-1 py-1.5 text-center
                                                                                    transition-all duration-200
                                                                                    hover:scale-105 hover:shadow-lg hover:z-10
                                                                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                                                                    cursor-pointer relative group
                                                                                `}
                                                                                onClick={() => handleUnitClick(unit)}
                                                                            >
                                                                                <div className="text-[10px] font-black leading-tight truncate">
                                                                                    {unit.unit_number}
                                                                                </div>
                                                                                <div className="text-[8px] opacity-80 leading-tight truncate font-bold">
                                                                                    {colorMode === 'heatmap' && unit.area_gross
                                                                                        ? formatM2Price(unit.price, unit.area_gross)
                                                                                        : unit.type
                                                                                    }
                                                                                </div>

                                                                                {/* Hover tooltip */}
                                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                                                                                    <div className="bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-2xl whitespace-nowrap border border-slate-700">
                                                                                        <div className="font-black text-blue-400">{unit.projects?.name}</div>
                                                                                        <div className="font-bold">{unit.block} • {unit.unit_number} • {unit.type}</div>
                                                                                        <div className="text-emerald-400 font-black mt-1">{formatPrice(unit.price, unit.currency)}</div>
                                                                                        {unit.area_gross && (
                                                                                            <div className="text-slate-400">
                                                                                                {unit.area_gross} m² • <span className="text-yellow-400 font-bold">{formatM2Price(unit.price, unit.area_gross)}/m²</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <div className="text-slate-500 text-[9px] mt-0.5">{getStatusStyle(unit.status).label}</div>
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
                        </div>
                    ))}
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
                            <div className="flex gap-2 pt-2">
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm font-bold" asChild>
                                    <a href={`/tr/inventory/${selectedUnit.id}`}>Detaya Git</a>
                                </Button>
                            </div>
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
