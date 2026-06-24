import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

interface SendSystemEmailParams {
    tenantId: string
    to: string
    subject: string
    html: string
    fromName?: string
}

/**
 * Sends a system email. If the tenant has configured active SMTP credentials,
 * it will use their custom SMTP server. Otherwise, it falls back to Resend.
 */
export async function sendSystemEmail(params: SendSystemEmailParams) {
    const { tenantId, to, subject, html, fromName = 'Novo CRM' } = params
    const supabase = createAdminClient()

    // Fetch active email account details for the tenant
    // Prioritize the default account, otherwise fallback to first active
    const { data: accounts, error: accountError } = await supabase
        .from('tenant_email_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('is_default', { ascending: false })

    if (accountError) {
        console.error(`[Mailer] Error fetching tenant email accounts:`, accountError)
    }

    const account = accounts?.[0]

    if (account && account.smtp_host && account.smtp_user && account.smtp_password) {
        console.log(`[Mailer] Sending email via custom SMTP (${account.email_address}) for tenant ${tenantId}...`)
        
        const port = account.smtp_port || 587
        const secure = port === 465
        
        const transporter = nodemailer.createTransport({
            host: account.smtp_host,
            port: port,
            secure: secure,
            auth: {
                user: account.smtp_user,
                pass: account.smtp_password
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        const mailOptions = {
            from: `"${fromName}" <${account.email_address}>`,
            to: to,
            subject: subject,
            html: html
        }

        const info = await transporter.sendMail(mailOptions)
        console.log(`[Mailer] Custom SMTP send success: ${info.messageId}`)
        return { success: true, method: 'SMTP', messageId: info.messageId }
    } else {
        console.log(`[Mailer] No custom SMTP configured for tenant ${tenantId}. Falling back to Resend...`)
        
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { data, error } = await resend.emails.send({
            from: `"${fromName}" <onboarding@novoxcrm.com>`,
            to: to,
            subject: subject,
            html: html
        })

        if (error) {
            console.error(`[Mailer] Resend send error:`, error.message)
            throw new Error(error.message)
        }

        console.log(`[Mailer] Resend send success: ${data?.id}`)
        return { success: true, method: 'Resend', messageId: data?.id }
    }
}
