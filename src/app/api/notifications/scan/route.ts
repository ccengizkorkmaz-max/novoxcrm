import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications/create'
import { fetchUnreadEmails } from '@/lib/email/fetcher'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && key !== cronSecret) {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient() // Use admin client for system-wide scan
    const results = {
        expiringReservations: 0,
        overduePayments: 0,
        dueTodayPayments: 0,
        approachingDelivery: 0,
        approachingPapers: 0,
        staleLeads: 0,
        newEmails: 0,
        errors: [] as string[]
    }

    try {
        const { data: allSettings } = await supabase.from('notification_settings').select('*')
        const { data: tenants } = await supabase.from('tenants').select('id')
        const tenantIds = tenants?.map(t => t.id) || []

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const tomorrow = new Date(today)
        tomorrow.setDate(today.getDate() + 1)

        const threeDaysLater = new Date(today)
        threeDaysLater.setDate(today.getDate() + 3)

        const sevenDaysLater = new Date(today)
        sevenDaysLater.setDate(today.getDate() + 7)

        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(today.getDate() - 7)

        for (const tenantId of tenantIds) {
            const settings = allSettings?.find(s => s.tenant_id === tenantId)

            // 1. Expiring Reservations
            const { data: expiringSales } = await supabase
                .from('sales')
                .select(`
                    id, status, reservation_expiry,
                    customers (full_name),
                    units (unit_number, block, projects (name))
                `)
                .eq('tenant_id', tenantId)
                .in('status', ['Reservation', 'Opsiyon - Kapora Bekleniyor'])
                .not('reservation_expiry', 'is', null)
                .lte('reservation_expiry', tomorrow.toISOString())
                .gte('reservation_expiry', today.toISOString())

            for (const sale of expiringSales || []) {
                const customerName = (sale as any).customers?.full_name || 'Müşteri'
                const unitInfo = (sale as any).units ? `${(sale as any).units.block || ''} ${(sale as any).units.unit_number}` : ''
                const projectName = (sale as any).units?.projects?.name || ''
                const expiryDate = new Date(sale.reservation_expiry!).toLocaleDateString('tr-TR')

                await createNotification({
                    tenant_id: tenantId,
                    type: 'Warning',
                    category: 'CRM',
                    title: '⏰ Opsiyon Süresi Dolmak Üzere',
                    message: `${customerName} - ${projectName} ${unitInfo} opsiyonu ${expiryDate} tarihinde sona eriyor.`,
                    link: '/crm'
                })
                results.expiringReservations++
            }

            // 2. Overdue & Due Today Payments (Using payment_plans table)
            if (settings?.notify_overdue_payments !== false) {
                // Fetch payments due today or in the past that are not paid
                const { data: pendingPayments } = await supabase
                    .from('payment_plans')
                    .select(`
                        id, amount, due_date, currency, status,
                        contracts(
                            id, contract_number, 
                            contract_customers(role, customers(full_name))
                        )
                    `)
                    .eq('contracts.tenant_id', tenantId)
                    .neq('status', 'Paid')
                    .neq('status', 'Cancelled')
                    .lte('due_date', today.toISOString())
                    .limit(50)

                for (const item of pendingPayments || []) {
                    // Find primary customer
                    const customers = (item as any).contracts?.contract_customers || []
                    const primary = customers.find((c: any) => c.role === 'Primary') || customers[0]
                    const customerName = primary?.customers?.full_name || 'Müşteri'

                    const dueDate = new Date(item.due_date)
                    const isDueToday = dueDate.getTime() === today.getTime()

                    const amount = new Intl.NumberFormat('tr-TR', {
                        style: 'currency',
                        currency: item.currency || 'TRY',
                        maximumFractionDigits: 0
                    }).format(item.amount)

                    if (isDueToday) {
                        await createNotification({
                            tenant_id: tenantId,
                            type: 'Info',
                            category: 'Finance',
                            title: '📅 Bugün Ödeme Günü',
                            message: `${customerName} - ${amount} tutarındaki ödemenin vadesi bugündür.`,
                            link: `/contracts/${(item as any).contracts?.id}`
                        })
                        results.dueTodayPayments++
                    } else {
                        await createNotification({
                            tenant_id: tenantId,
                            type: 'Alert',
                            category: 'Finance',
                            title: '🔴 Gecikmiş Ödeme',
                            message: `${customerName} - ${amount} tutarındaki ödeme ${dueDate.toLocaleDateString('tr-TR')} tarihinde vadesi geçmiştir.`,
                            link: `/contracts/${(item as any).contracts?.id}`
                        })
                        results.overduePayments++
                    }
                }
            }

            // 3. Approaching Delivery Dates
            const { data: deliveryContracts } = await supabase
                .from('contracts')
                .select('id, contract_number, delivery_date, unit_id, units(unit_number, block)')
                .eq('tenant_id', tenantId)
                .neq('status', 'Cancelled')
                .neq('delivery_status', 'Delivered')
                .gte('delivery_date', today.toISOString())
                .lte('delivery_date', sevenDaysLater.toISOString())

            for (const contract of deliveryContracts || []) {
                const deliveryDate = new Date(contract.delivery_date!).toLocaleDateString('tr-TR')
                const unitInfo = (contract as any).units ? `${(contract as any).units.block || ''} ${(contract as any).units.unit_number}` : ''

                await createNotification({
                    tenant_id: tenantId,
                    type: 'Info',
                    category: 'Inventory',
                    title: '📦 Yaklaşan Teslimat',
                    message: `${contract.contract_number} nolu sözleşmenin (${unitInfo}) teslimat tarihi yaklaşıyor: ${deliveryDate}`,
                    link: `/contracts/${contract.id}`
                })
                results.approachingDelivery++
            }

            // 4. Approaching Papers (Checks/Promissory Notes)
            if (settings?.notify_approaching_checks !== false) {
                const { data: approachingPapers } = await supabase
                    .from('valuable_papers')
                    .select('id, amount, due_date, paper_type, currency, customers(full_name)')
                    .eq('tenant_id', tenantId)
                    .in('status', ['Portfolio', 'Portföyde'])
                    .gte('due_date', today.toISOString())
                    .lte('due_date', threeDaysLater.toISOString())

                for (const paper of approachingPapers || []) {
                    const customerName = (paper as any).customers?.full_name || 'Müşteri'
                    const dueDate = new Date(paper.due_date).toLocaleDateString('tr-TR')
                    const paperType = paper.paper_type === 'Check' ? 'Çek' : 'Senet'
                    const amount = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: paper.currency || 'TRY', maximumFractionDigits: 0 }).format(paper.amount)

                    await createNotification({
                        tenant_id: tenantId,
                        type: 'Info',
                        category: 'Finance',
                        title: `📋 Yaklaşan ${paperType} Vadesi`,
                        message: `${customerName} - ${amount} tutarındaki ${paperType.toLowerCase()} ${dueDate} tarihinde vadeli.`,
                        link: '/finance?tab=papers'
                    })
                    results.approachingPapers++
                }
            }

            // 5. Stale Leads
            if (settings?.notify_new_leads !== false) {
                const { data: activeLeads } = await supabase
                    .from('sales')
                    .select('id, status, updated_at, assigned_to, customers(full_name)')
                    .eq('tenant_id', tenantId)
                    .in('status', ['Lead', 'Prospect', 'Contacted', 'Proposal', 'Negotiation'])
                    .lt('updated_at', sevenDaysAgo.toISOString())
                    .limit(20)

                for (const lead of activeLeads || []) {
                    const customerName = (lead as any).customers?.full_name || 'Müşteri'
                    const lastUpdate = new Date(lead.updated_at)
                    const daysSinceUpdate = Math.floor((today.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))

                    await createNotification({
                        tenant_id: tenantId,
                        user_id: lead.assigned_to,
                        type: 'Warning',
                        category: 'CRM',
                        title: '💤 Hareketsiz Satış Fırsatı',
                        message: `${customerName} ile ${daysSinceUpdate} gündür hiçbir işlem yapılmadı.`,
                        link: '/crm'
                    })
                    results.staleLeads++
                }
            }

            // 6. NEW: Fetch External Emails from IMAP
            const { data: emailAccounts } = await supabase
                .from('tenant_email_accounts')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('is_active', true)

            console.log(`[Scan] Found ${emailAccounts?.length || 0} active email accounts for tenant ${tenantId}`)

            for (const acc of emailAccounts || []) {
                try {
                    console.log(`[Scan] Fetching emails for ${acc.email_address}...`)
                    const unread = await fetchUnreadEmails({
                        host: acc.incoming_host,
                        port: acc.incoming_port,
                        user: acc.incoming_user || acc.username || acc.email_address,
                        pass: acc.incoming_password || acc.password,
                        tls: acc.incoming_encryption === 'SSL' || acc.incoming_encryption === 'TLS'
                    })

                    console.log(`[Scan] Fetched ${unread.length} unread messages for ${acc.email_address}`)

                    for (const email of unread) {
                        // Extract basic info
                        const senderName = email.from.split('<')[0].trim().replace(/"/g, '') || email.from
                        const senderEmail = email.from.match(/<(.+?)>/)?.[1] || email.from

                        // Create Inbox Item (Manual approval required in UI)
                        const { error: inboxErr } = await supabase.from('inbox_items').insert({
                            tenant_id: tenantId,
                            name: senderName,
                            email: senderEmail,
                            message: `**${email.subject}**\n\n${email.text || email.html || ''}`,
                            source: 'Email',
                            status: 'pending'
                        })

                        if (!inboxErr) {
                            results.newEmails++
                            // Create a system notification for the new email lead
                            await createNotification({
                                tenant_id: tenantId,
                                type: 'Info',
                                category: 'CRM',
                                title: '📧 Yeni E-posta Talebi',
                                message: `${senderName} isimli müşteriden yeni bir e-posta talebi geldi: ${email.subject}`,
                                link: '/inbox'
                            })
                        }
                    }
                } catch (e: any) {
                    console.error(`Email fetch error for ${acc.email_address}:`, e.message)
                    results.errors.push(`Email (${acc.email_address}): ${e.message}`)
                }
            }
        }
    } catch (err: any) {
        console.error('Scan Error:', err)
        results.errors.push(err.message)
    }

    return NextResponse.json({ success: true, scanned_at: new Date().toISOString(), ...results })
}
