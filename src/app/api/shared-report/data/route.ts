import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { isToday, isThisWeek, isThisMonth } from 'date-fns'

function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(':')
    if (!salt || !hash) return false
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
    return computed === hash
}

function parseDescription(desc: string) {
    let channel = '', project = '', campaign = ''
    const channelMatch = desc.match(/Lead from\s+([^(]+?)(?:\s*\(|$)/i)
    if (channelMatch) channel = channelMatch[1].trim()
    const formMatch = desc.match(/\(Form:\s*([^)]+)\)/i)
    if (formMatch) project = formMatch[1].trim()
    const campaignMatch = desc.match(/\(Campaign:\s*([^)]+)\)/i)
    if (campaignMatch) campaign = campaignMatch[1].trim()
    return { channel, project, campaign }
}

export async function POST(req: NextRequest) {
    const { token, password, startDate, endDate, datePreset } = await req.json()

    if (!token || !password) {
        return NextResponse.json({ error: 'Gerekli parametreler eksik' }, { status: 400 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify token + password
    const { data: share, error } = await supabase
        .from('shared_reports')
        .select('id, tenant_id, password_hash, expires_at, is_active, report_type')
        .eq('token', token)
        .single()

    if (error || !share || !share.is_active) {
        return NextResponse.json({ error: 'Geçersiz veya devre dışı link' }, { status: 403 })
    }
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Link süresi dolmuş' }, { status: 403 })
    }
    if (!verifyPassword(password, share.password_hash)) {
        return NextResponse.json({ error: 'Yanlış şifre' }, { status: 401 })
    }

    if (share.report_type === 'ads-analytics') {
        try {
            const { fetchAdsAnalyticsData } = await import('@/app/[locale]/(dashboard)/reports/actions')
            const result = await fetchAdsAnalyticsData(supabase, share.tenant_id, startDate, endDate, datePreset)
            return NextResponse.json(result)
        } catch (e) {
            console.error('shared ads-analytics fetch error:', e)
            return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
        }
    }

    if (share.report_type === 'hot-leads') {
        const { data: convs, error: convsError } = await supabase
            .from('whatsapp_conversations')
            .select(`
                id,
                phone_number,
                lead_score,
                hot_lead_notified,
                created_at,
                updated_at,
                customers (
                    id,
                    full_name,
                    phone,
                    source
                )
            `)
            .eq('tenant_id', share.tenant_id)
            .in('lead_score', ['hot', 'warm', 'call_requested'])
            .order('updated_at', { ascending: false })

        if (convsError) {
            console.error('getSharedHotLeadsReport error:', convsError)
            return NextResponse.json({ error: 'Veriler alınamadı' }, { status: 500 })
        }

        const formattedConvs = []
        for (const c of (convs || [])) {
            let customerId = (c.customers as any)?.id || null
            let customerName = (c.customers as any)?.full_name || ''
            let customerPhone = (c.customers as any)?.phone || c.phone_number
            let customerSource = (c.customers as any)?.source || 'WhatsApp'

            if (!customerName && c.phone_number) {
                const last10 = c.phone_number.replace(/\D/g, '').slice(-10)
                if (last10.length >= 10) {
                    const { data: matches } = await supabase
                        .from('customers')
                        .select('id, full_name, phone, source')
                        .ilike('phone', `%${last10}%`)
                        .limit(1)
                    if (matches && matches.length > 0) {
                        customerName = matches[0].full_name || ''
                        customerPhone = matches[0].phone || c.phone_number
                        customerSource = matches[0].source || 'WhatsApp'
                        customerId = matches[0].id
                    }
                }
            }

            let projectName = 'Genel'
            if (customerId) {
                const { data: qual } = await supabase
                    .from('lead_qualifications')
                    .select(`
                        projects:project_id (
                            name
                        )
                    `)
                    .eq('customer_id', customerId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                const projObj = qual?.projects as any
                if (projObj) {
                    if (Array.isArray(projObj) && projObj.length > 0) {
                        projectName = projObj[0].name || 'Genel'
                    } else if (projObj.name) {
                        projectName = projObj.name
                    }
                }
            }

            const { data: recentMessages } = await supabase
                .from('whatsapp_messages')
                .select('role, content, created_at')
                .eq('conversation_id', c.id)
                .order('created_at', { ascending: false })
                .limit(5)

            let summary = ''
            if (recentMessages && recentMessages.length > 0) {
                summary = recentMessages
                    .reverse()
                    .map(m => `${m.role === 'user' ? 'Müşteri' : 'AI'}: ${m.content.substring(0, 100).replace(/\n/g, ' ')}`)
                    .join(' | ')
            }

            formattedConvs.push({
                id: c.id,
                customerName: customerName || 'Bilinmeyen Müşteri',
                customerPhone,
                customerSource,
                leadScore: c.lead_score,
                hotLeadNotified: c.hot_lead_notified,
                updatedAt: c.updated_at,
                createdAt: c.created_at,
                summary: summary || '-',
                projectName
            })
        }

        return NextResponse.json({
            reportType: 'hot-leads',
            leads: formattedConvs
        })
    }

    // Fetch marketing data for this tenant
    const statusLabels: Record<string, string> = {
        'Lead': 'Aday', 'Prospect': 'Fırsat', 'Reservation': 'Opsiyonlu',
        'Opsiyon - Kapora Bekleniyor': 'Opsiyon', 'Proposal': 'Teklif Verildi',
        'Teklif - Kapora Bekleniyor': 'Teklif (Kapora)', 'Negotiation': 'Pazarlık',
        'Sold': 'Satıldı', 'Contract': 'Sözleşme', 'Completed': 'Kazanıldı',
        'Lost': 'Kaybedildi', 'Cancelled': 'İptal', 'Transferred': 'Devredildi', 'Reserved': 'Rezerve'
    }

    // Fetch aggregated summaries from marketing database views (zero loops, extremely fast)
    const [channelSummaryRes, projectSummaryRes, campaignGroupedRes] = await Promise.all([
        supabase
            .from('marketing_channel_summary')
            .select('name, total, today, this_week, this_month')
            .eq('tenant_id', share.tenant_id)
            .order('total', { ascending: false }),
        supabase
            .from('marketing_project_summary')
            .select('name, total, today, this_week, this_month')
            .eq('tenant_id', share.tenant_id)
            .order('total', { ascending: false }),
        supabase
            .from('marketing_form_campaign_grouped')
            .select('form_name, channel, campaign, total, today, this_week, this_month, statuses')
            .eq('tenant_id', share.tenant_id)
    ])

    const channelSummary = channelSummaryRes.data || []
    const projectSummary = projectSummaryRes.data || []
    const campaignRows = campaignGroupedRes.data || []

    const channelData = channelSummary.map(row => ({
        name: row.name,
        total: row.total,
        today: row.today,
        thisWeek: row.this_week,
        thisMonth: row.this_month
    }))

    const projectData = projectSummary.map(row => ({
        name: row.name,
        total: row.total,
        today: row.today,
        thisWeek: row.this_week,
        thisMonth: row.this_month
    }))

    // Group and aggregate campaigns/statuses on Next.js side from the grouped SQL rows
    const campaignDetail: Record<string, any> = {}
    let totalMarketingLeads = 0

    campaignRows.forEach(row => {
        const formName = row.form_name || 'Diğer'
        totalMarketingLeads += row.total

        if (!campaignDetail[formName]) {
            campaignDetail[formName] = {
                formName,
                total: 0, today: 0, thisWeek: 0, thisMonth: 0,
                channel: row.channel,
                statuses: {}
            }
        }

        const form = campaignDetail[formName]
        form.total += row.total
        form.today += row.today
        form.thisWeek += row.this_week
        form.thisMonth += row.this_month

        // Aggregate statuses
        if (row.statuses && typeof row.statuses === 'object') {
            Object.entries(row.statuses).forEach(([status, count]) => {
                const label = statusLabels[status] || status || 'Diğer'
                form.statuses[label] = (form.statuses[label] || 0) + Number(count)
            })
        }
    })

    return NextResponse.json({
        totalMarketingLeads,
        channelData,
        projectData,
        formData: Object.entries(campaignDetail).map(([formName, d]) => ({ formName, ...d })).sort((a: any, b: any) => b.total - a.total),
    })
}
