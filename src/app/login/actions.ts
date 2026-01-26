'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const emailOrUsername = formData.get('email') as string
    const password = formData.get('password') as string

    let loginEmail = emailOrUsername

    // If it's not a valid email, assume it's a portal username
    if (!emailOrUsername.includes('@')) {
        const { data: customer } = await supabase
            .from('customers')
            .select('portal_username')
            .eq('portal_username', emailOrUsername)
            .single()

        if (customer) {
            loginEmail = `${emailOrUsername.toLowerCase()}@portal.novoxcrm.com`
        }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
    })

    if (error) {
        redirect('/login?error=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        redirect('/login?error=Could not create user')
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check email to continue sign in process')
}
