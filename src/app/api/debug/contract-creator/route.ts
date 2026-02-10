import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Query for the specific contract
    const { data: contract, error } = await supabase
        .from('contracts')
        .select(`
            id,
            contract_number,
            created_at,
            created_by,
            sales_rep_id,
            creator:profiles!contracts_created_by_fkey(full_name, email),
            sales_rep:profiles!contracts_sales_rep_id_fkey(full_name, email),
            activities:contract_activities(
                activity_type,
                description,
                created_at,
                performer:profiles(full_name, email)
            )
        `)
        .eq('contract_number', 'SZL-20260210-864')
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ contract })
}
