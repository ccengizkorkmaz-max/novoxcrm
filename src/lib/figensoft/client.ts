/**
 * Figensoft (Posta Güvercini) API Base Client
 * 
 * Tüm Figensoft servislerinin (SMS, E-Posta, İYS, TİKo) ortak HTTP client'ı.
 * JSON API üzerinden iletişim kurar.
 * 
 * API Base URL: https://www.postaguvercini.com/api_json
 * Dokümantasyon: https://www.postaguvercini.com/AnaSayfa/api-dokumanlari.aspx
 */

const FIGENSOFT_API_BASE = 'https://www.postaguvercini.com/api_json'

export interface FigensoftCredentials {
  username: string
  password: string
  senderId?: string // Alfanümerik SMS başlığı (Originator), ör: "NOVO INSAAT"
}

export interface FigensoftApiResponse<T = any> {
  StatusCode: number
  StatusDescription: string
  Result?: T
}

/**
 * Tenant'a ait Figensoft credentials'ları Supabase'den çeker
 */
export async function getFigensoftCredentials(tenantId: string): Promise<FigensoftCredentials | null> {
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('tenants')
    .select('figensoft_username, figensoft_password, figensoft_sender_id')
    .eq('id', tenantId)
    .single()

  if (error || !data) {
    console.error('[Figensoft] Credentials alınamadı:', error?.message)
    return null
  }

  if (!data.figensoft_username || !data.figensoft_password) {
    return null
  }

  return {
    username: data.figensoft_username,
    password: data.figensoft_password,
    senderId: data.figensoft_sender_id || undefined,
  }
}

/**
 * Figensoft JSON API'ye POST isteği gönderir
 */
export async function figensoftRequest<T = any>(
  endpoint: string,
  body: Record<string, any>,
  credentials: FigensoftCredentials
): Promise<FigensoftApiResponse<T>> {
  const url = `${FIGENSOFT_API_BASE}${endpoint}`

  const payload = {
    Username: credentials.username,
    Password: credentials.password,
    ...body,
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error(`[Figensoft] HTTP Error ${response.status}:`, text)
      return {
        StatusCode: response.status,
        StatusDescription: `HTTP Error: ${response.statusText}`,
      }
    }

    const data = await response.json()
    return data as FigensoftApiResponse<T>
  } catch (err: any) {
    console.error('[Figensoft] Request failed:', err)
    return {
      StatusCode: -1,
      StatusDescription: `Network Error: ${err.message}`,
    }
  }
}

/**
 * API hata mesajlarını Türkçe'ye çevirir
 */
export function translateFigensoftError(statusCode: number, statusDescription?: string): string {
  switch (statusCode) {
    case 200:
      return 'İşlem başarılı'
    case 400:
      return 'Geçersiz istek formatı'
    case 401:
      return 'Figensoft kimlik doğrulama hatası. Kullanıcı adı veya şifre yanlış.'
    case 403:
      return 'API erişim yetkiniz yok. Figensoft panelinden API yetkisini aktif edin.'
    case 404:
      return 'API endpoint bulunamadı'
    case 429:
      return 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.'
    case 500:
      return 'Figensoft sunucu hatası'
    case -1:
      return `Bağlantı hatası: ${statusDescription || 'Sunucuya ulaşılamıyor'}`
    default:
      return statusDescription || `Bilinmeyen hata (Kod: ${statusCode})`
  }
}
