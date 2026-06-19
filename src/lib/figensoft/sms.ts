/**
 * Figensoft (Posta Güvercini) SMS API Modülü
 * 
 * Toplu SMS, tekli SMS, kişiselleştirilmiş SMS gönderimi.
 * Bakiye sorgulama, gönderim durumu takibi, alfanümerik başlık listesi.
 * 
 * API Endpoints:
 *   POST /v1/Sms/Send_1_N   — 1 mesaj, N alıcı
 *   POST /v1/Sms/Send_N_N   — N mesaj, N alıcı
 *   POST /v1/Sms/GetStatus   — Gönderim durumu sorgulama
 *   POST /v1/Credit/GetBalance — Bakiye sorgulama
 *   POST /v1/Sms/GetOriginators — Alfanümerik başlık listesi
 */

import {
  type FigensoftCredentials,
  type FigensoftApiResponse,
  figensoftRequest,
  getFigensoftCredentials,
  translateFigensoftError,
} from './client'

// ============================================
// TYPES
// ============================================

export interface SmsSendResult {
  MessageId?: string
  Receiver?: string
  Charge?: number
}

export interface SmsSendResponse {
  Messages?: SmsSendResult[]
}

export interface SmsStatusResult {
  Receiver?: string
  Status?: string // delivered, sent, failed, pending
  DeliveredAt?: string
}

export interface SmsBalanceResult {
  Balance: number
}

export interface SmsOriginator {
  Name: string
}

export interface SendSmsOptions {
  /** Alıcı telefon numaraları (E.164 veya 905... formatında) */
  receivers: string[]
  /** SMS metni */
  message: string
  /** Gönderici başlığı (Originator). Belirtilmezse tenant varsayılanı kullanılır */
  senderId?: string
  /** İleri tarihli gönderim (yyyyMMdd HH:mm formatında) */
  sendDate?: string
  /** SMS geçerlilik süresi sonu (yyyyMMdd HH:mm formatında) */
  expireDate?: string
  /** Kanal: OTP veya BULK */
  channel?: 'OTP' | 'BULK'
}

export interface SendPersonalizedSmsOptions {
  /** Her alıcı için ayrı mesaj */
  messages: Array<{
    receiver: string
    message: string
  }>
  /** Gönderici başlığı */
  senderId?: string
  /** İleri tarihli gönderim */
  sendDate?: string
  /** Kanal */
  channel?: 'OTP' | 'BULK'
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Tek mesajı birden fazla alıcıya gönderir (1-N)
 * Alıcı sayısı 800'den fazla ise otomatik olarak parçalar.
 */
export async function sendSMS(
  credentials: FigensoftCredentials,
  options: SendSmsOptions
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const { receivers, message, senderId, sendDate, expireDate, channel } = options

  if (!receivers || receivers.length === 0) {
    return { success: false, error: 'Alıcı listesi boş' }
  }

  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Mesaj metni boş' }
  }

  // Numaraları normalize et
  const normalizedReceivers = receivers.map(normalizePhoneForFigensoft)

  // 800'lük paketlere böl
  const BATCH_SIZE = 800
  const batches: string[][] = []
  for (let i = 0; i < normalizedReceivers.length; i += BATCH_SIZE) {
    batches.push(normalizedReceivers.slice(i, i + BATCH_SIZE))
  }

  const allMessageIds: string[] = []
  const errors: string[] = []

  for (const batch of batches) {
    const body: Record<string, any> = {
      Message: message,
      Receivers: batch,
    }

    if (senderId || credentials.senderId) {
      body.Originator = senderId || credentials.senderId
    }
    if (sendDate) body.SendDate = sendDate
    if (expireDate) body.ExpireDate = expireDate
    if (channel) body.Channel = channel

    const response = await figensoftRequest<SmsSendResponse>(
      '/v1/Sms/Send_1_N',
      body,
      credentials
    )

    if (response.StatusCode === 200 && response.Result?.Messages) {
      const ids = response.Result.Messages
        .map(m => m.MessageId)
        .filter(Boolean) as string[]
      allMessageIds.push(...ids)
    } else {
      errors.push(translateFigensoftError(response.StatusCode, response.StatusDescription))
    }
  }

  if (errors.length > 0 && allMessageIds.length === 0) {
    return { success: false, error: errors[0] }
  }

  return {
    success: true,
    messageIds: allMessageIds,
    ...(errors.length > 0 ? { error: `Bazı paketler hatalı: ${errors.join(', ')}` } : {}),
  }
}

/**
 * Kişiselleştirilmiş SMS gönderir (N-N) — her alıcıya farklı mesaj
 */
export async function sendPersonalizedSMS(
  credentials: FigensoftCredentials,
  options: SendPersonalizedSmsOptions
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const { messages, senderId, sendDate, channel } = options

  if (!messages || messages.length === 0) {
    return { success: false, error: 'Mesaj listesi boş' }
  }

  // 800'lük paketlere böl
  const BATCH_SIZE = 800
  const batches: typeof messages[] = []
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    batches.push(messages.slice(i, i + BATCH_SIZE))
  }

  const allMessageIds: string[] = []
  const errors: string[] = []

  for (const batch of batches) {
    const body: Record<string, any> = {
      Messages: batch.map(m => ({
        Receiver: normalizePhoneForFigensoft(m.receiver),
        Message: m.message,
      })),
    }

    if (senderId || credentials.senderId) {
      body.Originator = senderId || credentials.senderId
    }
    if (sendDate) body.SendDate = sendDate
    if (channel) body.Channel = channel

    const response = await figensoftRequest<SmsSendResponse>(
      '/v1/Sms/Send_N_N',
      body,
      credentials
    )

    if (response.StatusCode === 200 && response.Result?.Messages) {
      const ids = response.Result.Messages
        .map(m => m.MessageId)
        .filter(Boolean) as string[]
      allMessageIds.push(...ids)
    } else {
      errors.push(translateFigensoftError(response.StatusCode, response.StatusDescription))
    }
  }

  if (errors.length > 0 && allMessageIds.length === 0) {
    return { success: false, error: errors[0] }
  }

  return {
    success: true,
    messageIds: allMessageIds,
  }
}

/**
 * SMS gönderim durumunu sorgular
 */
export async function getSMSStatus(
  credentials: FigensoftCredentials,
  messageId: string
): Promise<{ success: boolean; statuses?: SmsStatusResult[]; error?: string }> {
  const response = await figensoftRequest<{ Statuses?: SmsStatusResult[] }>(
    '/v1/Sms/GetStatus',
    { MessageId: messageId },
    credentials
  )

  if (response.StatusCode === 200) {
    return { success: true, statuses: response.Result?.Statuses || [] }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

/**
 * Hesap bakiyesini sorgular
 */
export async function getBalance(
  credentials: FigensoftCredentials
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const response = await figensoftRequest<SmsBalanceResult>(
    '/v1/Credit/GetBalance',
    {},
    credentials
  )

  if (response.StatusCode === 200 && response.Result) {
    return { success: true, balance: response.Result.Balance }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

/**
 * Kullanılabilir alfanümerik başlık (Originator) listesini döner
 */
export async function getOriginators(
  credentials: FigensoftCredentials
): Promise<{ success: boolean; originators?: string[]; error?: string }> {
  const response = await figensoftRequest<{ Originators?: SmsOriginator[] }>(
    '/v1/Sms/GetOriginators',
    {},
    credentials
  )

  if (response.StatusCode === 200 && response.Result?.Originators) {
    return {
      success: true,
      originators: response.Result.Originators.map(o => o.Name),
    }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

// ============================================
// HIGH-LEVEL WRAPPERS (Tenant-aware)
// ============================================

/**
 * Tenant ID ile SMS gönderir — credentials otomatik çekilir
 */
export async function sendSMSForTenant(
  tenantId: string,
  phone: string | string[],
  message: string,
  options?: { senderId?: string; channel?: 'OTP' | 'BULK' }
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const credentials = await getFigensoftCredentials(tenantId)
  if (!credentials) {
    return { success: false, error: 'Figensoft API bilgileri tanımlanmamış. Ayarlar > Entegrasyonlar bölümünden ekleyin.' }
  }

  const receivers = Array.isArray(phone) ? phone : [phone]

  return sendSMS(credentials, {
    receivers,
    message,
    senderId: options?.senderId,
    channel: options?.channel,
  })
}

/**
 * Tenant ID ile bakiye sorgular
 */
export async function getBalanceForTenant(
  tenantId: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  const credentials = await getFigensoftCredentials(tenantId)
  if (!credentials) {
    return { success: false, error: 'Figensoft API bilgileri tanımlanmamış.' }
  }

  return getBalance(credentials)
}

// ============================================
// HELPERS
// ============================================

/**
 * Telefon numarasını Figensoft formatına normalize eder (905XXXXXXXXX)
 */
function normalizePhoneForFigensoft(phone: string): string {
  if (!phone) return ''
  let clean = String(phone).replace(/\D/g, '')

  // +90 ile başlıyorsa veya 90 ile başlıyorsa zaten doğru
  if (clean.startsWith('90') && clean.length === 12) {
    return clean
  }

  // 0 ile başlıyorsa kaldır
  if (clean.startsWith('0')) {
    clean = clean.substring(1)
  }

  // 5 ile başlıyorsa başına 90 ekle
  if (clean.startsWith('5') && clean.length === 10) {
    return '90' + clean
  }

  // Zaten 90 ile başlıyorsa
  if (clean.startsWith('90')) {
    return clean
  }

  // Fallback: başına 90 ekle
  return '90' + clean
}

/**
 * SMS log'u veritabanına kaydeder
 */
export async function logSMS(params: {
  tenantId: string
  customerId?: string
  phone: string
  message: string
  senderId?: string
  messageId?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  channel?: 'sms' | 'otp'
  errorMessage?: string
}): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    await supabase.from('sms_logs').insert({
      tenant_id: params.tenantId,
      customer_id: params.customerId || null,
      phone: params.phone,
      message: params.message,
      sender_id: params.senderId || null,
      message_id: params.messageId || null,
      status: params.status,
      channel: params.channel || 'sms',
      error_message: params.errorMessage || null,
    })
  } catch (err) {
    console.error('[Figensoft] SMS log kayıt hatası:', err)
  }
}
