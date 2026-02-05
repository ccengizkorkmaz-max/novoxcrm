import { Suspense } from 'react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { NewUnitDialog } from '@/components/new-unit-dialog'
import { InventoryStats } from './components/inventory-stats'
import { InventoryFilters } from '@/components/inventory-filters'
import { formatCurrency, cn } from '@/lib/utils'
import { InventoryActions } from './components/inventory-actions'


export default async function InventoryPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const supabase = await createClient()
    const params = await searchParams

    // Get projects for filter dropdown
    const { data: projects } = await supabase.from('projects').select('id, name')

    // Get customers for reservation
    const { data: customers } = await supabase.from('customers').select('id, full_name').order('full_name', { ascending: true })

    // Get unit types
    const { data: unitTypes } = await supabase.from('unit_types').select('*').order('order_index', { ascending: true })


    // Build query
    let query = supabase.from('units').select('*, projects(name)').order('unit_number', { ascending: true })

    if (params.project && params.project !== 'all') {
        query = query.eq('project_id', params.project)
    }
    if (params.block) {
        query = query.ilike('block', `%${params.block}%`)
    }
    if (params.unit_category) {
        query = query.eq('unit_category', params.unit_category)
    }
    if (params.type) {
        query = query.eq('type', params.type)
    }
    if (params.status) {
        query = query.eq('status', params.status)
    }
    if (params.min_price) {
        query = query.gte('price', Number(params.min_price))
    }
    if (params.max_price) {
        query = query.lte('price', Number(params.max_price))
    }
    if (params.min_area) {
        query = query.gte('area_gross', Number(params.min_area))
    }
    if (params.max_area) {
        query = query.lte('area_gross', Number(params.max_area))
    }
    if (params.floor) {
        query = query.eq('floor', params.floor)
    }
    if (params.direction) {
        query = query.eq('direction', params.direction)
    }
    if (params.parking_type) {
        query = query.eq('parking_type', params.parking_type)
    }
    if (params.heating_type) {
        query = query.eq('heating_type', params.heating_type)
    }
    if (params.kitchen_type) {
        query = query.eq('kitchen_type', params.kitchen_type)
    }
    if (params.view) {
        query = query.ilike('view', `%${params.view}%`)
    }
    if (params.has_master_bathroom === 'true') {
        query = query.eq('has_master_bathroom', true)
    }
    if (params.has_builtin_kitchen === 'true') {
        query = query.eq('has_builtin_kitchen', true)
    }

    const t = await getTranslations('Inventory')
    const { data: units } = await query

    // Helper maps for DB values to Translation Keys
    const directionMap: Record<string, string> = {
        'Kuzey': 'North',
        'Güney': 'South',
        'Doğu': 'East',
        'Batı': 'West',
        'Kuzey Doğu': 'NorthEast',
        'Kuzey Batı': 'NorthWest',
        'Güney Doğu': 'SouthEast',
        'Güney Batı': 'SouthWest'
    }

    const viewMap: Record<string, string> = {
        'Deniz': 'Sea',
        'Doğa': 'Nature',
        'Şehir': 'City',
        'Havuz': 'Pool',
        'Park': 'Park'
    }

    const statusMap: Record<string, string> = {
        'Satılık': 'ForSale',
        'Rezerve': 'Reserved',
        'Satıldı': 'Sold',
        'For Sale': 'ForSale',
        'Reserved': 'Reserved',
        'Sold': 'Sold'
    }

    const heatingMap: Record<string, string> = {
        'Kombi': 'Combi',
        'Merkezi Sistem': 'Central',
        'Yerden Isıtma': 'Floor',
        'Kombi Yerden Isıtma': 'CombiFloor',
        'Klima': 'AC'
    }

    const kitchenMap: Record<string, string> = {
        'Kapalı Mutfak': 'Closed',
        'Açık Mutfak': 'Open'
    }

    const parkingMap: Record<string, string> = {
        'Kapalı Otopark': 'Indoor',
        'Açık Otopark': 'Outdoor',
        'Yok': 'None'
    }

    return (
        <div className="flex flex-col gap-6 w-full overflow-hidden">
            <InventoryStats units={units || []} />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">{t('title')}</h1>
                <div className="flex items-center gap-2">
                    <InventoryFilters projects={projects || []} />
                    <NewUnitDialog projects={projects || []} unitTypes={unitTypes || []} />
                </div>
            </div>


            {Object.keys(params).length > 0 && Object.keys(params).some(k => params[k] && k !== 'tab') && (
                <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-sm text-muted-foreground mr-2">{t('activeFilters')}:</span>
                    {Object.entries(params).map(([key, value]) => {
                        if (!value || key === 'tab') return null
                        let label = key
                        if (key === 'project') label = t('filters.project')
                        if (key === 'block') label = t('filters.block')
                        if (key === 'unit_category') label = t('filters.unitCategory')
                        if (key === 'status') label = t('filters.status')
                        if (key === 'min_price') label = t('filters.min') + ' ' + t('table.price')
                        if (key === 'max_price') label = t('filters.max') + ' ' + t('table.price')
                        if (key === 'min_area') label = t('filters.min') + ' ' + t('table.grossArea')
                        if (key === 'max_area') label = t('filters.max') + ' ' + t('table.grossArea')
                        if (key === 'floor') label = t('filters.floor')
                        if (key === 'direction') label = t('filters.direction')
                        if (key === 'parking_type') label = t('filters.parking')
                        if (key === 'heating_type') label = t('filters.heating')
                        if (key === 'kitchen_type') label = t('filters.kitchen')
                        if (key === 'view') label = t('filters.view')
                        if (key === 'has_master_bathroom') label = t('filters.features.masterBath')
                        if (key === 'has_builtin_kitchen') label = t('filters.features.builtinKitchen')

                        return (
                            <Badge key={key} variant="secondary" className="px-2 py-1 text-[10px] md:text-xs">
                                {label}: {value === 'true' ? 'Var' : value}
                            </Badge>
                        )
                    })}
                    <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[10px]">
                        <Link href="/inventory">{t('clean')}</Link>
                    </Button>
                </div>
            )}

            {/* Desktop View */}
            <div className="hidden md:block relative group">
                <div className="rounded-xl border bg-card overflow-x-auto max-w-full">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="text-left sticky left-0 bg-background/95 backdrop-blur z-20 shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)]">{t('table.actions')}</TableHead>
                                <TableHead className="min-w-[150px]">{t('table.project')}</TableHead>
                                <TableHead>{t('table.block')}</TableHead>
                                <TableHead className="min-w-[100px]">{t('table.unitNo')}</TableHead>
                                <TableHead className="min-w-[100px]">{t('table.status')}</TableHead>
                                <TableHead>{t('table.roomType')}</TableHead>
                                <TableHead className="min-w-[120px]">{t('table.category')}</TableHead>
                                <TableHead>{t('table.floor')}</TableHead>
                                <TableHead className="min-w-[100px]">{t('table.direction')}</TableHead>
                                <TableHead className="min-w-[100px]">{t('table.view')}</TableHead>
                                <TableHead>{t('table.grossArea')}</TableHead>
                                <TableHead>{t('table.netArea')}</TableHead>
                                <TableHead className="min-w-[120px] font-bold">{t('table.price')}</TableHead>
                                <TableHead>{t('table.vat')}</TableHead>
                                <TableHead>{t('table.discount')}</TableHead>
                                <TableHead className="min-w-[120px]">{t('table.parking')}</TableHead>
                                <TableHead className="min-w-[120px]">{t('table.heating')}</TableHead>
                                <TableHead className="min-w-[120px]">{t('table.kitchen')}</TableHead>
                                <TableHead className="text-center">{t('table.builtin')}</TableHead>
                                <TableHead className="text-center">{t('table.masterBath')}</TableHead>
                                <TableHead>{t('table.ada')}</TableHead>
                                <TableHead>{t('table.parsel')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {units && units.length > 0 ? (
                                units.map((unit: any) => (
                                    <TableRow key={unit.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell className="text-left sticky left-0 bg-background/95 backdrop-blur z-20 shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)]">
                                            <InventoryActions unit={unit} customers={customers || []} />
                                        </TableCell>
                                        <TableCell className="font-medium">{unit.projects?.name}</TableCell>
                                        <TableCell>{unit.block || '-'}</TableCell>
                                        <TableCell className="font-mono font-bold">{unit.unit_number}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={unit.status === 'Sold' ? 'destructive' : unit.status === 'Reserved' ? 'secondary' : 'default'} className={cn("text-[10px] px-2 py-0", unit.status === 'For Sale' ? 'bg-green-600' : '')}>
                                                    {statusMap[unit.status] ? t(`status.${statusMap[unit.status]}`) : unit.status}
                                                </Badge>
                                                {unit.is_legacy && (
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-300 text-slate-500 whitespace-nowrap">
                                                        Eski Kayıt
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{unit.type}</TableCell>
                                        <TableCell>{unit.unit_category || '-'}</TableCell>
                                        <TableCell>{unit.floor}</TableCell>
                                        <TableCell>{unit.direction ? (directionMap[unit.direction] ? t(`directions.${directionMap[unit.direction]}`) : unit.direction) : '-'}</TableCell>
                                        <TableCell>{unit.view ? (viewMap[unit.view] ? t(`views.${viewMap[unit.view]}`) : unit.view) : '-'}</TableCell>
                                        <TableCell className="font-mono">{unit.area_gross || '-'}</TableCell>
                                        <TableCell className="font-mono">{unit.area_net || '-'}</TableCell>
                                        <TableCell className="font-bold text-slate-900">{formatCurrency(unit.price, unit.currency)}</TableCell>
                                        <TableCell>{unit.kdv_rate ? `%${unit.kdv_rate}` : '-'}</TableCell>
                                        <TableCell>{unit.max_discount_rate ? `%${unit.max_discount_rate}` : '-'}</TableCell>
                                        <TableCell>{unit.parking_type ? t(`parking.${parkingMap[unit.parking_type] || unit.parking_type}`) : '-'}</TableCell>
                                        <TableCell>{unit.heating_type ? t(`heating.${heatingMap[unit.heating_type] || unit.heating_type}`) : '-'}</TableCell>
                                        <TableCell>{unit.kitchen_type ? t(`kitchen.${kitchenMap[unit.kitchen_type] || unit.kitchen_type}`) : '-'}</TableCell>
                                        <TableCell className="text-center">{unit.has_builtin_kitchen ? '✅' : '-'}</TableCell>
                                        <TableCell className="text-center">{unit.has_master_bathroom ? '✅' : '-'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{unit.ada_no || '-'}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{unit.parsel_no || '-'}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={22} className="h-32 text-center text-muted-foreground">
                                        {t('table.empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Mobile View */}
            <div className="flex flex-col gap-4 md:hidden">
                {units && units.length > 0 ? (
                    units.map((unit: any) => (
                        <div key={unit.id} className="rounded-xl border bg-card p-4 shadow-sm space-y-4 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight mb-1">{unit.projects?.name}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-slate-900">{unit.block} / {unit.unit_number}</span>
                                        <Badge variant={unit.status === 'Sold' ? 'destructive' : unit.status === 'Reserved' ? 'secondary' : 'default'} className={cn("text-[9px] px-1.5 py-0", unit.status === 'For Sale' ? 'bg-green-600' : '')}>
                                            {statusMap[unit.status] ? t(`status.${statusMap[unit.status]}`) : unit.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight block mb-1">{t('table.price')}</span>
                                    <span className="font-bold text-blue-600 font-mono">{formatCurrency(unit.price, unit.currency)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-y-3 text-[11px] pb-3 border-b border-slate-50">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.roomType')}</span>
                                    <span className="font-medium">{unit.type}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.floor')}</span>
                                    <span className="font-medium text-center">{unit.floor}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.grossArea')}</span>
                                    <span className="font-medium font-mono">{unit.area_gross} m²</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.direction')}</span>
                                    <span className="font-medium truncate">{unit.direction ? (directionMap[unit.direction] ? t(`directions.${directionMap[unit.direction]}`) : unit.direction) : '-'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.view')}</span>
                                    <span className="font-medium truncate">{unit.view ? (viewMap[unit.view] ? t(`views.${viewMap[unit.view]}`) : unit.view) : '-'}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 text-right">
                                    <span className="text-muted-foreground text-[9px] uppercase font-bold">{t('table.category')}</span>
                                    <span className="font-medium truncate">{unit.unit_category}</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex gap-4">
                                    {unit.has_builtin_kitchen && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
                                            <span>🍳</span> {t('table.builtin')}
                                        </div>
                                    )}
                                    {unit.has_master_bathroom && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
                                            <span>🚿</span> {t('table.masterBath')}
                                        </div>
                                    )}
                                </div>
                                <InventoryActions unit={unit} customers={customers || []} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-card border rounded-xl p-12 text-center text-muted-foreground">
                        {t('table.empty')}
                    </div>
                )}
            </div>
        </div>
    )
}
