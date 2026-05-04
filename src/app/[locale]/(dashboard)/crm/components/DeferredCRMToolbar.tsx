import { createClient } from '@/lib/supabase/server'
import CRMFilterSheet from './CRMFilterSheet'
import NewSaleButton from './NewSaleButton'

/**
 * Async server component that fetches heavy dropdown data (1000 customers + 1000 units)
 * and streams via Suspense. This data is only needed for filter and new-sale dialogs,
 * not for the initial page render.
 */
export default async function DeferredCRMToolbar({
    userTenantId,
    isBroker,
    tenantType,
    params
}: {
    userTenantId: string
    isBroker: boolean
    tenantType: string
    params: { [key: string]: string | string[] | undefined }
}) {
    const supabase = await createClient()

    const [
        projectsRes,
        customersRes,
        availableUnitsRes
    ] = await Promise.all([
        supabase.from('projects').select('id, name').order('name'),
        supabase.from('customers')
            .select('*, customer_demands(*), contract_customers(id)')
            .eq('tenant_id', userTenantId)
            .order('created_at', { ascending: false })
            .limit(1000),
        supabase.from('units')
            .select('id, unit_number, projects(id, name)')
            .in('status', ['For Sale', 'Stock'])
            .limit(1000)
    ])

    const projectsData = projectsRes.data || []
    const customers = customersRes.data || []
    const availableUnits = availableUnitsRes.data || []

    return (
        <>
            <CRMFilterSheet
                projects={isBroker ? [] : projectsData}
                profiles={[]} 
                customers={customers}
            />
            <NewSaleButton
                customers={customers}
                availableUnits={availableUnits}
                initialState={{
                    openNewSale: params.newSale === 'true',
                    unitId: params.unitId as string,
                    projectId: params.projectId as string
                }}
                tenantType={tenantType}
            />
        </>
    )
}
