/**
 * Figensoft (Posta Güvercini) E-Posta API Modülü
 * 
 * Toplu e-posta gönderimi, tekli e-posta, durumu sorgulama.
 * Kampanya ve transactional e-posta senaryoları için kullanılır.
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

export interface EmailSendResult {
  MessageId?: string
  Recipient?: string
  Status?: string
}

export interface SendEmailOptions {
  /** Alıcı e-posta adresleri */
  recipients: string[]
  /** E-posta konusu */
  subject: string
  /** HTML içerik */
  htmlBody: string
  /** Gönderen adı */
  fromName?: string
  /** Gönderen e-posta adresi */
  fromEmail?: string
  /** İleri tarihli gönderim */
  sendDate?: string
}

export interface SendPersonalizedEmailOptions {
  /** Her alıcı için farklı içerik */
  emails: Array<{
    recipient: string
    subject: string
    htmlBody: string
  }>
  fromName?: string
  fromEmail?: string
  sendDate?: string
}

// ============================================
// CORE FUNCTIONS
// ============================================

/**
 * Tek e-posta içeriğini birden fazla alıcıya gönderir
 */
export async function sendEmail(
  credentials: FigensoftCredentials,
  options: SendEmailOptions
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const { recipients, subject, htmlBody, fromName, fromEmail, sendDate } = options

  if (!recipients || recipients.length === 0) {
    return { success: false, error: 'Alıcı listesi boş' }
  }

  const body: Record<string, any> = {
    Subject: subject,
    HtmlBody: htmlBody,
    Recipients: recipients,
  }

  if (fromName) body.FromName = fromName
  if (fromEmail) body.FromEmail = fromEmail
  if (sendDate) body.SendDate = sendDate

  const response = await figensoftRequest<{ Messages?: EmailSendResult[] }>(
    '/v1/Email/Send_1_N',
    body,
    credentials
  )

  if (response.StatusCode === 200) {
    const ids = response.Result?.Messages
      ?.map(m => m.MessageId)
      .filter(Boolean) as string[] || []
    return { success: true, messageIds: ids }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

/**
 * Kişiselleştirilmiş e-posta gönderir (N-N)
 */
export async function sendPersonalizedEmail(
  credentials: FigensoftCredentials,
  options: SendPersonalizedEmailOptions
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const { emails, fromName, fromEmail, sendDate } = options

  if (!emails || emails.length === 0) {
    return { success: false, error: 'E-posta listesi boş' }
  }

  const body: Record<string, any> = {
    Emails: emails.map(e => ({
      Recipient: e.recipient,
      Subject: e.subject,
      HtmlBody: e.htmlBody,
    })),
  }

  if (fromName) body.FromName = fromName
  if (fromEmail) body.FromEmail = fromEmail
  if (sendDate) body.SendDate = sendDate

  const response = await figensoftRequest<{ Messages?: EmailSendResult[] }>(
    '/v1/Email/Send_N_N',
    body,
    credentials
  )

  if (response.StatusCode === 200) {
    const ids = response.Result?.Messages
      ?.map(m => m.MessageId)
      .filter(Boolean) as string[] || []
    return { success: true, messageIds: ids }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

/**
 * E-posta gönderim durumunu sorgular
 */
export async function getEmailStatus(
  credentials: FigensoftCredentials,
  messageId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
  const response = await figensoftRequest<{ Status?: string }>(
    '/v1/Email/GetStatus',
    { MessageId: messageId },
    credentials
  )

  if (response.StatusCode === 200) {
    return { success: true, status: response.Result?.Status }
  }

  return {
    success: false,
    error: translateFigensoftError(response.StatusCode, response.StatusDescription),
  }
}

// ============================================
// TENANT-AWARE WRAPPERS
// ============================================

/**
 * Tenant bazlı e-posta gönderimi
 */
export async function sendEmailForTenant(
  tenantId: string,
  recipients: string | string[],
  subject: string,
  htmlBody: string,
  options?: { fromName?: string; fromEmail?: string }
): Promise<{ success: boolean; messageIds?: string[]; error?: string }> {
  const credentials = await getFigensoftCredentials(tenantId)
  if (!credentials) {
    return { success: false, error: 'Figensoft API bilgileri tanımlanmamış.' }
  }

  return sendEmail(credentials, {
    recipients: Array.isArray(recipients) ? recipients : [recipients],
    subject,
    htmlBody,
    fromName: options?.fromName,
    fromEmail: options?.fromEmail,
  })
}
