/**
 * Figensoft (Posta Güvercini) OTP SMS Modülü
 * 
 * Tek kullanımlık şifre (OTP) gönderimi ve doğrulama.
 * Müşteri telefon doğrulama, 2FA gibi senaryolar için kullanılır.
 */

import {
  type FigensoftCredentials,
  getFigensoftCredentials,
} from './client'
import { sendSMS, logSMS } from './sms'

/**
 * OTP SMS gönderir
 */
export async function sendOTP(
  credentials: FigensoftCredentials,
  phone: string,
  code: string,
  message?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smsMessage = message || `Doğrulama kodunuz: ${code}\nBu kodu kimseyle paylaşmayın.\n— Novo İnşaat`

  const result = await sendSMS(credentials, {
    receivers: [phone],
    message: smsMessage,
    channel: 'OTP',
  })

  if (result.success) {
    return {
      success: true,
      messageId: result.messageIds?.[0],
    }
  }

  return { success: false, error: result.error }
}

/**
 * Tenant bazlı OTP gönderimi — credentials otomatik çekilir
 */
export async function sendOTPForTenant(
  tenantId: string,
  phone: string,
  options?: {
    codeLength?: number
    customMessage?: string
    customerId?: string
  }
): Promise<{ success: boolean; code?: string; error?: string }> {
  const credentials = await getFigensoftCredentials(tenantId)
  if (!credentials) {
    return { success: false, error: 'Figensoft API bilgileri tanımlanmamış.' }
  }

  // Rastgele OTP kodu oluştur
  const codeLength = options?.codeLength || 6
  const code = generateOTPCode(codeLength)

  const result = await sendOTP(credentials, phone, code, options?.customMessage)

  // Log kaydet
  await logSMS({
    tenantId,
    customerId: options?.customerId,
    phone,
    message: `OTP: ${code}`,
    messageId: result.messageId,
    status: result.success ? 'sent' : 'failed',
    channel: 'otp',
    errorMessage: result.error,
  })

  if (result.success) {
    // OTP kodunu geçici olarak sakla (5 dakika geçerli)
    await storeOTPCode(tenantId, phone, code)
    return { success: true, code }
  }

  return { success: false, error: result.error }
}

/**
 * OTP kodunu doğrular
 */
export async function verifyOTP(
  tenantId: string,
  phone: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  const storedCode = await getStoredOTPCode(tenantId, phone)

  if (!storedCode) {
    return { success: false, error: 'Doğrulama kodu bulunamadı veya süresi dolmuş.' }
  }

  if (storedCode !== inputCode) {
    return { success: false, error: 'Doğrulama kodu yanlış.' }
  }

  // Kullanıldıktan sonra kodu sil
  await deleteStoredOTPCode(tenantId, phone)

  return { success: true }
}

// ============================================
// HELPERS
// ============================================

/**
 * Rastgele sayısal OTP kodu üretir
 */
function generateOTPCode(length: number = 6): string {
  const digits = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return code
}

/**
 * OTP kodunu geçici olarak saklar (Supabase'de veya cache'de)
 * 5 dakika geçerlilik süresi
 */
async function storeOTPCode(tenantId: string, phone: string, code: string): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Önce eski kodu sil
    await supabase
      .from('otp_codes')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('phone', phone)

    // Yeni kodu kaydet
    await supabase.from('otp_codes').insert({
      tenant_id: tenantId,
      phone,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 dakika
    })
  } catch (err) {
    console.error('[OTP] Kod saklama hatası:', err)
  }
}

/**
 * Saklanan OTP kodunu getirir (süresi dolmamışsa)
 */
async function getStoredOTPCode(tenantId: string, phone: string): Promise<string | null> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    const { data } = await supabase
      .from('otp_codes')
      .select('code')
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data?.code || null
  } catch (err) {
    console.error('[OTP] Kod okuma hatası:', err)
    return null
  }
}

/**
 * Saklanan OTP kodunu siler
 */
async function deleteStoredOTPCode(tenantId: string, phone: string): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    await supabase
      .from('otp_codes')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('phone', phone)
  } catch (err) {
    console.error('[OTP] Kod silme hatası:', err)
  }
}
