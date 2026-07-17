'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface IysSettingsPayload {
    iys_provider: string
    iys_sync_enabled: boolean
    iys_config: {
        username?: string
        password?: string
        api_url?: string
        api_key?: string
        brand_code?: string
        iys_code?: string
        consent_endpoint?: string
    }
}

export async function updateIysSettings(payload: IysSettingsPayload) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı.' }
    if (!['owner', 'admin'].includes(profile.role || '')) return { error: 'Bu işlem için yetkiniz yok.' }

    const { error } = await supabase
        .from('tenants')
        .update({
            iys_provider: payload.iys_provider,
            iys_sync_enabled: payload.iys_sync_enabled,
            iys_config: payload.iys_config,
        })
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('[IYS Settings] Update error:', error)
        return { error: `Kayıt hatası: ${error.message}` }
    }

    revalidatePath('/settings')
    return { success: true }
}

interface TestConnectionPayload {
    api_url: string
    api_key: string
    username: string
    brand_code: string
    iys_code: string
}

export async function testIysConnection(payload: TestConnectionPayload): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Oturum bulunamadı.' }

    try {
        const baseUrl = payload.api_url.replace(/\/+$/, '')
        const endpoint = `${baseUrl}/api/iys/add-consent`
        const apiKey = `${payload.username}:${payload.api_key}`

        // Send a real add-consent request with a test number
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({
                iysCode: Number(payload.iys_code) || 111111,
                brandCode: Number(payload.brand_code) || 111111,
                consentType: 0,      // ARAMA
                recipientType: 1,    // TACIR
                source: 6,           // HS_WEB
                status: 1,           // ONAY
                list: [
                    { recipient: '+905001234567' }
                ]
            }),
            signal: AbortSignal.timeout(15000),
        })

        const raw = await response.text()
        let parsed: any = {}
        try { parsed = JSON.parse(raw) } catch {}

        if (response.ok && parsed.data) {
            const info = parsed.data.userInfo
            return {
                success: true,
                message: `Bağlantı başarılı! Hesap: ${info?.title || payload.username} · Entegratör: ${parsed.data.integratorInfo?.title || 'Bilinmiyor'}`
            }
        }

        if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                message: 'API kimlik bilgileri geçersiz. Kullanıcı adı ve token bilgisini kontrol edin.'
            }
        }

        return {
            success: false,
            message: `API yanıt kodu: ${response.status}. ${parsed.error || parsed.message || raw.substring(0, 200)}`
        }
    } catch (e: any) {
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
            return { success: false, message: 'Bağlantı zaman aşımına uğradı (15s). URL adresini kontrol edin.' }
        }
        return { success: false, message: `Bağlantı hatası: ${e.message}` }
    }
}

