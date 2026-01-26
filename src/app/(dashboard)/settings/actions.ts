'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateTenantProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        console.error('updateTenantProfile: No tenant found for user', user.id)
        return { error: 'No tenant found' }
    }

    const updates = {
        name: formData.get('name') as string,
        logo_url: formData.get('logo_url') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update Tenant Error:', error)
        return { error: 'Failed to update tenant profile' }
    }

    revalidatePath('/settings')
    return { success: true }
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function addUser(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        console.error('addUser: No tenant found for user', user.id)
        return { error: 'No tenant found' }
    }

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string || 'user'

    if (!password || password.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır.' }
    }

    try {
        const adminClient = createAdminClient()

        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role,
                tenant_id: profile.tenant_id
            }
        })

        if (error) {
            console.error('Create User Error:', error)
            return { error: `Kullanıcı oluşturulamadı: ${error.message}` }
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (e: any) {
        if (e.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            return { error: 'Sistem hatası: SUPABASE_SERVICE_ROLE_KEY tanımlanmamış. Lütfen yöneticiye başvurun.' }
        }
        return { error: 'Bir hata oluştu: ' + e.message }
    }
}

export async function createPaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .insert({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })

    if (error) {
        console.error('Create Template Error:', error)
        return { error: 'Failed to create template' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deletePaymentPlanTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('payment_plan_templates').delete().eq('id', id)
    if (error) {
        return { error: 'Failed to delete template' }
    }
    revalidatePath('/settings')
    return { success: true }
}

export async function updatePaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .update({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })
        .eq('id', id)

    if (error) {
        console.error('Update Template Error:', error)
        return { error: 'Failed to update template' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteUser(userId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is owner/admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Protect self-deletion
    if (userId === user.id) {
        return { error: 'Kendi hesabınızı buradan silemezsiniz.' }
    }

    try {
        const adminClient = createAdminClient()

        // 1. Delete from Auth
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
        if (authError) throw authError

        // 2. Delete from Profiles
        const { error: profError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profError) console.error('Profile cleanup error:', profError)

        revalidatePath('/settings')
        return { success: true }
    } catch (e: any) {
        return { error: 'Silme işlemi başarısız: ' + e.message }
    }
}

export async function updateUser(userId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const full_name = formData.get('name') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string

    // 1. Update Profile
    const { error } = await supabase
        .from('profiles')
        .update({ full_name, role })
        .eq('id', userId)

    if (error) {
        return { error: 'Profil güncellenemedi: ' + error.message }
    }

    // 2. Update Password if provided
    if (password && password.length >= 6) {
        try {
            const adminClient = createAdminClient()
            const { error: passError } = await adminClient.auth.admin.updateUserById(userId, {
                password: password
            })

            if (passError) throw passError
        } catch (e: any) {
            console.error('Password Update Error:', e)
            // We don't fail the whole request if profile update worked, but ideally should warn
            return { error: 'Profil güncellendi ancak şifre değiştirilemedi: ' + e.message }
        }
    }

    revalidatePath('/settings')
    return { success: true }
}
