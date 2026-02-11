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

        const currentTab = searchParams.get('tab')
        if (currentTab) params.set('tab', currentTab)

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
                                <option value="For Sale">{tGlobal.has('status.ForSale') ? tGlobal('status.ForSale') : 'Satılık'}</option>
                                <option value="Reserved">{tGlobal.has('status.Reserved') ? tGlobal('status.Reserved') : 'Rezerve'}</option>
                                <option value="Sold">{tGlobal.has('status.Sold') ? tGlobal('status.Sold') : 'Satıldı'}</option>
                                <option value="Blocked">Bloke</option>
                                <option value="Option">Opsiyon</option>
                                <option value="Rented">Kirada</option>
                                <option value="Delivered">Teslim Edildi</option>
                            </select>
                        </div>
                    </div>

                    {/* Category & Type */}
                    <div className="space-y-2">
                        <Label>{t.has('unitCategory') ? t('unitCategory') : 'Ünite Türü'}</Label>
                        <select
                            name="unit_category"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            defaultValue={searchParams.get('unit_category') || ''}
                        >
                            <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                            {UNIT_CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>
                                    {tGlobal.has(`categories.${cat}`) ? tGlobal(`categories.${cat}`) : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label>{t.has('roomType') ? t('roomType') : 'Oda Tipi'}</Label>
                        <select
                            name="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            defaultValue={searchParams.get('type') || ''}
                        >
                            <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                            <option value="1+1">1+1</option>
                            <option value="2+1">2+1</option>
                            <option value="3+1">3+1</option>
                            <option value="4+1">4+1</option>
                            <option value="Villa">{tGlobal.has('types.Villa') ? tGlobal('types.Villa') : 'Villa'}</option>
                            <option value="Commercial">{tGlobal.has('types.Commercial') ? tGlobal('types.Commercial') : 'Ticari'}</option>
                        </select>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                        <Label>{t.has('priceRange') ? t('priceRange') : 'Fiyat Aralığı'}</Label>
                        <div className="flex gap-2">
                            <Input name="min_price" type="number" placeholder={t.has('min') ? t('min') : 'Min'} defaultValue={searchParams.get('min_price') || ''} />
                            <Input name="max_price" type="number" placeholder={t.has('max') ? t('max') : 'Max'} defaultValue={searchParams.get('max_price') || ''} />
                        </div>
                    </div>

                    {/* Area Range */}
                    <div className="space-y-2">
                        <Label>{t.has('areaRange') ? t('areaRange') : 'Brüt m² Aralığı'}</Label>
                        <div className="flex gap-2">
                            <Input name="min_area" type="number" placeholder={t.has('min') ? t('min') : 'Min'} defaultValue={searchParams.get('min_area') || ''} />
                            <Input name="max_area" type="number" placeholder={t.has('max') ? t('max') : 'Max'} defaultValue={searchParams.get('max_area') || ''} />
                        </div>
                    </div>

                    {/* Floor & Direction */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t.has('floor') ? t('floor') : 'Kat'}</Label>
                            <Input name="floor" type="text" placeholder="5" defaultValue={searchParams.get('floor') || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label>{t.has('direction') ? t('direction') : 'Cephe'}</Label>
                            <select
                                name="direction"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('direction') || ''}
                            >
                                <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                                <option value="Kuzey">{tGlobal.has('directions.North') ? tGlobal('directions.North') : 'Kuzey'}</option>
                                <option value="Güney">{tGlobal.has('directions.South') ? tGlobal('directions.South') : 'Güney'}</option>
                                <option value="Doğu">{tGlobal.has('directions.East') ? tGlobal('directions.East') : 'Doğu'}</option>
                                <option value="Batı">{tGlobal.has('directions.West') ? tGlobal('directions.West') : 'Batı'}</option>
                                <option value="Kuzey Doğu">{tGlobal.has('directions.NorthEast') ? tGlobal('directions.NorthEast') : 'Kuzey Doğu'}</option>
                                <option value="Kuzey Batı">{tGlobal.has('directions.NorthWest') ? tGlobal('directions.NorthWest') : 'Kuzey Batı'}</option>
                                <option value="Güney Doğu">{tGlobal.has('directions.SouthEast') ? tGlobal('directions.SouthEast') : 'Güney Doğu'}</option>
                                <option value="Güney Batı">{tGlobal.has('directions.SouthWest') ? tGlobal('directions.SouthWest') : 'Güney Batı'}</option>
                            </select>
                        </div>
                    </div>

                    {/* Features - Row 1 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t.has('parking') ? t('parking') : 'Otopark'}</Label>
                            <select
                                name="parking_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('parking_type') || ''}
                            >
                                <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                                <option value="Kapalı Otopark">{tGlobal.has('parking.Indoor') ? tGlobal('parking.Indoor') : 'Kapalı Otopark'}</option>
                                <option value="Açık Otopark">{tGlobal.has('parking.Outdoor') ? tGlobal('parking.Outdoor') : 'Açık Otopark'}</option>
                                <option value="Yok">{tGlobal.has('parking.None') ? tGlobal('parking.None') : 'Yok'}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t.has('heating') ? t('heating') : 'Isıtma'}</Label>
                            <select
                                name="heating_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('heating_type') || ''}
                            >
                                <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                                <option value="Kombi">{tGlobal.has('heating.Combi') ? tGlobal('heating.Combi') : 'Kombi'}</option>
                                <option value="Merkezi Sistem">{tGlobal.has('heating.Central') ? tGlobal('heating.Central') : 'Merkezi Sistem'}</option>
                                <option value="Yerden Isıtma">{tGlobal.has('heating.Floor') ? tGlobal('heating.Floor') : 'Yerden Isıtma'}</option>
                                <option value="Klima">{tGlobal.has('heating.AC') ? tGlobal('heating.AC') : 'Klima'}</option>
                            </select>
                        </div>
                    </div>

                    {/* Features - Row 2 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t.has('kitchen') ? t('kitchen') : 'Mutfak Tipi'}</Label>
                            <select
                                name="kitchen_type"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('kitchen_type') || ''}
                            >
                                <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                                <option value="Kapalı Mutfak">{tGlobal.has('kitchen.Closed') ? tGlobal('kitchen.Closed') : 'Kapalı Mutfak'}</option>
                                <option value="Açık Mutfak">{tGlobal.has('kitchen.Open') ? tGlobal('kitchen.Open') : 'Açık Mutfak'}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>{t.has('view') ? t('view') : 'Manzara'}</Label>
                            <select
                                name="view"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                defaultValue={searchParams.get('view') || ''}
                            >
                                <option value="">{t.has('all') ? t('all') : 'Tümü'}</option>
                                <option value="Deniz">{tGlobal.has('views.Sea') ? tGlobal('views.Sea') : 'Deniz'}</option>
                                <option value="Doğa">{tGlobal.has('views.Nature') ? tGlobal('views.Nature') : 'Doğa'}</option>
                                <option value="Şehir">{tGlobal.has('views.City') ? tGlobal('views.City') : 'Şehir'}</option>
                                <option value="Havuz">{tGlobal.has('views.Pool') ? tGlobal('views.Pool') : 'Havuz'}</option>
                                <option value="Park">{tGlobal.has('views.Park') ? tGlobal('views.Park') : 'Park'}</option>
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
