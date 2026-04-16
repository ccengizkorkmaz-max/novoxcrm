'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Filter, X, Search, Calendar, User, Users, ChevronDown, ChevronUp, RotateCcw, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslations } from 'next-intl'

interface CRMFilterSheetProps {
    projects: any[]
    profiles: any[]
    customers: any[]
}

export default function CRMFilterSheet({ projects, profiles, customers }: CRMFilterSheetProps) {
    const t = useTranslations('CRM.filter')
    const router = useRouter()
    const searchParams = useSearchParams()

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [project, setProject] = useState(searchParams.get('p') || 'all')
    const [selectedReps, setSelectedReps] = useState<string[]>(() => {
        const r = searchParams.get('r')
        return r ? r.split(',').filter(Boolean) : []
    })
    const [status, setStatus] = useState(searchParams.get('s') || 'all')
    const [customer, setCustomer] = useState(searchParams.get('c') || 'all')
    const [dateFrom, setDateFrom] = useState(searchParams.get('df') || '')
    const [dateTo, setDateTo] = useState(searchParams.get('dt') || '')
    const [repSearch, setRepSearch] = useState('')
    const [repSectionOpen, setRepSectionOpen] = useState(false)

    const hasFilters = search || project !== 'all' || selectedReps.length > 0 || status !== 'all'
        || customer !== 'all' || dateFrom || dateTo

    // Count active filters for badge
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (search) count++
        if (project !== 'all') count++
        if (selectedReps.length > 0) count++
        if (status !== 'all') count++
        if (customer !== 'all') count++
        if (dateFrom || dateTo) count++
        return count
    }, [search, project, selectedReps, status, customer, dateFrom, dateTo])

    const toggleRep = (id: string) => {
        setSelectedReps(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(repSearch.toLowerCase())
    )

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (search) params.set('q', search)
        else params.delete('q')

        if (project !== 'all') params.set('p', project)
        else params.delete('p')

        if (selectedReps.length > 0) params.set('r', selectedReps.join(','))
        else params.delete('r')

        if (status !== 'all') params.set('s', status)
        else params.delete('s')

        if (customer !== 'all') params.set('c', customer)
        else params.delete('c')

        if (dateFrom) params.set('df', dateFrom)
        else params.delete('df')

        if (dateTo) params.set('dt', dateTo)
        else params.delete('dt')

        router.push(`?${params.toString()}`)
        setOpen(false)
    }

    const handleClear = () => {
        setSearch('')
        setProject('all')
        setSelectedReps([])
        setStatus('all')
        setCustomer('all')
        setDateFrom('')
        setDateTo('')
        setRepSearch('')
        router.push('/crm')
        setOpen(false)
    }

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="relative h-9 px-4">
                    <Filter className="mr-2 h-4 w-4" />
                    {t('button')}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative h-9 px-4">
                        <Filter className="mr-2 h-4 w-4" />
                        {t('button')}
                        {activeFilterCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-blue-600 hover:bg-blue-600 border-2 border-background">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md p-0 flex flex-col h-full">
                    {/* ── FIXED HEADER ── */}
                    <SheetHeader className="px-5 pt-5 pb-3 border-b bg-background shrink-0">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg">{t('title')}</SheetTitle>
                            {hasFilters && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {activeFilterCount} filtre aktif
                                </Badge>
                            )}
                        </div>
                        {/* Active filter chips summary */}
                        {hasFilters && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {search && (
                                    <Badge variant="outline" className="text-xs py-0.5 gap-1 cursor-pointer hover:bg-red-50" onClick={() => setSearch('')}>
                                        Arama: {search}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {project !== 'all' && (
                                    <Badge variant="outline" className="text-xs py-0.5 gap-1 cursor-pointer hover:bg-red-50" onClick={() => setProject('all')}>
                                        {projects.find(p => p.id === project)?.name || 'Proje'}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {selectedReps.length > 0 && (
                                    <Badge variant="outline" className="text-xs py-0.5 gap-1 cursor-pointer hover:bg-red-50" onClick={() => setSelectedReps([])}>
                                        {selectedReps.length} temsilci
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {status !== 'all' && (
                                    <Badge variant="outline" className="text-xs py-0.5 gap-1 cursor-pointer hover:bg-red-50" onClick={() => setStatus('all')}>
                                        Durum: {status}
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                                {(dateFrom || dateTo) && (
                                    <Badge variant="outline" className="text-xs py-0.5 gap-1 cursor-pointer hover:bg-red-50" onClick={() => { setDateFrom(''); setDateTo('') }}>
                                        Tarih
                                        <X className="h-3 w-3" />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </SheetHeader>

                    {/* ── SCROLLABLE CONTENT ── */}
                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <div className="grid gap-5">
                            {/* Müşteri / Ünite Ara */}
                            <div className="space-y-1.5">
                                <Label htmlFor="search" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('search')}</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder={t('searchPlaceholder')}
                                        className="pl-9 h-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Proje & Durum — yan yana */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('project')}</Label>
                                    <Select value={project} onValueChange={setProject}>
                                        <SelectTrigger className="h-10 text-sm">
                                            <SelectValue placeholder={t('allProjects')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allProjects')}</SelectItem>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('statusLabel')}</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-10 text-sm">
                                            <SelectValue placeholder={t('allStatuses')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t('allStatuses')}</SelectItem>
                                            <SelectItem value="Lead">{t('status.Lead')}</SelectItem>
                                            <SelectItem value="Prospect">{t('status.Prospect')}</SelectItem>
                                            <SelectItem value="Reservation">{t('status.Reservation')}</SelectItem>
                                            <SelectItem value="Sold">{t('status.Sold')}</SelectItem>
                                            <SelectItem value="Lost">{t('status.Lost')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Müşteri Seç */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    Müşteri
                                </Label>
                                <Select value={customer} onValueChange={setCustomer}>
                                    <SelectTrigger className="h-10 text-sm">
                                        <SelectValue placeholder="Tüm Müşteriler" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Müşteriler</SelectItem>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.full_name}
                                                {c.phone && <span className="text-muted-foreground text-xs ml-1">· {c.phone}</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Satış Temsilcisi — Collapsible */}
                            <div className="space-y-1.5">
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between py-1 group"
                                    onClick={() => setRepSectionOpen(!repSectionOpen)}
                                >
                                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 cursor-pointer">
                                        <Users className="h-3.5 w-3.5" />
                                        {t('rep')}
                                        {selectedReps.length > 0 && (
                                            <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-blue-600 hover:bg-blue-600">
                                                {selectedReps.length}
                                            </Badge>
                                        )}
                                    </Label>
                                    {repSectionOpen
                                        ? <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                        : <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    }
                                </button>

                                {/* Selected rep tags — always visible */}
                                {selectedReps.length > 0 && !repSectionOpen && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedReps.map(id => {
                                            const label = id === 'unassigned'
                                                ? '⚠️ Atanmamış'
                                                : profiles.find(p => p.id === id)?.full_name || id
                                            return (
                                                <Badge
                                                    key={id}
                                                    variant="outline"
                                                    className="pl-2 pr-1 py-0.5 text-[11px] flex items-center gap-0.5 cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                                                    onClick={() => toggleRep(id)}
                                                >
                                                    {label}
                                                    <X className="h-3 w-3 text-muted-foreground" />
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Expandable rep selector */}
                                {repSectionOpen && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        {/* Selected tags */}
                                        {selectedReps.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {selectedReps.map(id => {
                                                    const label = id === 'unassigned'
                                                        ? '⚠️ Atanmamış'
                                                        : profiles.find(p => p.id === id)?.full_name || id
                                                    return (
                                                        <Badge
                                                            key={id}
                                                            variant="outline"
                                                            className="pl-2 pr-1 py-0.5 text-[11px] flex items-center gap-0.5 cursor-pointer hover:bg-red-50 hover:border-red-300 transition-colors"
                                                            onClick={() => toggleRep(id)}
                                                        >
                                                            {label}
                                                            <X className="h-3 w-3 text-muted-foreground" />
                                                        </Badge>
                                                    )
                                                })}
                                                <button
                                                    className="text-[11px] text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors"
                                                    onClick={() => setSelectedReps([])}
                                                >
                                                    Temizle
                                                </button>
                                            </div>
                                        )}

                                        {/* Search */}
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                            <Input
                                                placeholder="Temsilci ara..."
                                                className="pl-8 h-8 text-sm"
                                                value={repSearch}
                                                onChange={(e) => setRepSearch(e.target.value)}
                                            />
                                        </div>

                                        {/* Checkbox list */}
                                        <div className="border rounded-lg overflow-hidden bg-muted/20">
                                            <ScrollArea className="h-40">
                                                <div className="p-0.5">
                                                    {/* Atanmamış */}
                                                    {!repSearch && (
                                                        <label
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-amber-50 text-sm border-b"
                                                            onClick={() => toggleRep('unassigned')}
                                                        >
                                                            <Checkbox
                                                                checked={selectedReps.includes('unassigned')}
                                                                onCheckedChange={() => toggleRep('unassigned')}
                                                                className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 h-4 w-4"
                                                            />
                                                            <span className="font-medium text-amber-700 text-sm">⚠️ Atanmamış</span>
                                                        </label>
                                                    )}

                                                    {filteredProfiles.length === 0 && (
                                                        <p className="text-center text-xs text-muted-foreground py-3">Sonuç bulunamadı</p>
                                                    )}

                                                    {filteredProfiles.map(p => (
                                                        <label
                                                            key={p.id}
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-muted text-sm"
                                                            onClick={() => toggleRep(p.id)}
                                                        >
                                                            <Checkbox
                                                                checked={selectedReps.includes(p.id)}
                                                                onCheckedChange={() => toggleRep(p.id)}
                                                                className="h-4 w-4"
                                                            />
                                                            <span className="text-sm">{p.full_name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tarih Aralığı */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Kayıt Tarihi
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="dateFrom" className="text-[11px] text-muted-foreground">Başlangıç</Label>
                                        <Input
                                            id="dateFrom"
                                            type="date"
                                            className="h-10 text-sm"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="dateTo" className="text-[11px] text-muted-foreground">Bitiş</Label>
                                        <Input
                                            id="dateTo"
                                            type="date"
                                            className="h-10 text-sm"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── STICKY FOOTER ── */}
                    <div className="shrink-0 border-t bg-background px-5 py-3 flex items-center gap-2">
                        <Button
                            onClick={handleApply}
                            className="flex-1 h-10 text-sm font-medium"
                        >
                            <CheckCircle2 className="mr-1.5 h-4 w-4" />
                            {t('apply')}
                        </Button>
                        {hasFilters && (
                            <Button
                                onClick={handleClear}
                                variant="outline"
                                className="h-10 px-3 text-sm text-muted-foreground hover:text-red-600 hover:border-red-300"
                            >
                                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                {t('reset')}
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                    onClick={handleClear}
                    title={t('reset')}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
