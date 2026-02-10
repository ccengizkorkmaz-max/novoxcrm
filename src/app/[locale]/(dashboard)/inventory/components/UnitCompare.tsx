'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Scale, Check, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Unit {
    id: string
    unit_number: string
    block: string
    type: string
    price: number
    currency: string
    area_gross: number | null
    area_net: number | null
    floor: number | null
    direction: string | null
    view: string | null
    status: string
    projects?: { name: string }
    parking_type?: string
    heating_type?: string
    kitchen_type?: string
    has_builtin_kitchen?: boolean
    has_master_bathroom?: boolean
}

interface UnitCompareProps {
    units: Unit[]
    onClose: () => void
}

const COMPARE_FIELDS: { key: string; label: string; format?: (val: any) => string }[] = [
    { key: 'projects.name', label: 'Proje' },
    { key: 'block', label: 'Blok' },
    { key: 'type', label: 'Tip' },
    { key: 'floor', label: 'Kat' },
    { key: 'direction', label: 'Yön' },
    { key: 'view', label: 'Manzara' },
    { key: 'area_gross', label: 'Brüt Alan', format: (v: any) => v ? `${v} m²` : '-' },
    { key: 'area_net', label: 'Net Alan', format: (v: any) => v ? `${v} m²` : '-' },
    { key: 'price', label: 'Fiyat', format: (v: any) => formatCurrency(v, 'TRY') },
    { key: 'pricePerM2', label: 'm² Fiyat', format: (v: any) => v ? formatCurrency(v, 'TRY') : '-' },
    { key: 'parking_type', label: 'Otopark' },
    { key: 'heating_type', label: 'Isıtma' },
    { key: 'kitchen_type', label: 'Mutfak' },
    { key: 'has_builtin_kitchen', label: 'Ankastre', format: (v: any) => v ? '✅' : '—' },
    { key: 'has_master_bathroom', label: 'Ebeveyn Banyosu', format: (v: any) => v ? '✅' : '—' },
]

function getValue(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

export function UnitCompare({ units, onClose }: UnitCompareProps) {
    // Add computed fields
    const enrichedUnits = units.map(u => ({
        ...u,
        pricePerM2: u.area_gross ? Math.round(u.price / u.area_gross) : null,
    }))

    // Find best values for highlighting
    const getBest = (key: string) => {
        const values = enrichedUnits.map(u => getValue(u, key)).filter(v => v !== null && v !== undefined)
        if (key === 'price') return Math.min(...values.filter((v: any) => typeof v === 'number')) // Lowest is best
        if (key === 'pricePerM2') return Math.min(...values.filter((v: any) => typeof v === 'number'))
        if (key.includes('area')) return Math.max(...values.filter((v: any) => typeof v === 'number')) // Largest is best
        return null
    }

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
            <Card className="max-w-4xl w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-t-xl">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Ünite Karşılaştırma ({units.length} ünite)
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/10 h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="text-left px-4 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-36">
                                        Özellik
                                    </th>
                                    {enrichedUnits.map((unit) => (
                                        <th key={unit.id} className="text-center px-4 py-2">
                                            <div className="text-sm font-bold">{unit.unit_number}</div>
                                            <Badge variant="outline" className="text-[9px] mt-0.5">
                                                {unit.status === 'For Sale' ? 'Satışta' : unit.status}
                                            </Badge>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {COMPARE_FIELDS.map((field) => {
                                    const bestValue = getBest(field.key)
                                    return (
                                        <tr key={field.key} className="hover:bg-muted/20">
                                            <td className="px-4 py-2 text-xs font-semibold text-muted-foreground">
                                                {field.label}
                                            </td>
                                            {enrichedUnits.map((unit) => {
                                                const val = getValue(unit, field.key)
                                                const formatted = field.format ? field.format(val) : (val || '-')
                                                const isBest = bestValue !== null && typeof val === 'number' && val === bestValue
                                                return (
                                                    <td
                                                        key={unit.id}
                                                        className={`px-4 py-2 text-xs text-center font-medium ${isBest ? 'text-emerald-700 bg-emerald-50/50 font-bold' : ''}`}
                                                    >
                                                        {formatted}
                                                        {isBest && <Check className="inline h-3 w-3 ml-1 text-emerald-500" />}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
