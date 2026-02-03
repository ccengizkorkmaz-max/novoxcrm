'use client'

import { useState } from 'react'
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
import { Filter, X, Search } from 'lucide-react'

import { useTranslations } from 'next-intl'

interface CRMFilterSheetProps {
    projects: any[]
    profiles: any[]
}

export default function CRMFilterSheet({ projects, profiles }: CRMFilterSheetProps) {
    const t = useTranslations('CRM.filter')
    const router = useRouter()
    const searchParams = useSearchParams()

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [project, setProject] = useState(searchParams.get('p') || 'all')
    const [rep, setRep] = useState(searchParams.get('r') || 'all')
    const [status, setStatus] = useState(searchParams.get('s') || 'all')

    const hasFilters = search || project !== 'all' || rep !== 'all' || status !== 'all'

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

        router.push(`?${params.toString()}`)
        setOpen(false)
    }

    const handleClear = () => {
        setSearch('')
        setProject('all')
        setRep('all')
        setStatus('all')
        router.push('/crm')
        setOpen(false)
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
                <SheetContent className="sm:max-w-md px-8">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">{t('title')}</SheetTitle>
                        <SheetDescription>
                            {t('description')}
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-8 py-8">
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
