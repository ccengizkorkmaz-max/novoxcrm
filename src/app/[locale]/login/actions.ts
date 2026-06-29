'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'

import { createClient } from '@/lib/supabase/server'
import { getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

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
        console.error('[LOGIN ERROR]', error.message, error.status, error.name)
        const locale = await getLocale()
        const errorMessage = error.message || 'Could not authenticate user'
        redirect({ href: `/login?error=${encodeURIComponent(errorMessage)}`, locale })
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
        redirect({ href: `/login?error=${encodeURIComponent('Lütfen geçerli bir e-posta adresi girin.')}`, locale })
    }

    const host = await getHostFromHeaders()
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1')
    const protocol = isLocal ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/update-password`,
    })

    if (error) {
        console.error('Password reset error:', error)
        const locale = await getLocale()
        redirect({ href: `/login?error=${encodeURIComponent('Şifre sıfırlama e-postası gönderilemedi.')}`, locale })
    }

    const locale = await getLocale()
    redirect({ href: `/login?message=${encodeURIComponent('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')}`, locale })
}
