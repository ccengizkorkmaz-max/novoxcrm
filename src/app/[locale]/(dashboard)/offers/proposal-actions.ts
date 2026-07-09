'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage, getWhatsAppLink, normalizePhone } from '@/lib/whatsapp'
import { sendSystemEmail } from '@/lib/email/mailer'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ───────────────────────────────────────────────────────────────

export interface ProposalData {
    // Offer
    offerId: string
    offerNumber: string
    offerPrice: number
    offerCurrency: string
    validUntil: string | null
    offerStatus: string
    proposalToken: string

    // Customer
    customerName: string
    customerPhone: string | null
    customerEmail: string | null

    // Project
    projectName: string
    projectCity: string | null
    deliveryDate: string | null

    // Unit
    unitNumber: string
    unitType: string | null
    unitFloor: number | null
    unitBlock: string | null
    areaGross: number | null
    areaNet: number | null
    listPrice: number
    listCurrency: string

    // Payment Plan
    paymentPlan: {
        payment_items: {
            payment_type: string
            amount: number
            due_date: string
            description?: string
            percentage?: number
        }[]
        total_amount?: number
        interest_amount?: number
        installment_count?: number
    } | null

    // Deposit (Kapora)
    deposit: {
        amount: number
        currency: string
        status: string
    } | null

    // Consultant (Sales Rep)
    consultantName: string
    consultantPhone: string | null
    consultantEmail: string | null

    // Branding
    companyName: string
    logoUrl: string | null

    // Generated date
    generatedAt: string
}

// ─── Generate Proposal Token ─────────────────────────────────────────────

async function ensureProposalToken(offerId: string): Promise<string | null> {
    const supabase = await createClient()

    // Check if token already exists
    const { data: offer } = await supabase
        .from('offers')
        .select('proposal_token')
        .eq('id', offerId)
        .single()

    if (offer?.proposal_token) return offer.proposal_token

    // Generate a new unique token
    const token = generateToken()

    const { error } = await supabase
        .from('offers')
        .update({ proposal_token: token })
        .eq('id', offerId)

    if (error) {
        console.error('[Proposal] Token generation error:', error)
        return null
    }

    return token
}

function generateToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// ─── Data Aggregation (for Dashboard Preview & Public Page) ──────────────

export async function getProposalData(offerId: string): Promise<{ data: ProposalData | null; error: string | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return await fetchProposalDataInternal(offerId, supabase)
}

// Public version: uses admin client, called from public page
export async function getProposalDataByToken(token: string): Promise<{ data: ProposalData | null; error: string | null; expired?: boolean }> {
    const supabase = createAdminClient()

    // Find offer by token
    const { data: offer, error } = await supabase
        .from('offers')
        .select('id, valid_until')
        .eq('proposal_token', token)
        .single()

    if (error || !offer) {
        return { data: null, error: 'Teklif bulunamadı.' }
    }

    // Check if expired
    if (offer.valid_until && new Date(offer.valid_until) < new Date()) {
        // Still return data but mark as expired so the page can show an expiry banner
    }

    // Track view
    supabase
        .from('offers')
        .update({
            proposal_views: (offer as any).proposal_views ? (offer as any).proposal_views + 1 : 1,
            proposal_last_viewed_at: new Date().toISOString()
        })
        .eq('id', offer.id)
        .then(({ error: trackErr }) => {
            if (trackErr) console.error('[Proposal] View tracking error:', trackErr)
        })

    return await fetchProposalDataInternal(offer.id, supabase)
}

async function fetchProposalDataInternal(offerId: string, supabase: any): Promise<{ data: ProposalData | null; error: string | null }> {
    // 1. Fetch offer with all relations
    const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select(`
            *,
            customers(full_name, phone, email),
            units(
                unit_number, type, floor, block_id, area_gross, area_net, price, currency,
                blocks(name),
                projects(name, city, delivery_date)
            ),
            offer_negotiations(
                id, proposed_price, proposed_currency, proposed_valid_until, proposed_payment_plan, status,
                created_at
            )
        `)
        .eq('id', offerId)
        .single()

    if (offerError || !offer) {
        return { data: null, error: 'Teklif bulunamadı.' }
    }

    // 2. Get the consultant (offer creator) profile
    const createdBy = offer.user_id || offer.created_by
    let consultantName = 'Satis Danismani'
    let consultantPhone: string | null = null
    let consultantEmail: string | null = null

    if (createdBy) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone, email, tenant_id')
            .eq('id', createdBy)
            .single()

        if (profile) {
            consultantName = profile.full_name || consultantName
            consultantPhone = profile.phone || null
            consultantEmail = profile.email || null
        }
    }

    // 3. Get tenant_id
    const tenantId = offer.tenant_id

    // 4. Check for deposit (kapora)
    let depositInfo: ProposalData['deposit'] = null
    const { data: deposit } = await supabase
        .from('deposits')
        .select('amount, currency, status')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (deposit) {
        depositInfo = {
            amount: deposit.amount,
            currency: deposit.currency || offer.currency || 'TRY',
            status: deposit.status
        }
    }

    // 5. Get branding from tenant
    let companyName = 'Novo CRM'
    let logoUrl: string | null = null

    if (tenantId) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('name, brand_config')
            .eq('id', tenantId)
            .single()

        if (tenant) {
            companyName = tenant.name || companyName
            if (tenant.brand_config && typeof tenant.brand_config === 'object') {
                logoUrl = (tenant.brand_config as any).logoUrl || null
            }
        }
    }

    // 6. Determine effective price/plan (latest approved negotiation or offer defaults)
    let effectivePrice = offer.price
    let effectiveCurrency = offer.currency || 'TRY'
    let effectiveValidUntil = offer.valid_until
    let effectivePaymentPlan = offer.payment_plan

    const negotiations = offer.offer_negotiations || []
    if (negotiations.length > 0) {
        const sorted = [...negotiations].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const approved = sorted.find((n: any) => n.status === 'Approved')
        const latest = approved || sorted[0]

        effectivePrice = latest.proposed_price || effectivePrice
        effectiveCurrency = latest.proposed_currency || effectiveCurrency
        effectiveValidUntil = latest.proposed_valid_until || effectiveValidUntil
        if (latest.proposed_payment_plan) {
            effectivePaymentPlan = latest.proposed_payment_plan
        }
    }

    // 7. Build unit info
    const unit = offer.units as any
    const project = unit?.projects as any
    const block = unit?.blocks as any

    const proposalData: ProposalData = {
        offerId: offer.id,
        offerNumber: offer.offer_number || '-',
        offerPrice: effectivePrice,
        offerCurrency: effectiveCurrency,
        validUntil: effectiveValidUntil,
        offerStatus: offer.status,
        proposalToken: offer.proposal_token || '',

        customerName: (offer.customers as any)?.full_name || 'Müşteri',
        customerPhone: (offer.customers as any)?.phone || null,
        customerEmail: (offer.customers as any)?.email || null,

        projectName: project?.name || '-',
        projectCity: project?.city || null,
        deliveryDate: project?.delivery_date || null,

        unitNumber: unit?.unit_number || '-',
        unitType: unit?.type || null,
        unitFloor: unit?.floor ?? null,
        unitBlock: block?.name || null,
        areaGross: unit?.area_gross || null,
        areaNet: unit?.area_net || null,
        listPrice: unit?.price || effectivePrice,
        listCurrency: unit?.currency || effectiveCurrency,

        paymentPlan: effectivePaymentPlan || null,

        deposit: depositInfo,

        consultantName,
        consultantPhone,
        consultantEmail,

        companyName,
        logoUrl,

        generatedAt: new Date().toISOString()
    }

    return { data: proposalData, error: null }
}

// ─── Create Proposal Link ───────────────────────────────────────────────

export async function createProposalLink(offerId: string): Promise<{ url: string | null; error: string | null }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { url: null, error: 'Unauthorized' }

    const token = await ensureProposalToken(offerId)
    if (!token) return { url: null, error: 'Token oluşturulamadı.' }

    // Build the public URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.novoxcrm.com'
    const url = `${baseUrl}/tr/teklif/${token}`

    return { url, error: null }
}

// ─── Share via WhatsApp ──────────────────────────────────────────────────

export async function shareProposalViaWhatsApp(
    offerId: string
): Promise<{ success: boolean; waLink?: string; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Get offer + customer
    const { data: offer } = await supabase
        .from('offers')
        .select('offer_number, proposal_token, customers(full_name, phone)')
        .eq('id', offerId)
        .single()

    if (!offer) return { success: false, error: 'Teklif bulunamadı.' }

    const customer = offer.customers as any
    if (!customer?.phone) return { success: false, error: 'Müşteri telefon numarası bulunamadı.' }

    // Ensure token exists
    const token = await ensureProposalToken(offerId)
    if (!token) return { success: false, error: 'Token oluşturulamadı.' }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.novoxcrm.com'
    const proposalUrl = `${baseUrl}/tr/teklif/${token}`

    const message = `Sayın ${customer.full_name}, size özel hazırlanan teklif belgenizi aşağıdaki linkten inceleyebilirsiniz:\n\n${proposalUrl}\n\nDetaylı bilgi için bize ulaşabilirsiniz.`

    // Try Cloud API first
    try {
        const result = await sendWhatsAppMessage(customer.phone, message)
        if (result.success) {
            return { success: true }
        }
    } catch (err) {
        console.error('[Proposal WA] Cloud API failed:', err)
    }

    // Fallback to wa.me link
    const waLink = getWhatsAppLink(customer.phone, message)
    return { success: false, waLink, error: 'WhatsApp API kullanılamadı. Aşağıdaki linki kullanabilirsiniz.' }
}

// ─── Share via Email ─────────────────────────────────────────────────────

export async function shareProposalViaEmail(
    offerId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Get offer + customer
    const { data: offer } = await supabase
        .from('offers')
        .select('offer_number, proposal_token, customers(full_name, email)')
        .eq('id', offerId)
        .single()

    if (!offer) return { success: false, error: 'Teklif bulunamadı.' }

    const customer = offer.customers as any
    if (!customer?.email) return { success: false, error: 'Müşteri e-posta adresi bulunamadı.' }

    // Ensure token
    const token = await ensureProposalToken(offerId)
    if (!token) return { success: false, error: 'Token oluşturulamadı.' }

    // Get profile for tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı.' }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.novoxcrm.com'
    const proposalUrl = `${baseUrl}/tr/teklif/${token}`

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); padding: 32px; border-radius: 16px 16px 0 0;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 800;">Teklif Belgeniz Hazır</h1>
                <p style="color: #94a3b8; margin: 8px 0 0; font-size: 13px;">Teklif No: ${offer.offer_number || '-'}</p>
            </div>
            <div style="padding: 32px; background: #f8fafc; border: 1px solid #e2e8f0; border-top: none;">
                <p style="color: #334155; font-size: 15px; line-height: 1.7;">
                    Sayın <strong>${customer.full_name}</strong>,
                </p>
                <p style="color: #475569; font-size: 14px; line-height: 1.7;">
                    Size özel hazırlanan teklif belgenizi aşağıdaki bağlantıdan detaylı olarak inceleyebilirsiniz.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <a href="${proposalUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #fff; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(59,130,246,0.3);">
                        Teklifimi İncele →
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; text-align: center;">
                    Sayfa üzerinden teklifi PDF olarak da indirebilirsiniz.
                </p>
            </div>
            <div style="padding: 16px 32px; background: #f1f5f9; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
                <p style="color: #94a3b8; font-size: 10px; margin: 0;">
                    Bu e-posta otomatik olarak gönderilmiştir.
                </p>
            </div>
        </div>
    `

    try {
        await sendSystemEmail({
            tenantId: profile.tenant_id,
            to: customer.email,
            subject: `Teklif Belgeniz Hazır - ${offer.offer_number || ''}`,
            html,
            fromName: profile.full_name || 'Novo CRM'
        })

        return { success: true }
    } catch (err: any) {
        console.error('[Proposal Email] Error:', err)
        return { success: false, error: err.message || 'E-posta gönderim hatası.' }
    }
}
