'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Search,
    Building2,
    CheckCircle2,
    Home,
    FilterX
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Props {
    projects: any[]
    initialUnits: any[]
    onSelect: (unit: any) => void
    selectedUnit: any
}

export function QuickInventory({ projects, initialUnits, onSelect, selectedUnit }: Props) {
    const t = useTranslations('QuickCRM')
    const ti = useTranslations('Inventory')
    const [search, setSearch] = useState('')
    const [projectFilter, setProjectFilter] = useState<string>('all')

    const filteredUnits = initialUnits.filter(u => {
        const matchesSearch = u.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
            u.block?.toLowerCase().includes(search.toLowerCase())
        const matchesProject = projectFilter === 'all' || u.projects?.id === projectFilter
        return matchesSearch && matchesProject
    })

    return (
        <Card className="h-full flex flex-col overflow-hidden">
            <CardHeader className="py-3 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Home className="h-4 w-4" /> {t('selectUnitTitle')}
                    </CardTitle>
                    {selectedUnit && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 px-2">
                            <CheckCircle2 className="h-3 w-3" /> {t('unitSelected')}
                        </Badge>
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={ti('filters.search')}
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder={ti('filters.project')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{ti('filters.allProjects')}</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {(search || projectFilter !== 'all') && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => { setSearch(''); setProjectFilter('all') }}
                        >
                            <FilterX className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
                        {filteredUnits.map(unit => {
                            const isSelected = selectedUnit?.id === unit.id
                            return (
                                <button
                                    key={unit.id}
                                    onClick={() => onSelect(unit)}
                                    className={`
                                        text-left p-4 rounded-xl border transition-all duration-200 group relative
                                        ${isSelected
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                                            : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold">
                                                    {unit.block || '-'}
                                                </Badge>
                                                <span className="text-xl font-black tracking-tight">{unit.unit_number}</span>
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase">{unit.projects?.name}</div>
                                        </div>
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {unit.type}
                                        </Badge>
                                    </div>

                                    <div className="flex justify-between items-end mt-4">
                                        <div className="text-lg font-bold text-primary">
                                            {formatCurrency(unit.price, unit.currency)}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground flex flex-col items-end">
                                            <span>{unit.floor}. Kat</span>
                                            <span>{unit.area_gross} m² Brüt</span>
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1 shadow-lg border-2 border-white">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                        {filteredUnits.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                {ti('table.empty')}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
