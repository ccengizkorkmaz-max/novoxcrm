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

interface CRMFilterSheetProps {
    projects: any[]
    profiles: any[]
}

export default function CRMFilterSheet({ projects, profiles }: CRMFilterSheetProps) {
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
                        Filtrele
                        {hasFilters && (
                            <span className="absolute -top-1 -right-1 h-3 w-3 bg-blue-600 rounded-full border-2 border-background animate-pulse" />
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent className="sm:max-w-md px-8">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="text-xl">CRM Filtreleri</SheetTitle>
                        <SheetDescription>
                            Satış ve aday listesini detaylı kriterlere göre daraltın.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="grid gap-8 py-8">
                        <div className="space-y-3">
                            <Label htmlFor="search" className="text-sm font-semibold">Müşteri / Ünite Ara</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="İsim veya ünite no..."
                                    className="pl-10 h-11"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Proje</Label>
                            <Select value={project} onValueChange={setProject}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Tüm Projeler" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Projeler</SelectItem>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Satış Temsilcisi</Label>
                            <Select value={rep} onValueChange={setRep}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Tüm Ekip" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Ekip</SelectItem>
                                    {profiles.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold">Statü</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Tüm Statüler" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Statüer</SelectItem>
                                    <SelectItem value="Lead">Lead (Aday)</SelectItem>
                                    <SelectItem value="Prospect">Fırsat</SelectItem>
                                    <SelectItem value="Reservation">Opsiyonlu</SelectItem>
                                    <SelectItem value="Sold">Satıldı / Onaylandı</SelectItem>
                                    <SelectItem value="Lost">Kaybedildi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <SheetFooter className="absolute bottom-8 left-8 right-8 flex-col gap-3 sm:flex-col">
                        <Button onClick={handleApply} className="w-full h-11 text-base">Filtreleri Uygula</Button>
                        <Button onClick={handleClear} variant="ghost" className="w-full h-11 text-muted-foreground hover:text-red-600">
                            <X className="mr-2 h-4 w-4" /> Filtreleri Sıfırla
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
                    title="Filtreleri Temizle"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
