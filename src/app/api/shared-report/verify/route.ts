import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return computed === hash
}

export async function POST(req: NextRequest) {
    const { token, password } = await req.json()

    if (!token || !password) {
        return NextResponse.json({ error: 'Token ve şifre gereklidir' }, { status: 400 })
    }

    // Use service role to bypass RLS — this is the ONLY place we do this for shared reports
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: share, error } = await supabase
        .from('shared_reports')
        .select('id, tenant_id, password_hash, expires_at, is_active, report_type')
        .eq('token', token)
        .single()

    if (error || !share) {
        return NextResponse.json({ error: 'Geçersiz paylaşım linki' }, { status: 404 })
    }

    if (!share.is_active) {
        return NextResponse.json({ error: 'Bu paylaşım linki devre dışı bırakılmış' }, { status: 403 })
    }

    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Bu paylaşım linkinin süresi dolmuş' }, { status: 403 })
    }

    if (share.report_type !== 'marketing') {
        return NextResponse.json({ error: 'Geçersiz rapor türü' }, { status: 400 })
    }

    if (!verifyPassword(password, share.password_hash)) {
        return NextResponse.json({ error: 'Yanlış şifre' }, { status: 401 })
    }

    // Password verified — return tenant_id for data fetching
    // Generate a short-lived session token (valid 1 hour)
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const sessionExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    return NextResponse.json({ 
        success: true, 
        tenantId: share.tenant_id,
        sessionToken,
        sessionExpiry
    })
}
