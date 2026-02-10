import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UnitEditForm } from '@/components/unit-edit-form'
import { Toaster } from 'sonner'
import { DeleteUnitButton } from '@/components/delete-unit-button'
import { BackButton } from '@/components/back-button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { AlertCircle, HardHat, TrendingUp } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { getUnitImages, getUnitTimeline } from '../actions'
import { getUnitDocuments, getUnitNotes } from '../unit-details-actions'
import { UnitImageGallery } from './components/UnitImageGallery'
import { UnitTimeline } from './components/UnitTimeline'
import { UnitStatusChanger } from './components/UnitStatusChanger'
import { UnitPriceChart } from './components/UnitPriceChart'
import { UnitDocuments } from './components/UnitDocuments'
import { UnitNotes } from './components/UnitNotes'

export default async function UnitDetailPage(props: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = await props.params
    const supabase = await createClient()

    // Fetch unit with project name
    const { data: unit } = await supabase
        .from('units')
        .select('*, projects(name)')
        .eq('id', id)
        .single()

    if (!unit) return <div>Ünite bulunamadı.</div>

    // Fetch contract info if unit is sold
    const { data: contract } = unit.status === 'Sold'
        ? await supabase
            .from('contracts')
            .select('contract_number, contract_date, status')
            .eq('unit_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        : { data: null }

    // Fetch construction stages for the unit's project
    const { data: stages } = await supabase
        .from('construction_stages')
        .select('*')
        .eq('project_id', unit.project_id)
        .order('order_index', { ascending: true })

    // Fetch progress for this unit
    const { data: progress } = await supabase
        .from('unit_construction_progress')
        .select('*')
        .eq('unit_id', id)

    // Calculate weighted progress
    let unitProgressPercentage = 0
    if (stages && stages.length > 0) {
        let totalWeight = stages.reduce((acc: number, s: any) => acc + (s.weight || 0), 0)
        if (totalWeight > 0) {
            let weightedSum = 0
            stages.forEach((s: any) => {
                const item = progress?.find((p: any) => p.stage_id === s.id)
                weightedSum += ((item?.completion_percentage || 0) * (s.weight || 0)) / totalWeight
            })
            unitProgressPercentage = Math.round(weightedSum)
        }
    }

    // Fetch unit images
    const images = await getUnitImages(id)

    // Fetch unit timeline (activity log + negotiations)
    const timeline = await getUnitTimeline(id)

    // Fetch documents & notes
    const documents = await getUnitDocuments(id)
    const notes = await getUnitNotes(id)

    // Calculate price per m²
    const pricePerM2 = unit.area_gross ? Math.round(unit.price / unit.area_gross) : null

    // Days on market
    const listedDate = new Date(unit.listed_at || unit.created_at)
    const daysOnMarket = Math.floor((new Date().getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24))

    const isSold = unit.status === 'Sold'
    const isBlocked = unit.status === 'Blocked'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BackButton href="/inventory" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Ünite Kartı: {unit.unit_number}</h1>
                            <Badge variant={
                                unit.status === 'Sold' ? 'destructive' :
                                    unit.status === 'Reserved' ? 'secondary' :
                                        unit.status === 'Blocked' ? 'outline' :
                                            unit.status === 'Option' ? 'secondary' :
                                                unit.status === 'Rented' ? 'secondary' :
                                                    unit.status === 'Delivered' ? 'default' :
                                                        'default'
                            } className={
                                unit.status === 'For Sale' ? 'bg-emerald-600 text-white' :
                                    unit.status === 'Blocked' ? 'bg-slate-600 text-white' :
                                        unit.status === 'Option' ? 'bg-violet-600 text-white' :
                                            unit.status === 'Rented' ? 'bg-cyan-600 text-white' :
                                                unit.status === 'Delivered' ? 'bg-green-800 text-white' :
                                                    ''
                            }>
                                {unit.status === 'For Sale' ? 'SATIŞTA' :
                                    unit.status === 'Sold' ? 'SATILDI' :
                                        unit.status === 'Reserved' ? 'REZERVE' :
                                            unit.status === 'Blocked' ? 'BLOKE' :
                                                unit.status === 'Option' ? 'OPSİYON' :
                                                    unit.status === 'Rented' ? 'KİRADA' :
                                                        unit.status === 'Delivered' ? 'TESLİM EDİLDİ' :
                                                            unit.status}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground">{unit.projects?.name} - {unit.type}</p>
                        {isSold && contract && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Sözleşme: <span className="font-semibold">{contract.contract_number}</span> •
                                Tarih: <span className="font-semibold">{format(new Date(contract.contract_date), 'dd MMM yyyy', { locale: tr })}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        asChild
                        variant="default"
                        disabled={isSold || unit.status === 'Reserved'}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Link href={isSold || unit.status === 'Reserved' ? '#' : `/crm?newSale=true&unitId=${unit.id}&projectId=${unit.project_id}`}>
                            Satış Başlat
                        </Link>
                    </Button>
                    <DeleteUnitButton unitId={unit.id} projectId={unit.project_id} disabled={isSold} />
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Fiyat</p>
                        <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(unit.price, unit.currency)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">m² Birim Fiyat</p>
                        <p className="text-lg font-black text-slate-900 mt-1">
                            {pricePerM2 ? formatCurrency(pricePerM2, unit.currency) : '-'}
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Brüt / Net Alan</p>
                        <p className="text-lg font-black text-slate-900 mt-1">
                            {unit.area_gross || '-'} / {unit.area_net || '-'} m²
                        </p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="pt-4 pb-3">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Stokta Kalma
                        </p>
                        <p className="text-lg font-black text-slate-900 mt-1">
                            {daysOnMarket} gün
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Edit Form & Documents */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <UnitEditForm unit={unit} disabled={isSold} />
                    </Card>
                    <UnitDocuments unitId={unit.id} documents={documents as any[]} />
                </div>

                {/* Right sidebar */}
                <div className="space-y-6">
                    {/* Status Changer */}
                    <UnitStatusChanger unitId={unit.id} currentStatus={unit.status} />

                    {/* Price History Chart */}
                    <UnitPriceChart
                        priceHistory={timeline.filter((t: any) => t.type === 'price_change' && t.oldValue && t.newValue)}
                        currentPrice={unit.price}
                        currency={unit.currency || 'TRY'}
                    />

                    {/* Image Gallery */}
                    <UnitImageGallery
                        unitId={unit.id}
                        projectId={unit.project_id}
                        images={images}
                        disabled={isSold}
                    />

                    {/* Construction Progress Card */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <HardHat className="h-4 w-4 text-primary" />
                                İnşaat İlerlemesi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-2xl font-bold">%{unitProgressPercentage}</span>
                                    <span className="text-xs text-muted-foreground">Genel Tamamlanma</span>
                                </div>
                                <Progress value={unitProgressPercentage} className="h-2" />

                                <div className="space-y-2 pt-2">
                                    {stages?.map((stage: any) => {
                                        const p = progress?.find((item: any) => item.stage_id === stage.id)
                                        return (
                                            <div key={stage.id} className="flex flex-col gap-1">
                                                <div className="flex justify-between text-[11px]">
                                                    <span className="text-muted-foreground">{stage.name}</span>
                                                    <span className="font-medium">%{p?.completion_percentage || 0}</span>
                                                </div>
                                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary/60"
                                                        style={{ width: `${p?.completion_percentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {(!stages || stages.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic text-center py-4">
                                            İnşaat aşamaları henüz tanımlanmamış.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Internal Notes */}
                    <UnitNotes unitId={unit.id} notes={notes as any[]} />

                    {/* Unit Timeline */}
                    <UnitTimeline timeline={timeline} />

                    {isSold && (
                        <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                            <p className="text-sm text-amber-800">
                                Bu ünite satılmış durumdadır. Sözleşme nedeniyle düzenleme ve silme işlemleri yapılamaz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
            <Toaster />
        </div>
    )
}
