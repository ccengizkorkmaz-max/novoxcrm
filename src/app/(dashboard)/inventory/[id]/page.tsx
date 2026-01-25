import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { UnitEditForm } from '@/components/unit-edit-form'
import { Toaster } from 'sonner'
import { DeleteUnitButton } from '@/components/delete-unit-button'
import { BackButton } from '@/components/back-button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { AlertCircle } from 'lucide-react'

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

            {isSold && (
                <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                        Bu ünite satılmış durumdadır. Sözleşme nedeniyle düzenleme ve silme işlemleri yapılamaz.
                    </p>
                </div>
            )}

            <UnitEditForm unit={unit} disabled={isSold} />
            <Toaster />
        </div>
    )
}
