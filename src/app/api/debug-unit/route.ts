import { createClient } from '@/lib/supabase/server'

export async function GET() {
    const supabase = await createClient()

    // Check the specific unit
    const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('id, unit_number, status, project_id')
        .eq('id', '8eb7ae59-ce35-459c-bd0a-ab2303c11eff')
        .single()

    // Check all sold units
    const { data: soldUnits, error: soldError } = await supabase
        .from('units')
        .select('id, unit_number, status, project_id')
        .eq('status', 'Sold')

    // Check contracts for this unit
    const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('id, contract_number, status, unit_id')
        .eq('unit_id', '8eb7ae59-ce35-459c-bd0a-ab2303c11eff')

    return Response.json({
        specificUnit: { data: unit, error: unitError },
        allSoldUnits: { data: soldUnits, error: soldError, count: soldUnits?.length },
        relatedContracts: { data: contracts, error: contractsError }
    })
}
