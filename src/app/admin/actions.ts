'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function createTenantWithAdmin(formData: FormData) {
    const supabase = await createClient()

    const companyName = formData.get('companyName') as string
    const adminName = formData.get('adminName') as string
    const adminEmail = formData.get('adminEmail') as string
    const adminPassword = formData.get('adminPassword') as string

    // 1. Validate Input
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
        return { error: 'Lütfen tüm alanları doldurun.' }
    }
    if (adminPassword.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır.' }
    }

    try {
        const adminClient = createAdminClient()

        // 2. Create Tenant
        const { data: tenant, error: tenantError } = await adminClient
            .from('tenants')
            .insert({ name: companyName })
            .select()
            .single()

        if (tenantError) {
            console.error('Tenant Creation Error:', tenantError)
            return { error: 'Şirket kaydı oluşturulamadı.' }
        }

        console.log('Tenant Created:', tenant.id)

        // 3. Create Admin User
        // Metadata will be picked up by the 'handle_new_user' trigger
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                full_name: adminName,
                role: 'owner', // Trigger will use this
                tenant_id: tenant.id // Trigger will use this
            }
        })

        if (authError) {
            console.error('Auth Creation Error:', authError)
            // Rollback tenant creation ideally, but for MVP we skip
            return { error: `Yönetici hesabı oluşturulamadı: ${authError.message}` }
        }

        console.log('Admin User Created:', authData.user.id)

        return { success: true }
    } catch (e: any) {
        console.error('Onboarding Error:', e)
        return { error: 'Sistem hatası oluştu.' }
    }
}
