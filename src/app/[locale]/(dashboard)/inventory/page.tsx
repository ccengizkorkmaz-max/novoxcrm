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
import { formatCurrency } from '@/lib/utils'
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
        query = query.eq('floor', Number(params.floor))
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
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <div className="flex gap-2">
                    <InventoryFilters projects={projects || []} />

                    <NewUnitDialog projects={projects || []} />
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
                            <Badge key={key} variant="secondary" className="px-2 py-1">
                                {label}: {value === 'true' ? 'Var' : value}
                            </Badge>
                        )
                    })}
                    <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                        <Link href="/inventory">{t('clean')}</Link>
                    </Button>
                </div>
            )}

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-left sticky left-0 bg-background z-20 shadow-[10px_0_10px_-10px_rgba(0,0,0,0.1)]">{t('table.actions')}</TableHead>
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
                            <TableHead className="min-w-[120px]">{t('table.price')}</TableHead>
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
                                <TableRow key={unit.id}>
                                    <TableCell className="text-left sticky left-0 bg-background z-20 shadow-[10px_0_10px_-10px_rgba(0,0,0,0.1)]">
                                        <InventoryActions unit={unit} customers={customers || []} />
                                    </TableCell>
                                    <TableCell className="font-medium">{unit.projects?.name}</TableCell>
                                    <TableCell>{unit.block || '-'}</TableCell>
                                    <TableCell>{unit.unit_number}</TableCell>
                                    <TableCell>
                                        <Badge variant={unit.status === 'Sold' ? 'destructive' : unit.status === 'Reserved' ? 'secondary' : 'default'} className={unit.status === 'For Sale' ? 'bg-green-600' : ''}>
                                            {t(`status.${statusMap[unit.status] || unit.status}`)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{unit.type}</TableCell>
                                    <TableCell>{unit.unit_category || '-'}</TableCell>
                                    <TableCell>{unit.floor}</TableCell>
                                    <TableCell>{unit.direction ? t(`directions.${directionMap[unit.direction] || unit.direction.replace(/\s/g, '')}`) : '-'}</TableCell>
                                    <TableCell>{unit.view ? t(`views.${viewMap[unit.view] || unit.view}`) : '-'}</TableCell>
                                    <TableCell>{unit.area_gross || '-'}</TableCell>
                                    <TableCell>{unit.area_net || '-'}</TableCell>
                                    <TableCell>{formatCurrency(unit.price, unit.currency)}</TableCell>
                                    <TableCell>{unit.kdv_rate ? `%${unit.kdv_rate}` : '-'}</TableCell>
                                    <TableCell>{unit.max_discount_rate ? `%${unit.max_discount_rate}` : '-'}</TableCell>
                                    <TableCell>{unit.parking_type ? t(`parking.${parkingMap[unit.parking_type] || unit.parking_type}`) : '-'}</TableCell>
                                    <TableCell>{unit.heating_type ? t(`heating.${heatingMap[unit.heating_type] || unit.heating_type}`) : '-'}</TableCell>
                                    <TableCell>{unit.kitchen_type ? t(`kitchen.${kitchenMap[unit.kitchen_type] || unit.kitchen_type}`) : '-'}</TableCell>
                                    <TableCell className="text-center">{unit.has_builtin_kitchen ? '✅' : '-'}</TableCell>
                                    <TableCell className="text-center">{unit.has_master_bathroom ? '✅' : '-'}</TableCell>
                                    <TableCell>{unit.ada_no || '-'}</TableCell>
                                    <TableCell>{unit.parsel_no || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={22} className="h-24 text-center">
                                    {t('table.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
