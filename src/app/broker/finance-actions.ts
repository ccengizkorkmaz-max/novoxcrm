'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

/**
 * Fetch all brokers financial summary (Admin view)
 */
export async function getAdminBrokerFinanceSummary() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    if (!profile || !['admin', 'owner', 'management'].includes(profile.role || '')) return { error: 'Unauthorized' }

    // 1. Get all brokers with their profile info
    const { data: brokers, error: brokersError } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            email,
            broker_levels (name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'broker')

    if (brokersError) return { error: brokersError.message }

    // 2. Get all commissions and incentives for these brokers in this tenant
    const { data: commissions } = await supabase
        .from('commissions')
        .select('amount, status, broker_leads!inner(broker_id, tenant_id)')
        .eq('broker_leads.tenant_id', profile.tenant_id)

    const { data: incentives } = await supabase
        .from('incentive_earnings')
        .select('amount, status, broker_id')
        .eq('tenant_id', profile.tenant_id)

    // 3. Map results
    const summary = brokers.map(broker => {
        const brokerCommissions = commissions?.filter((c: any) => c.broker_leads.broker_id === broker.id) || []
        const brokerIncentives = incentives?.filter(i => i.broker_id === broker.id) || []

        const totalEarned = [...brokerCommissions, ...brokerIncentives].reduce((sum, item) => sum + Number(item.amount), 0)
        const totalPaid = [...brokerCommissions, ...brokerIncentives]
            .filter(item => item.status === 'Paid')
            .reduce((sum, item) => sum + Number(item.amount), 0)

        const balance = totalEarned - totalPaid

        return {
            id: broker.id,
            name: broker.full_name,
            email: broker.email,
            level: Array.isArray(broker.broker_levels) ? broker.broker_levels[0]?.name : (broker.broker_levels as any)?.name,
            totalEarned,
            totalPaid,
            balance
        }
    })

    return { data: summary }
}

/**
 * Fetch detailed financial records for a specific broker
 */
export async function getBrokerFinanceDetail(brokerId: string) {
    const supabase = await createClient()

    // Fetch commissions linked to this broker
    const { data: commissions } = await supabase
        .from('commissions')
        .select('*, broker_leads!inner(full_name, created_at)')
        .eq('broker_leads.broker_id', brokerId)
        .order('created_at', { ascending: false })

    // Fetch incentives linked to this broker
    const { data: incentives } = await supabase
        .from('incentive_earnings')
        .select('*, campaign_id(name)')
        .eq('broker_id', brokerId)
        .order('created_at', { ascending: false })

    // Fetch actual payment records
    const { data: payments } = await supabase
        .from('broker_payments')
        .select('*')
        .eq('broker_id', brokerId)
        .order('payment_date', { ascending: false })

    return {
        commissions: commissions || [],
        incentives: incentives || [],
        payments: payments || []
    }
}

/**
 * Record a new payment to a broker
 */
export async function recordBrokerPayment(data: {
    broker_id: string,
    amount: number,
    currency: string,
    payment_method: string,
    reference_no?: string,
    notes?: string,
    itemIds: { type: 'commission' | 'incentive', id: string }[]
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    // 1. Create Payment Record
    const { data: payment, error: pError } = await supabase
        .from('broker_payments')
        .insert({
            tenant_id: adminProfile?.tenant_id,
            broker_id: data.broker_id,
            amount: data.amount,
            currency: data.currency,
            payment_method: data.payment_method,
            reference_no: data.reference_no,
            notes: data.notes
        })
        .select()
        .single()

    if (pError) return { error: pError.message }

    // 2. Link items and update status
    for (const item of data.itemIds) {
        if (item.type === 'commission') {
            await supabase
                .from('commissions')
                .update({ status: 'Paid', payment_id: payment.id, payment_date: new Date().toISOString() })
                .eq('id', item.id)
        } else {
            await supabase
                .from('incentive_earnings')
                .update({ status: 'Paid', payment_id: payment.id })
                .eq('id', item.id)
        }
    }

    revalidatePath(`/admin/broker-finances/${data.broker_id}`)
    return { success: true }
}

/**
 * Excel Export Logic (Helper to be used by client component)
 */
export async function exportFinancesData() {
    const res = await getAdminBrokerFinanceSummary()
    if (res.error || !res.data) return null
    return res.data
}

/**
 * Process Bulk Payment Import from Excel
 */
export async function processBulkPaymentImport(base64Data: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: adminProfile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!adminProfile) return { error: 'Admin profili bulunamadı.' }

    try {
        const buffer = Buffer.from(base64Data, 'base64')
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

        let processedCount = 0
        let errorCount = 0

        for (const row of jsonData) {
            const email = row['Broker Email']
            const amount = Number(row['Ödeme Tutarı'])
            const refNo = row['Referans No']
            const method = row['Ödeme Yöntemi'] || 'Excel Import'

            if (!email || isNaN(amount)) {
                errorCount++
                continue
            }

            // Find broker
            const { data: broker } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .eq('tenant_id', adminProfile.tenant_id)
                .single()

            if (!broker) {
                errorCount++
                continue
            }

            // Create payment record
            const { data: payment, error: pError } = await supabase.from('broker_payments').insert({
                tenant_id: adminProfile.tenant_id,
                broker_id: broker.id,
                amount,
                payment_method: method,
                reference_no: refNo,
                notes: 'Toplu ödeme yükleme (Excel)'
            }).select().single()

            if (pError) {
                errorCount++
                continue
            }

            // Fetch eligible commissions starting from oldest
            const { data: comms } = await supabase
                .from('commissions')
                .select('id, amount, broker_leads!inner(broker_id)')
                .eq('status', 'Eligible')
                .eq('broker_leads.broker_id', broker.id)
                .order('created_at', { ascending: true })

            let remainingAmount = amount
            if (comms) {
                for (const c of comms) {
                    if (remainingAmount <= 0) break
                    const payAmount = Math.min(remainingAmount, Number(c.amount))

                    await supabase.from('commissions').update({
                        status: 'Paid',
                        payment_id: payment.id,
                        payment_date: new Date().toISOString()
                    }).eq('id', c.id)

                    remainingAmount -= payAmount
                }
            }

            processedCount++
        }

        revalidatePath('/admin/broker-finances')
        return { success: true, processedCount, errorCount }

    } catch (e: any) {
        console.error('Excel Import Error:', e)
        return { error: 'Excel dosyası işlenirken hata oluştu.' }
    }
}
