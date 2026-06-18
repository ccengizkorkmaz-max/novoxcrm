import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user?.tenant_id) {
            return NextResponse.json([], { status: 200 })
        }

        const supabase = createAdminClient()
        const { data } = await supabase
            .from('customers')
            .select('id, full_name, phone, communication_enabled')
            .eq('tenant_id', user.tenant_id)
            .eq('communication_enabled', false)
            .order('full_name')

        return NextResponse.json(data || [])
    } catch (e: any) {
        console.error('[blocked-customers]', e.message)
        return NextResponse.json([], { status: 200 })
    }
}
