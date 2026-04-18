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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Image as ImageIcon, History, ClipboardList, Info } from 'lucide-react'

export default async function UnitDetailPage(props: {
    params: Promise<{ locale: string; id: string }>
}) {
    const { locale, id } = await props.params
    const supabase = await createClient()

    // Get user role
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner'

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

    const statusConfig = {
        'Sold': { label: 'SATILDI', color: 'bg-rose-500', variant: 'destructive' },
        'Reserved': { label: 'REZERVE', color: 'bg-amber-500', variant: 'secondary' },
        'Option': { label: 'OPSİYON', color: 'bg-violet-500', variant: 'secondary' },
        'Blocked': { label: 'BLOKE', color: 'bg-slate-500', variant: 'outline' },
        'Rented': { label: 'KİRADA', color: 'bg-cyan-600', variant: 'secondary' },
        'Delivered': { label: 'TESLİM EDİLDİ', color: 'bg-emerald-700', variant: 'default' },
        'For Sale': { label: 'SATIŞTA', color: 'bg-emerald-600', variant: 'default' },
    } as any

    const status = statusConfig[unit.status] || { label: unit.status, color: 'bg-slate-400', variant: 'outline' }

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
            {/* COMPACT BREADCRUMB & HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <BackButton href="/inventory" />
                    <div className="h-10 w-[1px] bg-slate-200 hidden md:block" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">Ünite {unit.unit_number}</h1>
                            <Badge className={`${status.color} text-white border-none px-2 py-0.5 text-[10px] font-bold`}>
                                {status.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground font-medium">
                            <span className="text-slate-900">{unit.projects?.name}</span>
                            <span>•</span>
                            <span>{unit.type}</span>
                            {isSold && contract && (
                                <>
                                    <span>•</span>
                                    <span className="text-rose-600 font-bold">
                                        Sözleşme: {contract.contract_number} ({format(new Date(contract.contract_date), 'dd MMM yyyy', { locale: tr })})
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        asChild
                        variant="default"
                        size="sm"
                        disabled={isSold || unit.status === 'Reserved'}
                        className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs"
                    >
                        <Link href={isSold || unit.status === 'Reserved' ? '#' : `/crm?newSale=true&unitId=${unit.id}&projectId=${unit.project_id}`}>
                            Hızlı Satış
                        </Link>
                    </Button>
                    {isManager && (
                        <DeleteUnitButton unitId={unit.id} projectId={unit.project_id} disabled={isSold} />
                    )}
                </div>
            </div>

            {/* QUICK STATS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Fiyat', value: formatCurrency(unit.price, unit.currency), sub: unit.currency, color: 'text-blue-600' },
                    { label: 'Birim Fiyat', value: pricePerM2 ? formatCurrency(pricePerM2, unit.currency) : '-', sub: 'm² başı', color: 'text-slate-600' },
                    { label: 'Brüt / Net', value: `${unit.area_gross || '-'} / ${unit.area_net || '-'}`, sub: 'm²', color: 'text-emerald-600' },
                    { label: 'Pazarda', value: `${daysOnMarket} Gün`, sub: 'Aktif Süre', color: 'text-amber-600' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-3 rounded-xl border shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-lg font-black tracking-tight ${stat.color}`}>{stat.value.split(' ')[0]}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{stat.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-6">
                    <Card className="rounded-xl overflow-hidden shadow-sm border">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-500" />
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">Ünite Detayları & Özellikler</h3>
                        </div>
                        <UnitEditForm unit={unit} disabled={isSold || !isManager} />
                    </Card>

                    {isSold && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p className="font-medium">Bu ünite satılmıştır. Kayıtlar üzerinde değişiklik yapılamaz.</p>
                        </div>
                    )}
                </div>

                <div className="xl:col-span-4 space-y-6">
                    {isManager && (
                        <UnitStatusChanger unitId={unit.id} currentStatus={unit.status} isLegacy={unit.is_legacy} />
                    )}

                    <UnitPriceChart
                        priceHistory={timeline.filter((t: any) => t.type === 'price_change' && t.oldValue && t.newValue)}
                        currentPrice={unit.price}
                        currency={unit.currency || 'TRY'}
                    />

                    <Card className="rounded-xl border shadow-sm overflow-hidden flex flex-col h-[600px]">
                        <Tabs defaultValue="gallery" className="flex flex-col h-full">
                            <div className="bg-slate-50 border-b overflow-x-auto no-scrollbar">
                                <TabsList className="bg-transparent border-none h-12 w-full justify-start rounded-none px-2 space-x-2">
                                    <TabsTrigger value="gallery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold gap-1.5 h-9">
                                        <ImageIcon className="h-3.5 w-3.5" /> Görsel
                                    </TabsTrigger>
                                    <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold gap-1.5 h-9">
                                        <HardHat className="h-3.5 w-3.5" /> İnşaat
                                    </TabsTrigger>
                                    <TabsTrigger value="files" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold gap-1.5 h-9">
                                        <FileText className="h-3.5 w-3.5" /> Dosya
                                    </TabsTrigger>
                                    <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold gap-1.5 h-9">
                                        <History className="h-3.5 w-3.5" /> Kayıt
                                    </TabsTrigger>
                                    <TabsTrigger value="notes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg text-xs font-bold gap-1.5 h-9">
                                        <ClipboardList className="h-3.5 w-3.5" /> Not
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-auto p-4">
                                <TabsContent value="gallery" className="mt-0">
                                    <UnitImageGallery unitId={unit.id} projectId={unit.project_id} images={images} disabled={isSold || !isManager} />
                                </TabsContent>

                                <TabsContent value="progress" className="mt-0 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase">İnşaat İlerlemesi</h4>
                                        <Badge variant="secondary" className="text-[10px]">%{unitProgressPercentage}</Badge>
                                    </div>
                                    <Progress value={unitProgressPercentage} className="h-1.5" />
                                    <div className="space-y-3 pt-3">
                                        {stages?.map((stage: any) => {
                                            const p = progress?.find((item: any) => item.stage_id === stage.id)
                                            return (
                                                <div key={stage.id} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between text-[11px] font-medium">
                                                        <span className="text-slate-500">{stage.name}</span>
                                                        <span>%{p?.completion_percentage || 0}</span>
                                                    </div>
                                                    <Progress value={p?.completion_percentage || 0} className="h-1" />
                                                </div>
                                            )
                                        })}
                                        {(!stages || stages.length === 0) && (
                                            <p className="text-xs text-muted-foreground italic text-center py-4">Aşama tanımlanmamış.</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="files" className="mt-0">
                                    <UnitDocuments unitId={unit.id} documents={documents as any[]} />
                                </TabsContent>

                                <TabsContent value="history" className="mt-0">
                                    <UnitTimeline timeline={timeline} />
                                </TabsContent>

                                <TabsContent value="notes" className="mt-0">
                                    <UnitNotes unitId={unit.id} notes={notes as any[]} />
                                </TabsContent>
                            </div>
                        </Tabs>
                    </Card>
                </div>
            </div>
            <Toaster />
        </div>
    )
}
