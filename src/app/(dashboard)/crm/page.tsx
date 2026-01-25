import { createClient } from '@/lib/supabase/server'
import PipelineList from './components/PipelineList'
import PipelineStats from './components/PipelineStats'


import NewSaleButton from './components/NewSaleButton'

export default async function CRMPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const supabase = await createClient()
    const params = await searchParams

    // Fetch Customers with Demands
    const { data: customers } = await supabase.from('customers').select('*, customer_demands(*)').order('created_at', { ascending: false })

    // Fetch Sales/Deals
    const { data: sales } = await supabase
        .from('sales')
        .select('*, customers(full_name), units(unit_number, price, currency, projects(name))')
        .order('created_at', { ascending: false })


    // For the create sale dialog - exclude sold units
    const { data: availableUnits } = await supabase
        .from('units')
        .select('id, unit_number, projects(id, name)')
        .in('status', ['For Sale', 'Stock'])

    // Fetch Payment Plan Templates
    const { data: templates } = await supabase.from('payment_plan_templates').select('*').order('name', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div className="sticky top-0 z-20 bg-background/95 backdrop-blur pb-2 pt-1 border-b mb-2">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold tracking-tight">CRM & Satış Yönetimi</h1>
                    <NewSaleButton
                        customers={customers || []}
                        availableUnits={availableUnits || []}
                        initialState={{
                            openNewSale: params.newSale === 'true',
                            unitId: params.unitId as string,
                            projectId: params.projectId as string
                        }}
                    />
                </div>

                <PipelineStats sales={sales || []} />
            </div>

            <PipelineList
                sales={sales || []}
                customers={customers || []}
                availableUnits={availableUnits || []}
                templates={templates || []}
            />
        </div >
    )
}
