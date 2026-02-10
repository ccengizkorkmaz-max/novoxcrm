import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email')
    const target = profiles?.find(p => p.id === "3a3c1529-bb74-40f5-90ef-2414c65667dd")
    return NextResponse.json({ profiles, target })
}
