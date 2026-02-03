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
                <ScrollArea className="flex-1 px-2">
                    <div className="flex flex-col gap-2 py-2">
                        {projectFilter !== 'all' && (
                            <div className="col-span-full">
                                <button
                                    onClick={() => {
                                        const project = projects.find(p => p.id === projectFilter)
                                        if (project) {
                                            onSelect({
                                                id: `project_${project.id}`,
                                                project_id: project.id,
                                                type: 'project',
                                                projects: project,
                                                unit_number: project.name
                                            })
                                        }
                                    }}
                                    className={`
                                        w-full text-left p-4 rounded-lg border transition-all duration-200 group relative flex items-center justify-between
                                        ${selectedUnit?.type === 'project' && selectedUnit?.project_id === projectFilter
                                            ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                                            : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">
                                                {projects.find(p => p.id === projectFilter)?.name} {t('projectSelected')}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">Müşteri doğrudan bu proje ile ilgileniyor (Ünite değil)</p>
                                        </div>
                                    </div>
                                    {selectedUnit?.type === 'project' && selectedUnit?.project_id === projectFilter && (
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                    )}
                                </button>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-bold">
                                        <span className="bg-white px-2 text-muted-foreground">veya Ünite Seçiniz</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                            {filteredUnits.map(unit => {
                                const isSelected = selectedUnit?.id === unit.id
                                return (
                                    <button
                                        key={unit.id}
                                        onClick={() => onSelect(unit)}
                                        className={`
                                            text-left p-2.5 rounded-lg border transition-all duration-200 group relative flex flex-col justify-between h-[110px]
                                            ${isSelected
                                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                                                : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0 text-[10px] h-5">
                                                        {unit.block || '-'}
                                                    </Badge>
                                                    <span className="text-base font-black tracking-tight truncate">{unit.unit_number}</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-muted-foreground uppercase truncate pr-2">{unit.projects?.name}</div>
                                            </div>
                                            <Badge variant="outline" className="font-mono text-[9px] px-1 h-4 shrink-0">
                                                {unit.type}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-end mt-1 w-full">
                                            <div className="text-sm font-bold text-primary truncate">
                                                {formatCurrency(unit.price, unit.currency)}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground flex flex-col items-end shrink-0 leading-tight">
                                                <span>{unit.floor}. Kat</span>
                                                <span>{unit.area_gross} m²</span>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-primary text-white rounded-full p-0.5 shadow-lg border-2 border-white">
                                                <CheckCircle2 className="h-3 w-3" />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        {filteredUnits.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                {ti('table.empty')}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
