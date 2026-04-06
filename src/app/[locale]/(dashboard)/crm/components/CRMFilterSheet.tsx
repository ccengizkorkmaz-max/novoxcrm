'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Filter, X, Search, Calendar, User, Users, ChevronDown } from 'lucide-react'
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
    // Multi-select reps: array of IDs or 'unassigned'
    const [selectedReps, setSelectedReps] = useState<string[]>(() => {
        const r = searchParams.get('r')
        return r ? r.split(',').filter(Boolean) : []
    })
    const [status, setStatus] = useState(searchParams.get('s') || 'all')
    const [customer, setCustomer] = useState(searchParams.get('c') || 'all')
    const [dateFrom, setDateFrom] = useState(searchParams.get('df') || '')
    const [dateTo, setDateTo] = useState(searchParams.get('dt') || '')
    const [repSearch, setRepSearch] = useState('')

    const hasFilters = search || project !== 'all' || selectedReps.length > 0 || status !== 'all'
        || customer !== 'all' || dateFrom || dateTo

    const toggleRep = (id: string) => {
        setSelectedReps(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(repSearch.toLowerCase())
    )

    const getRepLabel = () => {
        if (selectedReps.length === 0) return t('allTeam')
        if (selectedReps.length === 1) {
            if (selectedReps[0] === 'unassigned') return 'Atanmamış'
            return profiles.find(p => p.id === selectedReps[0])?.full_name || t('allTeam')
        }
        return `${selectedReps.length} temsilci seçili`
    }

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
                        {hasFilters && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full border-2 border-background animate-pulse" />
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md px-8 overflow-y-auto">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">{t('title')}</SheetTitle>
                        <SheetDescription>
                            {t('description')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-6 py-6 pb-28">
                        {/* Müşteri / Ünite Ara */}
                        <div className="space-y-3">
                            <Label htmlFor="search" className="text-sm font-semibold">{t('search')}</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder={t('searchPlaceholder')}
                                    className="pl-10 h-11"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Müşteri Seç */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                Müşteri
                            </Label>
                            <Select value={customer} onValueChange={setCustomer}>
                                <SelectTrigger className="h-11">
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

                        {/* Proje */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">{t('project')}</Label>
                            <Select value={project} onValueChange={setProject}>
                                <SelectTrigger className="h-11">
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

                        {/* Satış Temsilcisi — Çoklu Seçim */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {t('rep')}
                                {selectedReps.length > 0 && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {selectedReps.length} seçili
                                    </Badge>
                                )}
                            </Label>

                            {/* Selected rep tags */}
                            {selectedReps.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedReps.map(id => {
                                        const label = id === 'unassigned'
                                            ? '⚠️ Atanmamış'
                                            : profiles.find(p => p.id === id)?.full_name || id
                                        return (
                                            <Badge
                                                key={id}
                                                variant="outline"
                                                className="pl-2 pr-1 py-0.5 text-xs flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-300"
                                                onClick={() => toggleRep(id)}
                                            >
                                                {label}
                                                <X className="h-3 w-3 text-muted-foreground" />
                                            </Badge>
                                        )
                                    })}
                                    <button
                                        className="text-xs text-muted-foreground hover:text-red-600 underline underline-offset-2"
                                        onClick={() => setSelectedReps([])}
                                    >
                                        Tümünü temizle
                                    </button>
                                </div>
                            )}

                            {/* Search box */}
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Temsilci ara..."
                                    className="pl-8 h-9 text-sm"
                                    value={repSearch}
                                    onChange={(e) => setRepSearch(e.target.value)}
                                />
                            </div>

                            {/* Checkbox list */}
                            <div className="border rounded-lg overflow-hidden">
                                <ScrollArea className="h-48">
                                    <div className="p-1">
                                        {/* Atanmamış seçeneği */}
                                        {!repSearch && (
                                            <label
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer hover:bg-amber-50 text-sm border-b mb-1"
                                                onClick={() => toggleRep('unassigned')}
                                            >
                                                <Checkbox
                                                    checked={selectedReps.includes('unassigned')}
                                                    onCheckedChange={() => toggleRep('unassigned')}
                                                    className="border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                                                />
                                                <span className="font-medium text-amber-700">⚠️ Atanmamış</span>
                                            </label>
                                        )}

                                        {filteredProfiles.length === 0 && (
                                            <p className="text-center text-xs text-muted-foreground py-4">Sonuç bulunamadı</p>
                                        )}

                                        {filteredProfiles.map(p => (
                                            <label
                                                key={p.id}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer hover:bg-muted text-sm"
                                                onClick={() => toggleRep(p.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedReps.includes(p.id)}
                                                    onCheckedChange={() => toggleRep(p.id)}
                                                />
                                                <span>{p.full_name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>

                        {/* Durum */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">{t('statusLabel')}</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-11">
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

                        {/* Tarih Aralığı */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                Kayıt Tarihi Aralığı
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">Başlangıç</Label>
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        className="h-11"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">Bitiş</Label>
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        className="h-11"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <SheetFooter className="absolute bottom-8 left-8 right-8 flex-col gap-3 sm:flex-col">
                        <Button onClick={handleApply} className="w-full h-11 text-base">{t('apply')}</Button>
                        <Button onClick={handleClear} variant="ghost" className="w-full h-11 text-muted-foreground hover:text-red-600">
                            <X className="mr-2 h-4 w-4" /> {t('reset')}
                        </Button>
                    </SheetFooter>
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
