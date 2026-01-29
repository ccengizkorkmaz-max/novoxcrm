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
import { AlertCircle, HardHat } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

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
        let totalWeight = stages.reduce((acc, s) => acc + (s.weight || 0), 0)
        if (totalWeight > 0) {
            let weightedSum = 0
            stages.forEach(s => {
                const item = progress?.find(p => p.stage_id === s.id)
                weightedSum += ((item?.completion_percentage || 0) * (s.weight || 0)) / totalWeight
            })
            unitProgressPercentage = Math.round(weightedSum)
        }
    }

    const isSold = unit.status === 'Sold'

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BackButton href="/inventory" />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight">Ünite Kartı: {unit.unit_number}</h1>
                            {isSold && <Badge variant="destructive">SATILDI</Badge>}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <UnitEditForm unit={unit} disabled={isSold} />
                </Card>

                <div className="space-y-6">
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
                                    {stages?.map(stage => {
                                        const p = progress?.find(item => item.stage_id === stage.id)
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
