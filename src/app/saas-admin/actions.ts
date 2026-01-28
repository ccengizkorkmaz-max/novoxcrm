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
        // User count
        const { count: userCount } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', t.id)

        // Project count
        const { count: projectCount } = await adminClient
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', t.id)

        // Customer count
        const { count: customerCount } = await adminClient
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', t.id)

        return {
            ...t,
            user_count: userCount || 0,
            project_count: projectCount || 0,
            customer_count: customerCount || 0
        }
    }))

    return { tenants: tenantsWithCounts }
}

export async function updateTenantSubscription(
    id: string,
    data: {
        user_limit?: number,
        subscription_end_date?: string,
        plan_type?: string,
        subscription_status?: string
    }
) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('tenants')
        .update(data)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/saas-admin')
    return { success: true }
}

// updateTenantStatus is now redundant, but keeping a wrapper for legacy calls if any, 
// though I'll update the UI to call the new unified function.
export async function updateTenantStatus(id: string, status: string) {
    return updateTenantSubscription(id, { subscription_status: status })
}

export async function provisionTenant(formData: FormData) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const name = formData.get('name') as string
    const adminName = formData.get('adminName') as string
    const adminEmail = formData.get('adminEmail') as string
    const adminPassword = formData.get('adminPassword') as string
    const plan = formData.get('plan') as string
    const userLimit = Number(formData.get('userLimit'))
    const durationMonths = Number(formData.get('duration'))

    if (!name || !adminEmail || !adminPassword) {
        return { error: 'Eksik bilgi girdiniz.' }
    }

    // 1. Create Tenant
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + durationMonths)

    const { data: tenant, error: tenantError } = await adminClient
        .from('tenants')
        .insert({
            name,
            plan_type: plan,
            user_limit: userLimit,
            subscription_status: 'Active',
            subscription_end_date: endDate.toISOString()
        })
        .select()
        .single()

    if (tenantError) return { error: 'Firma oluşturulamadı: ' + tenantError.message }

    // 2. Create Admin User
    const { error: authError } = await adminClient.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
            full_name: adminName,
            role: 'owner',
            tenant_id: tenant.id
        }
    })

    if (authError) {
        // Optional: Rollback tenant? For now, we return error.
        return { error: 'Kullanıcı oluşturulamadı: ' + authError.message }
    }

    revalidatePath('/saas-admin')
    return { success: true }
}

export async function getSaasLeads() {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
        .from('broker_applications')
        .select('*')
        .is('tenant_id', null)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { leads: data }
}

export async function deleteSaasLead(id: string) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('broker_applications')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/saas-admin')
    return { success: true }
}

