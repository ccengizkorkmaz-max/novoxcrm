import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    const { data: contract, error } = await supabase
        .from('contracts')
        .select('*')
        .limit(1)
        .single()

    if (error) return NextResponse.json({ error })

    // Get keys
    const columns = Object.keys(contract)
    return NextResponse.json({ columns })
}
