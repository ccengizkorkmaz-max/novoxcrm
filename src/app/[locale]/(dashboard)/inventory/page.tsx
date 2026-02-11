import { Suspense } from 'react'
import { Link } from '@/i18n/routing'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TabsContent } from '@/components/ui/tabs'

import { NewUnitDialog } from '@/components/new-unit-dialog'
import { InventoryStats } from './components/inventory-stats'
import { InventoryFilters } from '@/components/inventory-filters'
import { BulkPriceUpdate } from './components/BulkPriceUpdate'
import { BulkStatusUpdate } from './components/BulkStatusUpdate'
import { formatCurrency, cn } from '@/lib/utils'
import { InventoryActions } from './components/inventory-actions'
import { StockAgingReport } from './components/StockAgingReport'
import { SalesVelocityReport } from './components/SalesVelocityReport'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { InventoryExport } from './components/InventoryExport'
import { getStockAgingReport, getSalesVelocityReport } from './stats-actions'
import { FloorPlansTab } from './components/floor-plans/FloorPlansTab'
import { InventoryTabs } from './components/inventory-tabs'
import { InventoryGridView } from '@/components/inventory-grid-view'
import { RealtimeInventoryRefresher } from './components/RealtimeInventoryRefresher'
import { InventoryPdfExport } from './components/InventoryPdfExport'
import { PublicLinkCreator } from './components/PublicLinkCreator'


// Helper component for sortable headers
function SortableHeader({
    column,
    label,
    currentSort,
    currentOrder,
    params,
    className
}: {
    column: string,
    label: string,
    currentSort: string,
    currentOrder: 'asc' | 'desc',
    params: any,
    className?: string
}) {
    const isCurrent = currentSort === column
    const nextOrder = isCurrent && currentOrder === 'asc' ? 'desc' : 'asc'

    // Build URL with preserved filters
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
        if (value && key !== 'sort' && key !== 'order') {
            searchParams.append(key, value as string)
        }
    })
    searchParams.set('sort', column)
    searchParams.set('order', nextOrder)

    return (
        <TableHead className={cn("whitespace-nowrap", className)}>
            <Link
                href={`/inventory?${searchParams.toString()}`}
                className="flex items-center gap-1 hover:text-slate-900 transition-colors group"
            >
                {label}
                {isCurrent ? (
                    currentOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-blue-600" /> : <ChevronDown className="h-3 w-3 text-blue-600" />
                ) : (
                    <ChevronsUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </Link>
        </TableHead>
    )
}


export default async function InventoryPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    const { locale } = await props.params
    const params = await props.searchParams
    const supabase = await createClient()

    // 1. Prepare Unit Query (Synchronous part)
    const sortBy = params.sort || 'unit_number'
    const sortOrder = params.order === 'desc' ? 'desc' : 'asc'

    let query = supabase.from('units').select('*, projects(name)')

    // Apply sorting
    if (sortBy === 'project_name') {
        query = query.order('name', { foreignTable: 'projects', ascending: sortOrder === 'asc' })
    } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    }

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

    // 2. Fetch ALL data in parallel using Promise.all
    // This significantly reduces load time by waiting for the longest request instead of the sum of all requests
    const [
        { data: projects },
        { data: customers },
        { data: unitTypes },
        agingData,
        velocityData,
        t,
        { data: units }
    ] = await Promise.all([
        supabase.from('projects').select('id, name'),
        supabase.from('customers').select('id, full_name').order('full_name', { ascending: true }),
        supabase.from('unit_types').select('*').order('order_index', { ascending: true }),
        getStockAgingReport(),
        getSalesVelocityReport(),
        getTranslations('Inventory'),
        query
    ])

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
        'Sold': 'Sold',
        'Blocked': 'Blocked',
        'Option': 'Option',
        'Rented': 'Rented',
        'Delivered': 'Delivered'
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

    const currentTab = params.tab || 'dashboard'

    // Helper Component for Active Filters
    const ActiveFilters = () => (
        Object.keys(params).length > 0 && Object.keys(params).some(k => params[k] && k !== 'tab') ? (
            <div className="flex gap-2 flex-wrap items-center mb-4">
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

                    let displayValue = value
                    if (key === 'project') {
                        const project = projects?.find(p => p.id === value)
                        displayValue = project ? project.name : value
                    }
                    if (key === 'sort') {
                        label = 'Sıralama'
                        const sortLabels: any = {
                            project_name: t('table.project'),
                            block: t('table.block'),
                            unit_number: t('table.unitNo'),
                            status: t('table.status'),
                            type: t('table.roomType'),
                            unit_category: t('table.category'),
                            floor: t('table.floor'),
                            direction: t('table.direction'),
                            view: t('table.view'),
                            area_gross: t('table.grossArea'),
                            area_net: t('table.netArea'),
                            price: t('table.price')
                        }
                        displayValue = sortLabels[value as string] || value
                    }
                    if (key === 'order') {
                        label = 'Düzen'
                        displayValue = value === 'asc' ? 'Artan' : 'Azalan'
                    }

                    return (
                        <Badge key={key} variant="secondary" className="px-2 py-1 text-[10px] md:text-xs">
                            {label}: {displayValue === 'true' ? 'Var' : displayValue}
                        </Badge>
                    )
                })}
                <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[10px]">
                    <Link href={`/inventory?tab=${currentTab}`}>{t('clean')}</Link>
                </Button>
            </div>
        ) : null
    )

    return (
        <div className="flex flex-col gap-6 w-full h-[calc(100vh-120px)] overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <div className="flex items-center gap-2 flex-wrap">

                    <PublicLinkCreator unitIds={units?.map(u => u.id) || []} unitsCount={units?.length || 0} />
                    <InventoryPdfExport units={units || []} />
                    <InventoryExport projects={projects || []} />
                    <NewUnitDialog projects={projects || []} unitTypes={unitTypes || []} />
                </div>
            </div>

            <RealtimeInventoryRefresher />
            <InventoryTabs defaultValue={currentTab}>

                {/* DASHBOARD TAB */}
                <TabsContent value="dashboard" className="space-y-6">
                    <InventoryStats units={units || []} />
                </TabsContent>

                {/* FORECASTS TAB */}
                <TabsContent value="forecasts" className="h-full overflow-auto space-y-6 pb-20">
                    <SalesVelocityReport data={velocityData} />
                </TabsContent>

                {/* LIST TAB (TABLE VIEW) */}
                <TabsContent value="list" className="flex flex-col h-full overflow-hidden gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="font-medium text-sm text-slate-700">Filtreleme</div>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <BulkStatusUpdate selectedUnits={[]} totalUnits={units?.length || 0} />
                                <BulkPriceUpdate selectedUnits={[]} totalUnits={units?.length || 0} />
                            </div>
                        </div>
                        <InventoryFilters projects={projects || []} />
                    </div>

                    <ActiveFilters />

                    <div className="rounded-xl border bg-card overflow-auto flex-1 shadow-sm relative group">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="text-left sticky left-0 bg-background/95 backdrop-blur z-20 shadow-[5px_0_5px_-5px_rgba(0,0,0,0.1)]">{t('table.actions')}</TableHead>

                                    <SortableHeader column="project_name" label={t('table.project')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="block" label={t('table.block')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="unit_number" label={t('table.unitNo')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="status" label={t('table.status')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="type" label={t('table.roomType')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="unit_category" label={t('table.category')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="floor" label={t('table.floor')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="direction" label={t('table.direction')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="view" label={t('table.view')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="area_gross" label={t('table.grossArea')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="area_net" label={t('table.netArea')} currentSort={sortBy} currentOrder={sortOrder} params={params} />
                                    <SortableHeader column="price" label={t('table.price')} currentSort={sortBy} currentOrder={sortOrder} params={params} className="font-bold" />

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
                                                    <Badge variant={unit.status === 'Sold' ? 'destructive' : unit.status === 'Reserved' ? 'secondary' : 'default'} className={cn("text-[10px] px-2 py-0",
                                                        unit.status === 'For Sale' ? 'bg-green-600' : '',
                                                        unit.status === 'Blocked' ? 'bg-slate-600' : '',
                                                        unit.status === 'Option' ? 'bg-violet-600' : '',
                                                        unit.status === 'Rented' ? 'bg-cyan-600' : '',
                                                        unit.status === 'Delivered' ? 'bg-green-800' : ''
                                                    )}>
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
                </TabsContent>

                {/* GRID TAB (MATRIX VIEW) */}
                <TabsContent value="grid" className="flex flex-col h-full overflow-hidden gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="font-medium text-sm text-slate-700">Filtreleme</div>
                            <div className="flex items-center gap-2 border-l pl-4">
                                <BulkStatusUpdate selectedUnits={[]} totalUnits={units?.length || 0} />
                                <BulkPriceUpdate selectedUnits={[]} totalUnits={units?.length || 0} />
                            </div>
                        </div>
                        <InventoryFilters projects={projects || []} />
                    </div>

                    <ActiveFilters />

                    <div className="flex-1 overflow-auto pr-2">
                        <InventoryGridView units={units || []} />
                    </div>
                </TabsContent>

                {/* PLANS TAB */}
                <TabsContent value="plans" className="space-y-6">
                    <FloorPlansTab projects={projects || []} />
                </TabsContent>

                {/* REPORTS TAB */}
                <TabsContent value="reports" className="space-y-6">
                    <StockAgingReport data={agingData} />
                </TabsContent>
            </InventoryTabs>
        </div>
    )
}
