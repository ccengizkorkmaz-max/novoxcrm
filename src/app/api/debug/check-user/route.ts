import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Get profile for the creator ID found
    const creatorId = "3a3c1529-bb74-40f5-90ef-2414c65667dd"
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', creatorId)
        .single()

    return NextResponse.json({ profile })
}
