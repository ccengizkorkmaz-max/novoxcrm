/**
 * Figensoft Entegrasyon Modülleri
 * 
 * Posta Güvercini (SMS, E-Posta, İYS) ve TİKo (Ödeme) servislerinin 
 * NovoCRM entegrasyonu.
 * 
 * @see https://www.postaguvercini.com/AnaSayfa/api-dokumanlari.aspx
 */

// Base client
export {
  type FigensoftCredentials,
  type FigensoftApiResponse,
  figensoftRequest,
  getFigensoftCredentials,
  translateFigensoftError,
} from './client'

// SMS
export {
  sendSMS,
  sendPersonalizedSMS,
  getSMSStatus,
  getBalance,
  getOriginators,
  sendSMSForTenant,
  getBalanceForTenant,
  logSMS,
} from './sms'

// OTP
export {
  sendOTPForTenant,
  verifyOTP,
} from './otp'

// E-Posta
export {
  sendEmail,
  sendPersonalizedEmail,
  getEmailStatus,
  sendEmailForTenant,
} from './email'
