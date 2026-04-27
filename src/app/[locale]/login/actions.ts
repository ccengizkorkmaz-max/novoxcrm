'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

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
        const locale = await getLocale()
        redirect({ href: '/login?error=Could not authenticate user', locale })
    }

    const locale = await getLocale()
    revalidatePath('/', 'layout')
    redirect({ href: '/dashboard', locale })
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        const locale = await getLocale()
        redirect({ href: '/login?error=Could not create user', locale })
    }

    const locale = await getLocale()
    revalidatePath('/', 'layout')
    redirect({ href: `/login?message=Check email to continue sign in process`, locale })
}

export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email || !email.includes('@')) {
        const locale = await getLocale()
        redirect({ href: '/login?error=Lütfen geçerli bir e-posta adresi girin.', locale })
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.novoxcrm.com'}/auth/callback?next=/update-password`,
    })

    if (error) {
        console.error('Password reset error:', error)
        const locale = await getLocale()
        redirect({ href: '/login?error=Şifre sıfırlama e-postası gönderilemedi.', locale })
    }

    const locale = await getLocale()
    redirect({ href: `/login?message=Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.`, locale })
}
