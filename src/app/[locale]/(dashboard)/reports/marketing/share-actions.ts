'use server'

import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

function hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

function generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

export async function createSharedReport(password: string, expiryHours: number | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const token = generateToken()
    const salt = crypto.randomBytes(16).toString('hex')
    const passwordHash = salt + ':' + hashPassword(password, salt)
    
    const expiresAt = expiryHours 
        ? new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
        : null

    const { error } = await supabase
        .from('shared_reports')
        .insert({
            tenant_id: profile.tenant_id,
            token,
            report_type: 'marketing',
            password_hash: passwordHash,
            expires_at: expiresAt,
            created_by: user.id,
            is_active: true,
        })

    if (error) return { error: error.message }

    return { token }
}

export async function deactivateSharedReport(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { error } = await supabase
        .from('shared_reports')
        .update({ is_active: false })
        .eq('id', id)

    if (error) return { error: error.message }
    return { success: true }
}

export async function getActiveShares() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data, error } = await supabase
        .from('shared_reports')
        .select('id, token, expires_at, created_at, is_active')
        .eq('report_type', 'marketing')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { shares: data || [] }
}
