import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    if (!query || query.length < 2) {
        return NextResponse.json([])
    }

    try {
        // Get current user's tenant
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'No tenant' }, { status: 400 })
        }

        // Use admin client for fast search
        const admin = createAdminClient()
        const { buildCustomerSearchFilter } = await import('@/lib/phone-search-utils')
        const searchFilter = buildCustomerSearchFilter(query)

        let dbQuery = admin
            .from('customers')
            .select('id, full_name, phone, email')
            .eq('tenant_id', profile.tenant_id)

        if (searchFilter) {
            dbQuery = dbQuery.or(searchFilter)
        }

        const { data, error } = await dbQuery
            .order('full_name')
            .limit(10)

        if (error) {
            console.error('[API] Customer search error:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data || [])
    } catch (err: any) {
        console.error('[API] Customer search exception:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
