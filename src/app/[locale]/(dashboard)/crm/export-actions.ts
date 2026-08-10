'use server'

import { createClient } from '@/lib/supabase/server'

export async function getSalesForExport(filters: {
    project?: string
    rep?: string
    status?: string
    search?: string
    customer?: string
    dateFrom?: string
    dateTo?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get Current User Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'
    const isManager = isAdmin || profile?.role === 'manager'

    // Build base sales query for filtered data
    let baseQuery = supabase
        .from('sales')
        .select('*, customers!inner(id, full_name, email, phone, customer_number), units(unit_number, price, currency, projects(id, name)), projects(id, name), profiles(full_name)')
        .neq('status', 'Inbox') // Exclude inbox items
    // Role-based filtering and ordering
    if (!isManager) {
        baseQuery = baseQuery.eq('assigned_to', user.id)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
    } else {
        if (filters.rep) {
            baseQuery = baseQuery.eq('assigned_to', filters.rep)
        }
        baseQuery = baseQuery.order('created_at', { ascending: false })
    }

    if (filters.project) baseQuery = baseQuery.eq('project_id', filters.project)
    if (filters.status) baseQuery = baseQuery.eq('status', filters.status)
    if (filters.customer) baseQuery = baseQuery.eq('customer_id', filters.customer)
    if (filters.dateFrom) baseQuery = baseQuery.gte('created_at', filters.dateFrom)
    if (filters.dateTo) baseQuery = baseQuery.lte('created_at', filters.dateTo + 'T23:59:59')
    if (filters.search) {
        baseQuery = baseQuery.or(`full_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`, { foreignTable: 'customers' })
    }

    const { data, error } = await baseQuery

    if (error) {
        console.error('Export Error:', error)
        return { error: error.message }
    }

    return { data }
}
