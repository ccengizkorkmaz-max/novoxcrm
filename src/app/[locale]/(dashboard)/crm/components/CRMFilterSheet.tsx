'use client'

import { useState, useMemo } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
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
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    filters: any
    onFilterChange: (key: string, value: any) => void
    onApply: () => void
    onClear: () => void
    projects: any[]
    profiles: any[]
    customers: any[]
}

export default function CRMFilterSheet({
    isOpen,
    onOpenChange,
    filters,
    onFilterChange,
    onApply,
    onClear,
    projects,
    profiles,
    customers,
}: CRMFilterSheetProps) {
    const [customerOpen, setCustomerOpen] = useState(false)
    const [repOpen, setRepOpen] = useState(false)

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.search) count++
        if (filters.projectId && filters.projectId !== 'all') count++
        if (filters.status && filters.status !== 'all') count++
        if (filters.customerId && filters.customerId !== 'all') count++
        if (filters.representativeId && filters.representativeId !== 'all') count++
        return count
    }, [filters])

    const activeFilterChips = useMemo(() => {
        const chips = []
        if (filters.projectId && filters.projectId !== 'all') {
            const project = projects.find(p => p.id === filters.projectId)
            if (project) chips.push({ key: 'projectId', label: project.name })
        }
        if (filters.status && filters.status !== 'all') {
            chips.push({ key: 'status', label: filters.status })
        }
        if (filters.representativeId && filters.representativeId !== 'all') {
            const rep = profiles.find(p => p.id === filters.representativeId)
            if (rep) chips.push({ key: 'representativeId', label: rep.full_name })
        }
        if (filters.customerId && filters.customerId !== 'all') {
            const customer = customers.find(c => c.id === filters.customerId)
            if (customer) chips.push({ key: 'customerId', label: customer.full_name })
        }
        return chips
    }, [filters, projects, profiles, customers])

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
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
                                onClick={onClear}
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
                                        onClick={() => onFilterChange(chip.key, 'all')}
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
                                value={filters.search}
                                onChange={(e) => onFilterChange('search', e.target.value)}
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
                                    value={filters.projectId}
                                    onValueChange={(val) => onFilterChange('projectId', val)}
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
                                    value={filters.status}
                                    onValueChange={(val) => onFilterChange('status', val)}
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
                                            {filters.customerId && filters.customerId !== 'all'
                                                ? customers.find((c) => c.id === filters.customerId)?.full_name
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
                                                        onFilterChange('customerId', 'all')
                                                        setCustomerOpen(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.customerId === 'all' ? "opacity-100" : "opacity-0")} />
                                                    Tüm Müşteriler
                                                </CommandItem>
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        key={customer.id}
                                                        value={`${customer.full_name} ${customer.phone || ''}`}
                                                        onSelect={() => {
                                                            onFilterChange('customerId', customer.id)
                                                            setCustomerOpen(false)
                                                        }}
                                                        className="cursor-pointer py-3"
                                                    >
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center font-medium">
                                                                <Check className={cn("mr-2 h-4 w-4", filters.customerId === customer.id ? "opacity-100" : "opacity-0")} />
                                                                {customer.full_name}
                                                            </div>
                                                            {customer.phone && (
                                                                <div className="flex items-center text-[11px] text-muted-foreground ml-6">
                                                                    <Phone className="w-3 h-3 mr-1" />
                                                                    {customer.phone}
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
                                            {filters.representativeId && filters.representativeId !== 'all'
                                                ? profiles.find((p) => p.id === filters.representativeId)?.full_name
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
                                                        onFilterChange('representativeId', 'all')
                                                        setRepOpen(false)
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <Check className={cn("mr-2 h-4 w-4", filters.representativeId === 'all' ? "opacity-100" : "opacity-0")} />
                                                    Tüm Temsilciler
                                                </CommandItem>
                                                {profiles.map((profile) => (
                                                    <CommandItem
                                                        key={profile.id}
                                                        value={profile.full_name || ""}
                                                        onSelect={() => {
                                                            onFilterChange('representativeId', profile.id)
                                                            setRepOpen(false)
                                                        }}
                                                        className="cursor-pointer"
                                                    >
                                                        <Check className={cn("mr-2 h-4 w-4", filters.representativeId === profile.id ? "opacity-100" : "opacity-0")} />
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
                        onClick={() => {
                            onApply()
                            onOpenChange(false)
                        }} 
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
