'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const username = (formData.get('username') as string)?.trim()?.toLowerCase()
    const password = (formData.get('password') as string)?.trim()

    if (!username || !password) {
        redirect('/customerservices/login?error=missing_fields')
    }

    // Special portal virtual email logic
    const loginEmail = `${username}@portal.novoxcrm.com`

    const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
    })

    if (error) {
        console.error('Portal Login Error:', error.message)
        redirect(`/customerservices/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/customerservices', 'layout')
    redirect('/customerservices')
}
