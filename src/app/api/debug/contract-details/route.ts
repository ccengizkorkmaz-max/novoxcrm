import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: contract } = await supabase
        .from('contracts')
        .select(`
            *,
            customers: contract_customers(
                customer: customers(full_name, phone, email)
            )
        `)
        .eq('contract_number', 'SZL-20260210-864')
        .single()

    return NextResponse.json({ contract })
}
