'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper to check if current user is Super Admin/Owner
async function checkSuperAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    // For now, we check if the user is the specific owner email
    // OR if they have a special 'super_admin' metadata/claim (future proofing)
    if (user.email === 'ccengizkorkmaz@gmail.com') return true

    return false
}

export async function getAllTenants() {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    // Fetch tenants
    const { data: tenants, error } = await adminClient
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }

    // Fetch user counts for each tenant
    // Note: Doing this in a loop for MVP simplicity, eventually should be a view or join
    const tenantsWithCounts = await Promise.all(tenants.map(async (t) => {
        const { count } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', t.id)

        return {
            ...t,
            user_count: count || 0
        }
    }))

    return { tenants: tenantsWithCounts }
}

export async function updateTenantLimits(id: string, user_limit: number, end_date: string) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({
            user_limit,
            subscription_end_date: end_date
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/saas-admin')
    return { success: true }
}

export async function updateTenantStatus(id: string, status: string) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update({ subscription_status: status })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/saas-admin')
    return { success: true }
}
