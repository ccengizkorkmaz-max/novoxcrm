'use server'

import { createClient } from '@/lib/supabase/server'

export async function checkSoldUnits() {
    const supabase = await createClient()

    // Get user and tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    // Get all projects for this tenant
    const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .eq('tenant_id', profile.tenant_id)

    const projectIds = projects?.map(p => p.id) || []

    // Get all sold units
    const { data: soldUnits } = await supabase
        .from('units')
        .select('id, unit_number, block, status, project_id, projects(name)')
        .eq('status', 'Sold')
        .eq('is_legacy', false)
        .in('project_id', projectIds)

    // Get the specific cancelled contract unit
    const { data: cancelledUnit } = await supabase
        .from('units')
        .select('id, unit_number, block, status, project_id, projects(name)')
        .eq('id', '8eb7ae59-ce35-459c-bd0a-ab2303c11eff')
        .single()

    // Get contracts for the cancelled unit
    const { data: contracts } = await supabase
        .from('contracts')
        .select('id, contract_number, status, unit_id')
        .eq('unit_id', '8eb7ae59-ce35-459c-bd0a-ab2303c11eff')

    return {
        soldUnits,
        soldCount: soldUnits?.length || 0,
        cancelledUnit,
        contractsForCancelledUnit: contracts
    }
}
