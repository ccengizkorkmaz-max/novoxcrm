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
    const { token, password } = await req.json()

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

    // Fetch marketing data for this tenant
    const statusLabels: Record<string, string> = {
        'Lead': 'Aday', 'Prospect': 'Fırsat', 'Reservation': 'Opsiyonlu',
        'Opsiyon - Kapora Bekleniyor': 'Opsiyon', 'Proposal': 'Teklif Verildi',
        'Teklif - Kapora Bekleniyor': 'Teklif (Kapora)', 'Negotiation': 'Pazarlık',
        'Sold': 'Satıldı', 'Contract': 'Sözleşme', 'Completed': 'Kazanıldı',
        'Lost': 'Kaybedildi', 'Cancelled': 'İptal', 'Transferred': 'Devredildi', 'Reserved': 'Rezerve'
    }

    let allSales: any[] = []
    let page = 0
    const batchSize = 1000
    while (true) {
        const { data: batch } = await supabase
            .from('sales')
            .select('id, status, description, created_at, customer_id')
            .eq('tenant_id', share.tenant_id)
            .or('description.ilike.%Form:%,description.ilike.%Lead from%')
            .order('created_at', { ascending: false })
            .range(page * batchSize, (page + 1) * batchSize - 1)
        if (!batch || batch.length === 0) break
        allSales = allSales.concat(batch)
        if (batch.length < batchSize) break
        page++
    }

    // Build source map
    const customerIds = [...new Set(allSales.map(s => s.customer_id).filter(Boolean))]
    const sourceMap: Record<string, string> = {}
    for (let i = 0; i < customerIds.length; i += batchSize) {
        const batch = customerIds.slice(i, i + batchSize)
        const { data: custs } = await supabase.from('customers').select('id, source').in('id', batch)
        custs?.forEach(c => { sourceMap[c.id] = c.source || '' })
    }

    // Aggregate
    const channelSummary: Record<string, any> = {}
    const projectSummary: Record<string, any> = {}
    const campaignDetail: Record<string, any> = {}

    allSales.forEach(sale => {
        const desc = sale.description || ''
        const source = sourceMap[sale.customer_id] || ''
        const parsed = parseDescription(desc)
        const saleDate = new Date(sale.created_at)

        let ch = parsed.channel || source || 'Bilinmiyor'
        if (['Facebook Ads', 'Facebook', 'fb'].includes(source) || ch.includes('Facebook')) ch = 'Facebook Ads'
        else if (['Instagram', 'ig'].includes(source)) ch = 'Instagram'
        else if (source === 'WEB Form') ch = 'Web Sitesi'
        else if (['Email', 'E-Posta'].includes(source)) ch = 'E-Posta'
        else if (source === 'Whatsapp&Call Center') ch = 'WhatsApp'

        // Channel
        if (!channelSummary[ch]) channelSummary[ch] = { total: 0, today: 0, thisWeek: 0, thisMonth: 0 }
        channelSummary[ch].total++
        if (isToday(saleDate)) channelSummary[ch].today++
        if (isThisWeek(saleDate, { weekStartsOn: 1 })) channelSummary[ch].thisWeek++
        if (isThisMonth(saleDate)) channelSummary[ch].thisMonth++

        // Project
        const proj = parsed.project || 'Belirtilmemiş'
        if (!projectSummary[proj]) projectSummary[proj] = { total: 0, today: 0, thisWeek: 0, thisMonth: 0 }
        projectSummary[proj].total++
        if (isToday(saleDate)) projectSummary[proj].today++
        if (isThisWeek(saleDate, { weekStartsOn: 1 })) projectSummary[proj].thisWeek++
        if (isThisMonth(saleDate)) projectSummary[proj].thisMonth++

        // Campaign detail
        let key = parsed.project && parsed.campaign ? `${parsed.project} — ${parsed.campaign}` : parsed.project || parsed.campaign || 'Genel'
        if (!campaignDetail[key]) campaignDetail[key] = { channel: ch, project: parsed.project, campaign: parsed.campaign, total: 0, today: 0, thisWeek: 0, thisMonth: 0, statuses: {} }
        campaignDetail[key].total++
        if (isToday(saleDate)) campaignDetail[key].today++
        if (isThisWeek(saleDate, { weekStartsOn: 1 })) campaignDetail[key].thisWeek++
        if (isThisMonth(saleDate)) campaignDetail[key].thisMonth++
        const label = statusLabels[sale.status] || sale.status || 'Diğer'
        campaignDetail[key].statuses[label] = (campaignDetail[key].statuses[label] || 0) + 1
    })

    return NextResponse.json({
        totalMarketingLeads: allSales.length,
        channelData: Object.entries(channelSummary).map(([name, d]) => ({ name, ...d })).sort((a: any, b: any) => b.total - a.total),
        projectData: Object.entries(projectSummary).map(([name, d]) => ({ name, ...d })).sort((a: any, b: any) => b.total - a.total),
        formData: Object.entries(campaignDetail).map(([formName, d]) => ({ formName, ...d })).sort((a: any, b: any) => b.total - a.total),
    })
}
