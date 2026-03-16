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
    // Find user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email?.toLowerCase() === virtualEmail)

    let authUserId: string | undefined

    if (existingUser) {
        authUserId = existingUser.id
        const { error: updateError } = await admin.auth.admin.updateUserById(
            existingUser.id,
            { password: cleanPassword, email_confirm: true }
        )
        if (updateError) return { error: `Auth Update Error: ${updateError.message}` }
    } else {
        const { data: { user: newUser }, error: createError } = await admin.auth.admin.createUser({
            email: virtualEmail,
            password: cleanPassword,
            email_confirm: true,
            user_metadata: { full_name: customer.full_name },
            app_metadata: { role: 'customer' }
        })
        if (createError) return { error: `Auth Creation Error: ${createError.message}` }
        authUserId = newUser?.id
    }

    // 6. Ensure Profile exists and is linked
    if (authUserId) {
        const { error: profileError } = await admin.from('profiles').upsert({
            id: authUserId,
            tenant_id: customer.tenant_id,
            role: 'customer',
            full_name: customer.full_name,
            customer_id: customer.id
        })
        if (profileError) return { error: `Profile Link Error: ${profileError.message}` }
    }

    revalidatePath(`/customers/${customerId}`)
    return { success: true }
}
