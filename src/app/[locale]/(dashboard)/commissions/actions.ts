'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, format } from 'date-fns'

export async function getCommissionStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalEarned: 0, pending: 0, thisMonth: 0, count: 0 }

    // Check role for filtering logic (RLS handles exact data, but good to know context)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = ['admin', 'owner', 'manager'].includes(profile?.role || '')

    // Fetch all relevant commissions to calculate stats in memory or via simplified queries
    // Since amount is numeric, we can sum it.
    let query = supabase.from('commissions').select('amount, status, calculated_at')

    // If not admin, RLS filters implicitly, but let's be explicit if needed
    // Actually RLS is best.

    const { data: commissions, error } = await query

    if (error) {
        console.error('Stats Error:', error)
        return { totalEarned: 0, pending: 0, thisMonth: 0, count: 0 }
    }

    const totalEarned = commissions
        .filter(c => ['paid', 'approved'].includes(c.status))
        .reduce((sum, c) => sum + Number(c.amount), 0)

    const pending = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + Number(c.amount), 0)

    const now = new Date()
    const startOfCurrentMonth = startOfMonth(now)

    const thisMonth = commissions
        .filter(c => new Date(c.calculated_at) >= startOfCurrentMonth)
        .reduce((sum, c) => sum + Number(c.amount), 0)

    return {
        totalEarned,
        pending,
        thisMonth,
        count: commissions.length
    }
}

export async function getCommissions() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('commissions')
        .select(`
            *,
            profiles:user_id ( full_name ),
            sales:sale_id (
                id,
                projects:project_id ( name ),
                units:unit_id ( unit_no ),
                customers:customer_id ( full_name )
            )
        `)
        .order('calculated_at', { ascending: false })

    if (error) {
        console.error('Commissions Fetch Error:', error)
        return []
    }

    return data
}
