import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Get all profiles to see who is in the system
    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')

    return NextResponse.json({ profiles })
}
