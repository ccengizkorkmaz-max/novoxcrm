import { Suspense } from 'react'
import Link from 'next/link'
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

    const { data: units } = await query

    return (
        <div className="flex flex-col gap-6">
            <InventoryStats units={units || []} />
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold tracking-tight">Stok Yönetimi</h1>
                <div className="flex gap-2">
                    <InventoryFilters projects={projects || []} />

                    <NewUnitDialog projects={projects || []} />
                </div>
            </div>


            {Object.keys(params).length > 0 && Object.keys(params).some(k => params[k] && k !== 'tab') && (
                <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-sm text-muted-foreground mr-2">Aktif Filtreler:</span>
                    {Object.entries(params).map(([key, value]) => {
                        if (!value || key === 'tab') return null
                        let label = key
                        if (key === 'project') label = 'Proje'
                        if (key === 'block') label = 'Blok'
                        if (key === 'unit_category') label = 'Tür'
                        if (key === 'status') label = 'Durum'
                        if (key === 'min_price') label = 'Min Fiyat'
                        if (key === 'max_price') label = 'Max Fiyat'
                        if (key === 'min_area') label = 'Min m²'
                        if (key === 'max_area') label = 'Max m²'
                        if (key === 'floor') label = 'Kat'
                        if (key === 'direction') label = 'Cephe'
                        if (key === 'parking_type') label = 'Otopark'
                        if (key === 'heating_type') label = 'Isıtma'
                        if (key === 'kitchen_type') label = 'Mutfak'
                        if (key === 'view') label = 'Manzara'
                        if (key === 'has_master_bathroom') label = 'Ebeveyn Ban.'
                        if (key === 'has_builtin_kitchen') label = 'Ankastre'

                        return (
                            <Badge key={key} variant="secondary" className="px-2 py-1">
                                {label}: {value === 'true' ? 'Var' : value}
                            </Badge>
                        )
                    })}
                    <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                        <Link href="/inventory">Temizle</Link>
                    </Button>
                </div>
            )}

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-left sticky left-0 bg-background z-20 shadow-[10px_0_10px_-10px_rgba(0,0,0,0.1)]">İşlemler</TableHead>
                            <TableHead className="min-w-[150px]">Proje</TableHead>
                            <TableHead>Blok</TableHead>
                            <TableHead className="min-w-[100px]">Kapı No</TableHead>
                            <TableHead className="min-w-[100px]">Durum</TableHead>
                            <TableHead>Oda Tipi</TableHead>
                            <TableHead className="min-w-[120px]">Ünite Türü</TableHead>
                            <TableHead>Kat</TableHead>
                            <TableHead className="min-w-[100px]">Cephe</TableHead>
                            <TableHead className="min-w-[100px]">Manzara</TableHead>
                            <TableHead>Brüt m²</TableHead>
                            <TableHead>Net m²</TableHead>
                            <TableHead className="min-w-[120px]">Fiyat</TableHead>
                            <TableHead>KDV (%)</TableHead>
                            <TableHead>İskonto (%)</TableHead>
                            <TableHead className="min-w-[120px]">Otopark</TableHead>
                            <TableHead className="min-w-[120px]">Isıtma</TableHead>
                            <TableHead className="min-w-[120px]">Mutfak</TableHead>
                            <TableHead className="text-center">Ankastre</TableHead>
                            <TableHead className="text-center">Ebv. Banyo</TableHead>
                            <TableHead>Ada No</TableHead>
                            <TableHead>Parsel No</TableHead>
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
                                            {unit.status === 'For Sale' ? 'Satılık' : unit.status === 'Reserved' ? 'Rezerve' : unit.status === 'Sold' ? 'Satıldı' : unit.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{unit.type}</TableCell>
                                    <TableCell>{unit.unit_category || '-'}</TableCell>
                                    <TableCell>{unit.floor}</TableCell>
                                    <TableCell>{unit.direction || '-'}</TableCell>
                                    <TableCell>{unit.view || '-'}</TableCell>
                                    <TableCell>{unit.area_gross || '-'}</TableCell>
                                    <TableCell>{unit.area_net || '-'}</TableCell>
                                    <TableCell>{formatCurrency(unit.price, unit.currency)}</TableCell>
                                    <TableCell>{unit.kdv_rate ? `%${unit.kdv_rate}` : '-'}</TableCell>
                                    <TableCell>{unit.max_discount_rate ? `%${unit.max_discount_rate}` : '-'}</TableCell>
                                    <TableCell>{unit.parking_type || '-'}</TableCell>
                                    <TableCell>{unit.heating_type || '-'}</TableCell>
                                    <TableCell>{unit.kitchen_type || '-'}</TableCell>
                                    <TableCell className="text-center">{unit.has_builtin_kitchen ? '✅' : '-'}</TableCell>
                                    <TableCell className="text-center">{unit.has_master_bathroom ? '✅' : '-'}</TableCell>
                                    <TableCell>{unit.ada_no || '-'}</TableCell>
                                    <TableCell>{unit.parsel_no || '-'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={22} className="h-24 text-center">
                                    Kayıt bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
