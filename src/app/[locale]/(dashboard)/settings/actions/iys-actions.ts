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
    brand_code: string
    iys_code: string
}

export async function testIysConnection(payload: TestConnectionPayload): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Oturum bulunamadı.' }

    try {
        // Try a simple status check to validate credentials
        const url = `${payload.api_url}/api/v1/brand/info`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${payload.api_key}`,
            },
            signal: AbortSignal.timeout(10000),
        })

        if (response.ok) {
            const data = await response.json()
            return {
                success: true,
                message: `Bağlantı başarılı. ${data.brand_name ? `Marka: ${data.brand_name}` : 'API yanıt verdi.'}`
            }
        }

        // If brand/info doesn't exist, try a basic health check
        if (response.status === 404) {
            // Try alternative endpoint
            const healthResponse = await fetch(`${payload.api_url}/api/v1/iys/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${payload.api_key}`,
                },
                body: JSON.stringify({
                    recipient: 'test@test.com',
                    channel: 'EPOSTA',
                    brand_code: payload.brand_code,
                    iys_code: payload.iys_code,
                }),
                signal: AbortSignal.timeout(10000),
            })

            if (healthResponse.ok || healthResponse.status === 400) {
                // 400 is acceptable — means API is reachable and auth works, but request was invalid
                return {
                    success: true,
                    message: 'API bağlantısı başarılı. Kimlik bilgileri doğrulandı.'
                }
            }

            if (healthResponse.status === 401 || healthResponse.status === 403) {
                return {
                    success: false,
                    message: 'API Token geçersiz. Lütfen token bilgisini kontrol edin.'
                }
            }

            return {
                success: false,
                message: `API yanıt kodu: ${healthResponse.status}. Lütfen URL ve kimlik bilgilerini kontrol edin.`
            }
        }

        if (response.status === 401 || response.status === 403) {
            return {
                success: false,
                message: 'API Token geçersiz veya yetkisiz. Lütfen token bilgisini kontrol edin.'
            }
        }

        return {
            success: false,
            message: `Beklenmeyen yanıt kodu: ${response.status}. URL ve kimlik bilgilerini kontrol edin.`
        }
    } catch (e: any) {
        if (e.name === 'TimeoutError' || e.name === 'AbortError') {
            return { success: false, message: 'Bağlantı zaman aşımına uğradı. URL adresini kontrol edin.' }
        }
        return { success: false, message: `Bağlantı hatası: ${e.message}` }
    }
}
