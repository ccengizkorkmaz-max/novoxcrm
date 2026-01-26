'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function syncPortalAccess(customerId: string, username: string, password: string) {
    const supabase = await createClient()

    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    // 1. Get customer
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

    if (customerError || !customer) return { error: 'Customer not found' }

    // 2. Format virtual email
    const virtualEmail = `${cleanUsername}@portal.novoxcrm.com`

    // 3. Admin Client
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    // 4. Update DB
    await supabase.from('customers').update({
        portal_username: cleanUsername,
        portal_password: cleanPassword
    }).eq('id', customerId)

    // 5. Auth Sync
    // Try to find user by email first (more reliable than listUsers find)
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === virtualEmail)

    if (existingUser) {
        const { error: updateError } = await admin.auth.admin.updateUserById(
            existingUser.id,
            { password: cleanPassword }
        )
        if (updateError) return { error: `Auth Update Error: ${updateError.message}` }
    } else {
        const { data: newUser, error: createError } = await admin.auth.admin.createUser({
            email: virtualEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: { full_name: customer.full_name },
            app_metadata: { role: 'customer' }
        })
        if (createError) return { error: `Auth Creation Error: ${createError.message}` }

        if (newUser.user) {
            await admin.from('profiles').upsert({
                id: newUser.user.id,
                tenant_id: customer.tenant_id,
                role: 'customer',
                full_name: customer.full_name,
                customer_id: customer.id
            })
        }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true }
}
