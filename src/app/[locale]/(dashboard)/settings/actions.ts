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
        country: formData.get('country') as string,
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

        // --- Limit Check ---
        // 1. Get Tenant Limit
        const { data: tenant, error: tenantErr } = await adminClient
            .from('tenants')
            .select('user_limit')
            .eq('id', profile.tenant_id)
            .single()

        if (tenantErr) throw tenantErr

        // 2. Count current users
        const { count, error: countErr } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id)

        if (countErr) throw countErr

        if (count && count >= tenant.user_limit) {
            return { error: `Kullanıcı limitine ulaşıldı (${tenant.user_limit}). Yeni kullanıcı eklemek için paketinizi yükseltin.` }
        }
        // --- End Limit Check ---

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

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await createClient()

    // Check permission (Owner only)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role !== 'owner' && currentUserProfile?.role !== 'admin') {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Prevent changing own role (safety mechanism)
    if (userId === user.id) {
        return { error: 'Kendi rolünüzü değiştiremezsiniz.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { error: 'Rol güncellenemedi: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

// --- Unit Types Actions ---

export async function getUnitTypes() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('unit_types')
        .select('*')
        .order('order_index', { ascending: true })

    return data || []
}

export async function createUnitType(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const order_index = Number(formData.get('order_index')) || 0

    if (!name) return { error: 'İsim zorunludur' }

    const { error } = await supabase.from('unit_types').insert({
        name,
        description,
        order_index,
        tenant_id: (await getTenantId(supabase, user.id))
    })

    if (error) return { error: 'Oluşturulamadı: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateUnitType(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const order_index = Number(formData.get('order_index')) || 0
    const is_active = formData.get('is_active') === 'true'

    const { error } = await supabase.from('unit_types').update({
        name,
        description,
        order_index,
        is_active
    }).eq('id', id)

    if (error) return { error: 'Güncellenemedi: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteUnitType(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('unit_types').delete().eq('id', id)

    if (error) return { error: 'Silinemedi: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

async function getTenantId(supabase: any, userId: string) {
    const { data } = await supabase.from('profiles').select('tenant_id').eq('id', userId).single()
    return data?.tenant_id
}

export async function initializeUnitTypes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const defaultTypes = [
        { name: 'Stüdyo (1+0)', order_index: 10 },
        { name: '1+1', order_index: 20 },
        { name: '1.5+1', order_index: 30 },
        { name: '2+0', order_index: 40 },
        { name: '2+1', order_index: 50 },
        { name: '2.5+1', order_index: 60 },
        { name: '2+2', order_index: 70 },
        { name: '3+0', order_index: 80 },
        { name: '3+1', order_index: 90 },
        { name: '3.5+1', order_index: 100 },
        { name: '3+2', order_index: 110 },
        { name: '3+3', order_index: 120 },
        { name: '4+0', order_index: 130 },
        { name: '4+1', order_index: 140 },
        { name: '4.5+1', order_index: 150 },
        { name: '4.5+2', order_index: 160 },
        { name: '4+2', order_index: 170 },
        { name: '4+3', order_index: 180 },
        { name: '4+4', order_index: 190 },
        { name: '5+1', order_index: 200 },
        { name: '5.5+1', order_index: 210 },
        { name: '5+2', order_index: 220 },
        { name: 'Villa', order_index: 300 },
        { name: 'Ticari', order_index: 310 },
        { name: 'Ofis', order_index: 320 },
        { name: 'Depo', order_index: 330 },
        { name: 'Dubleks', order_index: 340 },
        { name: 'Penthouse', order_index: 350 }
    ]

    const tenantId = await getTenantId(supabase, user.id)

    // Fallback: Try inserting one by one ignoring errors
    for (const t of defaultTypes) {
        const { error } = await supabase.from('unit_types').insert({ ...t, tenant_id: tenantId }).select()
        if (error) {
            console.log('Skipping existing type or error:', t.name, error.message)
        }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateAiSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates = {
        openai_api_key: formData.get('openai_api_key') as string,
        gemini_api_key: formData.get('gemini_api_key') as string,
        is_openai_enabled: formData.get('is_openai_enabled') === 'on',
        is_gemini_enabled: formData.get('is_gemini_enabled') === 'on',
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update AI Settings Error:', error)
        return { error: 'Ayarlar güncellenirken bir hata oluştu.' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateAiAssistantCharacter(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates = {
        ai_assistant_name: formData.get('ai_assistant_name') as string,
        ai_assistant_personality: formData.get('ai_assistant_personality') as string,
        ai_assistant_gender: formData.get('ai_assistant_gender') as string,
        ai_assistant_instructions: formData.get('ai_assistant_instructions') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update AI Character Error:', error)
        return { error: 'Karakter ayarları güncellenirken bir hata oluştu.' }
    }

    // Comprehensive revalidation
    revalidatePath('/(dashboard)/settings', 'page')
    revalidatePath('/ai', 'layout')
    revalidatePath('/ai/[slug]', 'page')

    return { success: true }
}

export async function saveEmailAccount(data: any) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yetkisiz işlem.' }
    }

    // Default other accounts to false if this one is primary
    if (data.is_default) {
        await supabase
            .from('tenant_email_accounts')
            .update({ is_default: false })
            .eq('tenant_id', profile.tenant_id)
    }

    if (data.id) {
        const { id, ...updates } = data
        const { error } = await supabase
            .from('tenant_email_accounts')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('tenant_email_accounts')
            .insert({ ...data, tenant_id: profile.tenant_id })

        if (error) return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteEmailAccount(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
        return { error: 'Yetkisiz işlem.' }
    }

    const { error } = await supabase
        .from('tenant_email_accounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { error: 'Silinemedi.' }

    revalidatePath('/settings')
    return { success: true }
}

import { sendPoliSms } from '@/lib/sms'

export async function updateSmsSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates = {
        sms_provider: formData.get('sms_provider') as string,
        sms_api_user: formData.get('sms_api_user') as string,
        sms_api_password: formData.get('sms_api_password') as string,
        sms_sender_id: formData.get('sms_sender_id') as string,
        is_sms_notifications_enabled: formData.get('is_sms_notifications_enabled') === 'on',
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update SMS Settings Error:', error)
        return { error: 'Ayarlar güncellenirken bir hata oluştu: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function testSms(phoneNumber?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role, full_name')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('testSms Profile Error:', profileError)
    }

    console.log('testSms called with:', phoneNumber)
    const targetPhone = phoneNumber
    console.log('Effective targetPhone:', targetPhone)
    console.log('Profile found:', !!profile)

    if (!profile) {
        return { error: 'Profil bilgilerine ulaşılamadı. Lütfen tekrar giriş yapın.' }
    }

    if (!targetPhone) {
        return { error: 'Test SMS göndermek için bir telefon numarası belirtilmelidir. (Yazdığınızdan veya profilinizde kayıtlı olduğundan emin olun)' }
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('sms_api_user, sms_api_password, sms_sender_id')
        .eq('id', profile.tenant_id)
        .single()

    if (!tenant?.sms_api_user || !tenant?.sms_api_password) {
        return { error: 'Önce API kullanıcı bilgilerini yukarıdaki formdan kaydediniz.' }
    }

    const result = await sendPoliSms({
        user: tenant.sms_api_user,
        pass: tenant.sms_api_password,
        header: tenant.sms_sender_id || 'NOVOEMLAK',
        contacts: [targetPhone],
        message: `NovoCRM Test Mesajı\n\nMerhaba ${profile.full_name}, SMS altyapınız Polidijital ile başarıyla bağlandı!\n\n${new Date().toLocaleString('tr-TR')}`
    })

    return result
}
