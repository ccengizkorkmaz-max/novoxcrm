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

export async function getGlobalStats() {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    const adminClient = createAdminClient()

    // 1. Total Tenants
    const { count: tenantCount } = await adminClient
        .from('tenants')
        .select('*', { count: 'exact', head: true })

    // 2. Total Users
    const { count: userCount } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // 3. Total Sales Volume
    const { data: contracts } = await adminClient
        .from('contracts')
        .select('signed_amount')

    const totalSalesVolume = contracts?.reduce((sum, c) => sum + Number(c.signed_amount), 0) || 0

    // 4. Total Active Leads (broker applications with tenant_id is null)
    const { count: leadCount } = await adminClient
        .from('broker_applications')
        .select('*', { count: 'exact', head: true })
        .is('tenant_id', null)

    return {
        tenantCount: tenantCount || 0,
        userCount: userCount || 0,
        totalSalesVolume,
        leadCount: leadCount || 0
    }
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

        // Owner Info
        const { data: ownerProfile, error: ownerError } = await adminClient
            .from('profiles')
            .select('full_name, email, role, tenant_id')
            .eq('tenant_id', t.id)
            .eq('role', 'owner')
            .maybeSingle()

        if (ownerError) console.error(`Owner Fetch Error for ${t.id}:`, ownerError)

        // If owner not found, try to find ANY user for this tenant to see what's going on
        let fallbackInfo = null
        if (!ownerProfile) {
            const { data: anyUser } = await adminClient
                .from('profiles')
                .select('full_name, email, role')
                .eq('tenant_id', t.id)
                .limit(1)
                .maybeSingle()
            fallbackInfo = anyUser
        }

        return {
            ...t,
            user_count: userCount || 0,
            project_count: projectCount || 0,
            customer_count: customerCount || 0,
            owner_name: ownerProfile?.full_name || fallbackInfo?.full_name || 'Bilinmiyor',
            owner_email: ownerProfile?.email || fallbackInfo?.email || 'Bilinmiyor',
            debug_role: ownerProfile?.role || fallbackInfo?.role || 'None'
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

import { Resend } from 'resend'

export async function resetTenantPassword(tenantId: string, newPassword: string) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    if (!newPassword || newPassword.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır.' }
    }

    const adminClient = createAdminClient()

    // 1. Find the owner/admin profile for this tenant
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .maybeSingle()

    if (profileError || !profile) {
        return { error: 'Firma yönetici profili bulunamadı.' }
    }

    // 2. Update Auth password
    const { error: authError } = await adminClient.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
    )

    if (authError) return { error: 'Şifre güncellenemedi: ' + authError.message }

    // 3. Send Email Notification
    const resend = new Resend(process.env.RESEND_API_KEY)
    try {
        await resend.emails.send({
            from: 'Novox Destek <destek@novoxcrm.com>',
            to: profile.email,
            subject: 'NovoxCRM Hesabınız - Şifre Güncellemesi',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
                    <h2 style="color: #1e40af; margin-top: 0;">Şifreniz Güncellendi</h2>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        Merhaba <strong>${profile.full_name}</strong>,
                    </p>
                    <p style="color: #334155; font-size: 16px; line-height: 1.6;">
                        Sistem yöneticisi tarafından hesabınızın şifresi güncellenmiştir. Yeni bilgileriniz aşağıdadır:
                    </p>
                    <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 24px; margin: 24px 0;">
                        <p style="margin: 0; color: #64748b; font-size: 14px; margin-bottom: 8px;">Yeni Giriş Bilgileri:</p>
                        <p style="margin: 0; font-family: monospace; font-size: 16px;"><strong>Email:</strong> ${profile.email}</p>
                        <p style="margin: 0; font-family: monospace; font-size: 16px; margin-top: 8px;"><strong>Yeni Şifre:</strong> ${newPassword}</p>
                    </div>
                    <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 24px;">
                        Güvenliğiniz için sisteme giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.
                    </p>
                </div>
            `
        })
    } catch (e) {
        console.error('Password reset email failed:', e)
    }

    return { success: true }
}

export async function updateTenantAdminInfo(tenantId: string, adminName: string, adminEmail: string) {
    const isAdmin = await checkSuperAdmin()
    if (!isAdmin) return { error: 'Unauthorized' }

    if (!adminName || !adminEmail) {
        return { error: 'Ad ve Email alanları boş bırakılamaz.' }
    }

    const adminClient = createAdminClient()

    // 1. Find the owner/admin profile for this tenant
    const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('id, email, full_name')
        .eq('tenant_id', tenantId)
        .eq('role', 'owner')
        .maybeSingle()

    if (profileError || !profile) {
        return { error: 'Firma yönetici profili bulunamadı.' }
    }

    // 2. Update Auth record (Email and Full Name)
    const { error: authError } = await adminClient.auth.admin.updateUserById(
        profile.id,
        {
            email: adminEmail,
            user_metadata: { full_name: adminName }
        }
    )

    if (authError) return { error: 'Giriş bilgileri güncellenemedi: ' + authError.message }

    // 3. Update Profiles table
    const { error: dbError } = await adminClient
        .from('profiles')
        .update({
            full_name: adminName,
            email: adminEmail
        })
        .eq('id', profile.id)

    if (dbError) return { error: 'Profil bilgileri güncellenemedi: ' + dbError.message }

    revalidatePath('/saas-admin')
    return { success: true }
}

