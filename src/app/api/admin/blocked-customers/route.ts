import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json([], { status: 200 })
        }

        const adminSupabase = createAdminClient()
        
        // Get tenant_id from profile
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json([], { status: 200 })
        }

        const { data } = await adminSupabase
            .from('customers')
            .select('id, full_name, phone, communication_enabled')
            .eq('tenant_id', profile.tenant_id)
            .eq('communication_enabled', false)
            .order('full_name')

        return NextResponse.json(data || [])
    } catch (e: any) {
        console.error('[blocked-customers]', e.message)
        return NextResponse.json([], { status: 200 })
    }
}
