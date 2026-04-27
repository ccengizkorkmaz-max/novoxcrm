'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from '@/i18n/routing'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function brokerLogin(formData: FormData) {
    const supabase = await createClient()
    const locale = await getLocale()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect({ href: `/broker/login?error=${encodeURIComponent('Lütfen e-posta ve şifrenizi girin.')}`, locale })
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
        redirect({ href: `/broker/login?error=${encodeURIComponent('E-posta veya şifre hatalı.')}`, locale })
    }

    // Verify user is a broker
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['broker', 'management', 'sales', 'admin', 'owner']
        if (!profile || !allowedRoles.includes(profile.role)) {
            await supabase.auth.signOut()
            redirect({ href: `/broker/login?error=${encodeURIComponent('Bu hesap broker portalına erişim yetkisine sahip değil.')}`, locale })
        }
    }

    revalidatePath('/', 'layout')
    redirect({ href: '/broker', locale })
}

export async function brokerResetPassword(formData: FormData) {
    const supabase = await createClient()
    const locale = await getLocale()
    const email = formData.get('email') as string

    if (!email || !email.includes('@')) {
        redirect({ href: `/broker/login?error=${encodeURIComponent('Lütfen geçerli bir e-posta adresi girin.')}`, locale })
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.novoxcrm.com'}/auth/callback?next=/update-password`,
    })

    if (error) {
        console.error('Broker password reset error:', error)
        redirect({ href: `/broker/login?error=${encodeURIComponent('Şifre sıfırlama e-postası gönderilemedi.')}`, locale })
    }

    redirect({ href: `/broker/login?message=${encodeURIComponent('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')}`, locale })
}
