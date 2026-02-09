'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, format } from 'date-fns'

export async function getCommissionStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { totalEarned: 0, pending: 0, thisMonth: 0, count: 0 }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'user'

    let query = supabase.from('commissions').select('amount, status, calculated_at, user_id')

    // RBAC Filtering
    if (role === 'manager') {
        // Find subordinates
        const { data: employee } = await supabase.from('employees').select('id').eq('profile_id', user.id).single()
        if (employee) {
            const { data: subordinates } = await supabase.from('employees').select('profile_id').eq('manager_id', employee.id)
            const subordinateIds = subordinates?.map(s => s.profile_id).filter(Boolean) || []
            query = query.in('user_id', [user.id, ...subordinateIds])
        } else {
            query = query.eq('user_id', user.id)
        }
    } else if (role !== 'admin' && role !== 'owner') {
        query = query.eq('user_id', user.id)
    }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile?.role || 'user'

    let query = supabase
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

    // RBAC Filtering
    if (role === 'manager') {
        const { data: employee } = await supabase.from('employees').select('id').eq('profile_id', user.id).single()
        if (employee) {
            const { data: subordinates } = await supabase.from('employees').select('profile_id').eq('manager_id', employee.id)
            const subordinateIds = subordinates?.map(s => s.profile_id).filter(Boolean) || []
            query = query.in('user_id', [user.id, ...subordinateIds])
        } else {
            query = query.eq('user_id', user.id)
        }
    } else if (role !== 'admin' && role !== 'owner') {
        query = query.eq('user_id', user.id)
    }

    const { data, error } = await query.order('calculated_at', { ascending: false })

    if (error) {
        console.error('Commissions Fetch Error:', error)
        return []
    }

    return data
}
