'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Filter, X, Search, Calendar, User } from 'lucide-react'

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
    const [rep, setRep] = useState(searchParams.get('r') || 'all')
    const [status, setStatus] = useState(searchParams.get('s') || 'all')
    const [customer, setCustomer] = useState(searchParams.get('c') || 'all')
    const [dateFrom, setDateFrom] = useState(searchParams.get('df') || '')
    const [dateTo, setDateTo] = useState(searchParams.get('dt') || '')

    const hasFilters = search || project !== 'all' || rep !== 'all' || status !== 'all'
        || customer !== 'all' || dateFrom || dateTo

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (search) params.set('q', search)
        else params.delete('q')

        if (project !== 'all') params.set('p', project)
        else params.delete('p')

        if (rep !== 'all') params.set('r', rep)
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
        setRep('all')
        setStatus('all')
        setCustomer('all')
        setDateFrom('')
        setDateTo('')
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

                        {/* Satış Temsilcisi */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">{t('rep')}</Label>
                            <Select value={rep} onValueChange={setRep}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder={t('allTeam')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('allTeam')}</SelectItem>
                                    {profiles.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
