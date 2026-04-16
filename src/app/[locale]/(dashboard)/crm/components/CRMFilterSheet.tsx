'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
    X, 
    Filter, 
    Search, 
    User, 
    Building2, 
    CheckCircle2, 
    Users, 
    ChevronDown, 
    Check,
    Phone
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface CRMFilterSheetProps {
    projects: any[]
    profiles: any[]
    customers: any[]
}

export default function CRMFilterSheet({ projects, profiles, customers }: CRMFilterSheetProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [open, setOpen] = useState(false)
    const [customerOpen, setCustomerOpen] = useState(false)
    const [repOpen, setRepOpen] = useState(false)

    // Local filter state mapped to URL parameters (for apply and clear)
    const [search, setSearch] = useState(searchParams.get('q') || '')
    const [project, setProject] = useState(searchParams.get('p') || 'all')
    const [status, setStatus] = useState(searchParams.get('s') || 'all')
    const [customer, setCustomer] = useState(searchParams.get('c') || 'all')
    const [representative, setRepresentative] = useState(searchParams.get('r') || 'all')

    // Always sync state when params change
    useEffect(() => {
        setSearch(searchParams.get('q') || '')
        setProject(searchParams.get('p') || 'all')
        setStatus(searchParams.get('s') || 'all')
        setCustomer(searchParams.get('c') || 'all')
        setRepresentative(searchParams.get('r') || 'all') // Assuming single representative for combobox
    }, [searchParams])

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (search) count++
        if (project && project !== 'all') count++
        if (status && status !== 'all') count++
        if (customer && customer !== 'all') count++
        if (representative && representative !== 'all') count++
        return count
    }, [search, project, status, customer, representative])

    const activeFilterChips = useMemo(() => {
        const chips = []
        if (project && project !== 'all') {
            const p = projects.find(p => p.id === project)
            if (p) chips.push({ key: 'p', label: p.name, value: 'all' })
        }
        if (status && status !== 'all') {
            chips.push({ key: 's', label: status, value: 'all' })
        }
        if (representative && representative !== 'all') {
            const repIds = representative.split(',').filter(Boolean)
            if (repIds.length === 1) {
                const rep = profiles.find(p => p.id === repIds[0])
                if (rep) chips.push({ key: 'r', label: rep.full_name, value: 'all' })
            } else if (repIds.length > 1) {
                chips.push({ key: 'r', label: `${repIds.length} Temsilci`, value: 'all' })
            }
        }
        if (customer && customer !== 'all') {
            const c = customers.find(c => c.id === customer)
            if (c) chips.push({ key: 'c', label: c.full_name, value: 'all' })
        }
        return chips
    }, [project, status, representative, customer, projects, profiles, customers])

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())

        if (search) params.set('q', search)
        else params.delete('q')

        if (project !== 'all') params.set('p', project)
        else params.delete('p')

        if (status !== 'all') params.set('s', status)
        else params.delete('s')

        if (customer !== 'all') params.set('c', customer)
        else params.delete('c')

        if (representative !== 'all') params.set('r', representative)
        else params.delete('r')

        router.push(`?${params.toString()}`)
        setOpen(false)
    }

    const handleClear = () => {
        setSearch('')
        setProject('all')
        setStatus('all')
        setCustomer('all')
        setRepresentative('all')
        router.push(`?`)
    }

    const updateFilter = (key: string, value: string) => {
        if (key === 'search') setSearch(value)
        if (key === 'projectId' || key === 'p') setProject(value)
        if (key === 'status' || key === 's') setStatus(value)
        if (key === 'customerId' || key === 'c') setCustomer(value)
        if (key === 'representativeId' || key === 'r') setRepresentative(value)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" className="h-[42px] px-4 gap-2">
                    <Filter className="w-4 h-4" />
                    <span>Filtreler</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="default" className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px] flex items-center justify-center">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l shadow-2xl">
                {/* Header Section */}
                <div className="p-6 border-b bg-card/50">
                    <div className="flex items-center justify-between mb-2">
                        <SheetHeader className="text-left p-0">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Filter className="w-5 h-5 text-primary" />
                                </div>
                                <SheetTitle className="text-xl font-bold">CRM Filtreleri</SheetTitle>
                            </div>
                            <SheetDescription className="text-sm">
                                Kayıtları daraltmak için kriterleri belirleyin.
                            </SheetDescription>
                        </SheetHeader>
                        {activeFilterCount > 0 && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClear}
                                className="text-xs h-8 text-muted-foreground hover:text-destructive"
                            >
                                <X className="w-3 h-3 mr-1" />
                                Temizle
                            </Button>
                        )}
                    </div>

                    {/* Active Filter Chips */}
                    {activeFilterChips.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            {activeFilterChips.map(chip => (
                                <Badge 
                                    key={chip.key} 
                                    variant="secondary" 
                                    className="pl-2 pr-1 py-1 gap-1 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
                                >
                                    {chip.label}
                                    <button 
                                        onClick={() => updateFilter(chip.key, 'all')}
                                        className="hover:bg-primary/20 rounded-full p-0.5"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Scrollable Body */}
                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-8 pb-10">
                        {/* Search Input */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Search className="w-4 h-4 text-muted-foreground" />
                                Müşteri / Ünite Ara
                            </Label>
                            <Input
                                placeholder="İsim, telefon veya ünite no..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-11 shadow-sm focus-visible:ring-primary"
                            />
                        </div>

                        <Separator className="opacity-50" />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Project Filter */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    Proje
                                </Label>
                                <Select
                                    value={project}
                                    onValueChange={(val) => setProject(val)}
                                >
                                    <SelectTrigger className="h-10">
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

                            {/* Status Filter */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                    Durum
                                </Label>
                                <Select
                                    value={status}
                                    onValueChange={(val) => setStatus(val)}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Tüm Durumlar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                                        <SelectItem value="Inbox">Yeni Gelen (Inbox)</SelectItem>
                                        <SelectItem value="Lead">Lead</SelectItem>
                                        <SelectItem value="Prospect">Fırsat (Prospect)</SelectItem>
                                        <SelectItem value="Potential">Potansiyel</SelectItem>
                                        <SelectItem value="Proposal">Teklif Verildi</SelectItem>
                                        <SelectItem value="Negotiation">Müzakere</SelectItem>
                                        <SelectItem value="Contract">Sözleşme</SelectItem>
                                        <SelectItem value="Sold">Satış Tamamlandı</SelectItem>
                                        <SelectItem value="Lost">Kaybedildi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        {/* Customer Filter (Combobox) */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                Müşteri Seç
                            </Label>
                            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={customerOpen}
                                        className="w-full h-11 justify-between shadow-sm bg-background font-normal"
                                    >
                                        <span className="truncate">
                                            {customer && customer !== 'all'
                                                ? customers.find((c) => c.id === customer)?.full_name
                                                : "Müşteri ara..."}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command className="w-full">
                                        <CommandInput placeholder="İsim veya telefon yazın..." className="h-11" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>Müşteri bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        setCustomer('all')
                                                        setCustomerOpen(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", customer === 'all' ? "opacity-100" : "opacity-0")} />
                                                    Tüm Müşteriler
                                                </CommandItem>
                                                {customers.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={`${c.full_name} ${c.phone || ''}`}
                                                        onSelect={() => {
                                                            setCustomer(c.id)
                                                            setCustomerOpen(false)
                                                        }}
                                                        className="cursor-pointer py-3"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center font-medium">
                                                                <Check className={cn("mr-2 h-4 w-4", customer === c.id ? "opacity-100" : "opacity-0")} />
                                                                {c.full_name}
                                                            </div>
                                                            {c.phone && (
                                                                <div className="flex items-center text-[11px] text-muted-foreground ml-6">
                                                                    <Phone className="w-3 h-3 mr-1" />
                                                                    {c.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Representative Filter (Combobox) */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                Satış Temsilcisi
                            </Label>
                            <Popover open={repOpen} onOpenChange={setRepOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={repOpen}
                                        className="w-full h-11 justify-between shadow-sm bg-background font-normal"
                                    >
                                        <span className="truncate">
                                            {representative && representative !== 'all'
                                                ? profiles.find((p) => p.id === representative)?.full_name
                                                : "Temsilci ara..."}
                                        </span>
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                    <Command className="w-full">
                                        <CommandInput placeholder="İsim yazın..." className="h-11" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>Temsilci bulunamadı.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem 
                                                    value="all"
                                                    onSelect={() => {
                                                        setRepresentative('all')
                                                        setRepOpen(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", representative === 'all' ? "opacity-100" : "opacity-0")} />
                                                    Tüm Temsilciler
                                                </CommandItem>
                                                {profiles.map((profile) => (
                                                    <CommandItem
                                                        key={profile.id}
                                                        value={profile.full_name || ""}
                                                        onSelect={() => {
                                                            setRepresentative(profile.id)
                                                            setRepOpen(false)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", representative === profile.id ? "opacity-100" : "opacity-0")} />
                                                        {profile.full_name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </ScrollArea>

                {/* Sticky Footer */}
                <div className="p-6 border-t bg-card/80 backdrop-blur-md">
                    <Button 
                        onClick={handleApply} 
                        className="w-full h-12 text-base font-bold shadow-lg transition-all active:scale-[0.98] hover:shadow-primary/20"
                    >
                        Filtreleri Uygula
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                        {activeFilterCount} aktif filtre kriteri seçili
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    )
}
