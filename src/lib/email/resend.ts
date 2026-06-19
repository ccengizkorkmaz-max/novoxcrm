import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Dinamik değişken doldurma ───────────────────────────────
export function renderTemplate(html: string, variables: Record<string, string>): string {
    let result = html
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value || '')
    }
    // Kalan boş değişkenleri temizle
    result = result.replace(/\{\{\s*\w+\s*\}\}/g, '')
    return result
}

// ─── Unsubscribe link ekleme ─────────────────────────────────
function addUnsubscribeLink(html: string, email: string, campaignId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.novoxcrm.com'
    const unsubUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}&campaign=${campaignId}`
    
    const unsubHtml = `
        <div style="text-align:center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 30px;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                Bu e-postayı almak istemiyorsanız 
                <a href="${unsubUrl}" style="color: #6b7280; text-decoration: underline;">buraya tıklayarak</a> 
                aboneliğinizi iptal edebilirsiniz.
            </p>
        </div>
    `
    
    // </body> tagından önce ekle, yoksa sona ekle
    if (html.includes('</body>')) {
        return html.replace('</body>', `${unsubHtml}</body>`)
    }
    return html + unsubHtml
}

// ─── Toplu email gönderimi ───────────────────────────────────
export async function sendCampaignEmails(campaignId: string) {
    const supabase = createAdminClient()
    
    // Kampanya bilgilerini al
    const { data: campaign, error: campError } = await supabase
        .from('email_campaigns')
        .select('*, email_templates(*)')
        .eq('id', campaignId)
        .single()
    
    if (campError || !campaign) {
        throw new Error(`Kampanya bulunamadı: ${campError?.message}`)
    }
    
    if (campaign.status === 'sent' || campaign.status === 'sending') {
        throw new Error('Bu kampanya zaten gönderildi veya gönderiliyor')
    }
    
    // Kampanyayı "sending" durumuna al
    await supabase
        .from('email_campaigns')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
    
    // Segment müşterilerini çek
    const { data: segment } = await supabase
        .from('outreach_segments')
        .select('filters')
        .eq('id', campaign.segment_id)
        .single()
    
    // Müşterileri filtrele
    let query = supabase
        .from('customers')
        .select('id, full_name, email, phone, communication_enabled')
        .eq('tenant_id', campaign.tenant_id)
        .eq('communication_enabled', true)
        .not('email', 'is', null)
    
    // Segment filtrelerini uygula
    if (segment?.filters) {
        const f = segment.filters
        if (f.projects?.length) query = query.in('project_id', f.projects)
        if (f.sources?.length) query = query.in('source', f.sources)
        if (f.statuses?.length) query = query.in('status', f.statuses)
    }
    
    const { data: customers } = await query
    
    if (!customers || customers.length === 0) {
        await supabase
            .from('email_campaigns')
            .update({ status: 'sent', total_recipients: 0, sent_at: new Date().toISOString() })
            .eq('id', campaignId)
        return { sent: 0, total: 0 }
    }
    
    // Opt-out listesini al (email kanalı)
    const { data: optouts } = await supabase
        .from('outreach_optouts')
        .select('phone, customer_id')
        .in('channel', ['email', 'all'])
    
    const optoutCustomerIds = new Set(optouts?.map(o => o.customer_id).filter(Boolean))
    
    // Filtrelenmiş alıcılar
    const recipients = customers.filter(c => 
        c.email && 
        c.communication_enabled !== false &&
        !optoutCustomerIds.has(c.id)
    )
    
    // Toplam alıcı sayısını güncelle
    await supabase
        .from('email_campaigns')
        .update({ total_recipients: recipients.length })
        .eq('id', campaignId)
    
    const templateHtml = campaign.html || campaign.email_templates?.html || ''
    let sentCount = 0
    let failedCount = 0
    
    // Batch olarak gönder (her batch 10 email)
    const BATCH_SIZE = 10
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE)
        
        const sendPromises = batch.map(async (customer) => {
            const variables: Record<string, string> = {
                full_name: customer.full_name || '',
                first_name: customer.full_name?.split(' ')[0] || '',
                email: customer.email || '',
                phone: customer.phone || '',
                company_name: 'Novo İnşaat',
            }
            
            const personalizedHtml = renderTemplate(templateHtml, variables)
            const finalHtml = addUnsubscribeLink(personalizedHtml, customer.email!, campaignId)
            
            try {
                const { data, error } = await resend.emails.send({
                    from: `${campaign.from_name} <${campaign.from_email}>`,
                    to: customer.email!,
                    subject: renderTemplate(campaign.subject, variables),
                    html: finalHtml,
                    headers: {
                        'List-Unsubscribe': `<${process.env.NEXT_PUBLIC_APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(customer.email!)}&campaign=${campaignId}>`,
                    },
                })
                
                if (error) {
                    await supabase.from('email_sends').insert({
                        tenant_id: campaign.tenant_id,
                        campaign_id: campaignId,
                        customer_id: customer.id,
                        email: customer.email!,
                        status: 'failed',
                        error_message: error.message,
                    })
                    failedCount++
                    return
                }
                
                await supabase.from('email_sends').insert({
                    tenant_id: campaign.tenant_id,
                    campaign_id: campaignId,
                    customer_id: customer.id,
                    email: customer.email!,
                    resend_id: data?.id || null,
                    status: 'sent',
                })
                sentCount++
            } catch (err: any) {
                await supabase.from('email_sends').insert({
                    tenant_id: campaign.tenant_id,
                    campaign_id: campaignId,
                    customer_id: customer.id,
                    email: customer.email!,
                    status: 'failed',
                    error_message: err.message,
                })
                failedCount++
            }
        })
        
        await Promise.all(sendPromises)
        
        // Progress güncelle
        await supabase
            .from('email_campaigns')
            .update({ total_sent: sentCount, updated_at: new Date().toISOString() })
            .eq('id', campaignId)
        
        // Rate limiting: batch arası 1 saniye bekle
        if (i + BATCH_SIZE < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
        }
    }
    
    // Kampanyayı tamamla
    await supabase
        .from('email_campaigns')
        .update({ 
            status: 'sent', 
            total_sent: sentCount,
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
    
    console.log(`[Email Campaign] ✅ Campaign ${campaignId}: ${sentCount} sent, ${failedCount} failed out of ${recipients.length}`)
    
    return { sent: sentCount, failed: failedCount, total: recipients.length }
}

// ─── Test email gönder ───────────────────────────────────────
export async function sendTestEmail(to: string, subject: string, html: string, fromName: string = 'Novo İnşaat', fromEmail: string = 'onboarding@novoxcrm.com') {
    const { data, error } = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to,
        subject: `[TEST] ${subject}`,
        html,
    })
    
    if (error) throw new Error(error.message)
    return data
}
