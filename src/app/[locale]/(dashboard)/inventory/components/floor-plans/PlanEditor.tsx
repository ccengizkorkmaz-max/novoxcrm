'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, GripVertical, Save, Trash2, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { saveUnitPosition, deleteUnitPosition } from '../../floor-plan-actions'

interface Unit {
    id: string
    unit_number: string
    status: string
    type: string
}

interface Position {
    id?: string
    unit: Unit
    x: number
    y: number
}

interface PlanEditorProps {
    floorPlanId: string
    imageUrl: string
    title: string
    initialPositions: Position[]
    availableUnits: Unit[] // Units not yet placed on THIS plan
    onSave?: () => void
}

export function PlanEditor({ floorPlanId, imageUrl, title, initialPositions, availableUnits, onSave }: PlanEditorProps) {
    const [positions, setPositions] = useState<Position[]>(initialPositions)
    const [units, setUnits] = useState<Unit[]>(availableUnits)
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter available units
    const filteredUnits = units.filter(u =>
        u.unit_number.toLowerCase().includes(search.toLowerCase()) ||
        u.type.toLowerCase().includes(search.toLowerCase())
    )

    const handleDragStart = (e: React.DragEvent, unit: Unit, type: 'new' | 'existing') => {
        e.dataTransfer.setData('unit', JSON.stringify(unit))
        e.dataTransfer.setData('type', type)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100

        // Clap to 0-100
        const clampedX = Math.max(0, Math.min(100, x))
        const clampedY = Math.max(0, Math.min(100, y))

        try {
            const unit = JSON.parse(e.dataTransfer.getData('unit')) as Unit
            const type = e.dataTransfer.getData('type')

            if (type === 'new') {
                // Add new position
                setPositions(prev => [...prev, { unit, x: clampedX, y: clampedY }])
                // Remove from sidebar list
                setUnits(prev => prev.filter(u => u.id !== unit.id))
            } else {
                // Move existing position
                setPositions(prev => prev.map(p =>
                    p.unit.id === unit.id ? { ...p, x: clampedX, y: clampedY } : p
                ))
            }
        } catch (err) {
            console.error('Drop error:', err)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const removePosition = (unitId: string) => {
        const pos = positions.find(p => p.unit.id === unitId)
        if (!pos) return

        // Remove from canvas
        setPositions(prev => prev.filter(p => p.unit.id !== unitId))
        // Add back to sidebar
        setUnits(prev => [...prev, pos.unit].sort((a, b) => a.unit_number.localeCompare(b.unit_number)))
    }

    const handleSave = async () => {
        setLoading(true)
        let successCount = 0
        let failCount = 0

        // 1. Identify removed positions (in initial but not in current)
        const removedIds = initialPositions
            .filter(init => !positions.find(curr => curr.unit.id === init.unit.id))
            .map(p => p.unit.id)

        // 2. Identify new/updated positions
        const toSave = positions

        // Execute Removals
        for (const unitId of removedIds) {
            await deleteUnitPosition(floorPlanId, unitId)
        }

        // Execute Saves
        for (const pos of toSave) {
            const result = await saveUnitPosition(floorPlanId, pos.unit.id, { x: pos.x, y: pos.y })
            if (result.success) successCount++
            else failCount++
        }

        setLoading(false)
        if (failCount === 0) {
            toast.success('Kat planı başarıyla kaydedildi.')
            onSave?.()
        } else {
            toast.warning(`${successCount} kaydedildi, ${failCount} hata oluştu.`)
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
            {/* Sidebar: Available Units */}
            <Card className="w-full lg:w-64 flex flex-col h-full">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm">Müsait Üniteler</CardTitle>
                    <div className="relative">
                        <Input
                            placeholder="Ara..."
                            className="h-8 text-xs"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full px-4 py-2">
                        <div className="flex flex-col gap-2">
                            {filteredUnits.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Ünite bulunamadı.</p>
                            ) : (
                                filteredUnits.map(unit => (
                                    <div
                                        key={unit.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, unit, 'new')}
                                        className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md cursor-grab active:cursor-grabbing hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                    >
                                        <GripVertical className="h-4 w-4 text-slate-400" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-700">{unit.unit_number}</p>
                                            <p className="text-[10px] text-slate-500">{unit.type}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Canvas Area */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">{title} Düzenleniyor</h2>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {positions.length} yerleştirildi
                        </Badge>
                        <Button size="sm" onClick={handleSave} disabled={loading} className="gap-2">
                            <Save className="h-4 w-4" />
                            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </Button>
                    </div>
                </div>

                <div
                    className="flex-1 border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50 overflow-hidden relative group"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    ref={containerRef}
                >
                    {/* Background Image */}
                    <img
                        src={imageUrl}
                        className="w-full h-full object-contain pointer-events-none select-none p-4"
                        alt="Floor Plan"
                    />

                    {/* Placed Markers */}
                    {positions.map(pos => (
                        <div
                            key={pos.unit.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, pos.unit, 'existing')}
                            className="absolute w-8 h-8 -ml-4 -mt-4 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-move hover:scale-110 transition-transform group/marker z-10"
                            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                            title={`${pos.unit.unit_number} - ${pos.unit.type}`}
                        >
                            <span className="text-[10px] font-black">{pos.unit.unit_number}</span>

                            {/* Delete Button (visible on hover) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removePosition(pos.unit.id)
                                }}
                                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/marker:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    {positions.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/80 backdrop-blur px-4 py-2 rounded-lg border shadow-sm text-slate-500 text-sm">
                                Üniteleri sol taraftan sürükleyip buraya bırakın
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
