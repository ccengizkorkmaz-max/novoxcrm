'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Filter, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

import { useTranslations } from 'next-intl'

const UNIT_CATEGORIES = [
    "Daire", "Depo", "Dükkan", "Ofis", "Villa",
    "Dubleks Daire", "Bahçe Dubleks Daire", "Çatı Dubleks Daire",
    "Roof Daire", "Loft Daire", "Penthouse", "Ticari Alan"
]

interface InventoryFiltersProps {
    projects: { id: string, name: string }[]
}

export function InventoryFilters({ projects }: InventoryFiltersProps) {
    const t = useTranslations('Inventory.filters')
    const tGlobal = useTranslations('Inventory')
    const router = useRouter()
    const searchParams = useSearchParams()
    const [open, setOpen] = useState(false)

    // Count active filters
    const activeFilterCount = Array.from(searchParams.entries()).filter(([key, val]) => {
        return val && val !== 'all' && key !== 'tab'
    }).length

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const params = new URLSearchParams()

        // Helper to append if value exists
        const appendIf = (key: string) => {
            const value = formData.get(key) as string
            if (value && value !== 'all') params.append(key, value)
        }

        appendIf('project')
        appendIf('block')
        appendIf('unit_category')
        appendIf('type')
        appendIf('status')
        appendIf('min_price')
        appendIf('max_price')
        appendIf('min_area')
        appendIf('max_area')
        appendIf('floor')
        appendIf('direction')
        appendIf('parking_type')
        appendIf('heating_type')
        appendIf('kitchen_type')
        appendIf('view')
        appendIf('has_master_bathroom')
        appendIf('has_builtin_kitchen')

        setOpen(false)
        router.push(`/inventory?${params.toString()}`)
    }

    function clearFilters() {
        router.push('/inventory')
        setOpen(false)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <div className="flex items-center gap-1">
                <SheetTrigger asChild>
                    <Button variant="outline" className="gap-2 relative">
                        <Filter className="w-4 h-4" />
                        {t('button')}
                        {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-muted-foreground hover:text-foreground" title={t('clear')}>
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>
            <SheetContent className="overflow-y-auto sm:max-w-[500px]">
                <SheetHeader>
                    <SheetTitle>{t('title')}</SheetTitle>
                    <SheetDescription>
                        {t('description')}
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="py-6 pl-4 space-y-6">
                    {/* Project */}
                    <div className="space-y-2">
                        <Label>{t('project')}</Label>
                        <select
                            name="project"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            defaultValue={searchParams.get('project') || 'all'}
                        >
                            <option value="all">{t('allProjects')}</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Block & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('block')}</Label>
                            <Input name="block" defaultValue={searchParams.get('block') || ''} placeholder="A" />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('status')}</Label>
                            <select
                                name="status"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('status') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="For Sale">{tGlobal('status.ForSale')}</option>
                                <option value="Reserved">{tGlobal('status.Reserved')}</option>
                                <option value="Sold">{tGlobal('status.Sold')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Category & Type */}
                    <div className="space-y-2">
                        <Label>{t('unitCategory')}</Label>
                        <select
                            name="unit_category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            defaultValue={searchParams.get('unit_category') || ''}
                        >
                            <option value="">{t('all')}</option>
                            {UNIT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t('roomType')}</Label>
                        <select
                            name="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            defaultValue={searchParams.get('type') || ''}
                        >
                            <option value="">{t('all')}</option>
                            <option value="1+1">1+1</option>
                            <option value="2+1">2+1</option>
                            <option value="3+1">3+1</option>
                            <option value="4+1">4+1</option>
                            <option value="Villa">{tGlobal('types.Villa')}</option>
                            <option value="Commercial">{tGlobal('types.Commercial')}</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <Label>{t('priceRange')}</Label>
                        <div className="flex gap-2">
                            <Input name="min_price" type="number" placeholder={t('min')} defaultValue={searchParams.get('min_price') || ''} />
                            <Input name="max_price" type="number" placeholder={t('max')} defaultValue={searchParams.get('max_price') || ''} />
                        </div>
                    </div>

                    {/* Area Range */}
                    <div className="space-y-2">
                        <Label>{t('areaRange')}</Label>
                        <div className="flex gap-2">
                            <Input name="min_area" type="number" placeholder={t('min')} defaultValue={searchParams.get('min_area') || ''} />
                            <Input name="max_area" type="number" placeholder={t('max')} defaultValue={searchParams.get('max_area') || ''} />
                        </div>
                    </div>

                    {/* Floor & Direction */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('floor')}</Label>
                            <Input name="floor" type="number" placeholder="5" defaultValue={searchParams.get('floor') || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('direction')}</Label>
                            <select
                                name="direction"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('direction') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="Kuzey">{tGlobal('directions.North')}</option>
                                <option value="Güney">{tGlobal('directions.South')}</option>
                                <option value="Doğu">{tGlobal('directions.East')}</option>
                                <option value="Batı">{tGlobal('directions.West')}</option>
                                <option value="Kuzey Doğu">{tGlobal('directions.NorthEast')}</option>
                                <option value="Kuzey Batı">{tGlobal('directions.NorthWest')}</option>
                                <option value="Güney Doğu">{tGlobal('directions.SouthEast')}</option>
                                <option value="Güney Batı">{tGlobal('directions.SouthWest')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Features - Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('parking')}</Label>
                            <select
                                name="parking_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('parking_type') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="Kapalı Otopark">{tGlobal('parking.Indoor')}</option>
                                <option value="Açık Otopark">{tGlobal('parking.Outdoor')}</option>
                                <option value="Yok">{tGlobal('parking.None')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('heating')}</Label>
                            <select
                                name="heating_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('heating_type') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="Kombi">{tGlobal('heating.Combi')}</option>
                                <option value="Merkezi Sistem">{tGlobal('heating.Central')}</option>
                                <option value="Yerden Isıtma">{tGlobal('heating.Floor')}</option>
                                <option value="Klima">{tGlobal('heating.AC')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Features - Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('kitchen')}</Label>
                            <select
                                name="kitchen_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('kitchen_type') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="Kapalı Mutfak">{tGlobal('kitchen.Closed')}</option>
                                <option value="Açık Mutfak">{tGlobal('kitchen.Open')}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('view')}</Label>
                            <select
                                name="view"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('view') || ''}
                            >
                                <option value="">{t('all')}</option>
                                <option value="Deniz">{tGlobal('views.Sea')}</option>
                                <option value="Doğa">{tGlobal('views.Nature')}</option>
                                <option value="Şehir">{tGlobal('views.City')}</option>
                                <option value="Havuz">{tGlobal('views.Pool')}</option>
                                <option value="Park">{tGlobal('views.Park')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="has_master_bathroom"
                                id="has_master_bathroom"
                                value="true"
                                defaultChecked={searchParams.get('has_master_bathroom') === 'true'}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="has_master_bathroom" className="font-normal cursor-pointer">{t('features.masterBath')}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="has_builtin_kitchen"
                                id="has_builtin_kitchen"
                                value="true"
                                defaultChecked={searchParams.get('has_builtin_kitchen') === 'true'}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="has_builtin_kitchen" className="font-normal cursor-pointer">{t('features.builtinKitchen')}</Label>
                        </div>
                    </div>

                    <SheetFooter className="flex-col sm:flex-col gap-2 mt-auto">
                        <Button type="submit" className="w-full">{t('apply')}</Button>
                        <Button type="button" variant="outline" onClick={clearFilters} className="w-full">{t('clear')}</Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
