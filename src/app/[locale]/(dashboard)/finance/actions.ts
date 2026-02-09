'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { finalizeOffer } from '../crm/actions'
import { syncBrokerLeadFromSale } from '@/app/broker/actions'

/**
 * Fetches all deposits (kaporalar) in the system.
 */
export async function getDeposits() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data: deposits, error } = await supabase
        .from('deposits')
        .select(`
            *,
            customer:customers(full_name),
            sale:sales(unit_id, unit:units(unit_number, block)),
            offer:offers(unit_id, unit:units(unit_number, block))
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Deposits Error:', error)
        return []
    }

    return deposits || []
}

/**
 * Confirms a deposit as PAID and updates associated entity.
 */
export async function confirmDeposit(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch deposit details
    const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single()

    if (fetchError || !deposit) return { error: 'Deposit not found' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    // 2. Update deposit status
    const { error: updateError } = await supabase
        .from('deposits')
        .update({
            status: 'Paid',
            paid_at: new Date().toISOString()
        })
        .eq('id', depositId)

    if (updateError) return { error: updateError.message }

    // 3. Update associated sale or offer status
    if (deposit.sale_id) {
        // From 'Opsiyon - Kapora Bekleniyor' -> 'Reserved' (Opsiyonlu)
        const { error: saleError } = await supabase
            .from('sales')
            .update({ status: 'Reservation' }) // Final confirmed status
            .eq('id', deposit.sale_id)

        if (saleError) return { error: saleError.message }

        // Broker Sync
        await syncBrokerLeadFromSale(deposit.sale_id, 'Reservation')
    } else if (deposit.offer_id) {
        // Use the centralized finalization logic
        const finalizeResult = await finalizeOffer(deposit.offer_id)
        if (finalizeResult.error) return { error: finalizeResult.error }
    }

    // 4. Record Financial Transaction (Cari Kart İşlemi)
    try {
        const accountId = await ensureFinancialAccount({
            owner_type: 'Customer',
            customer_id: deposit.customer_id,
            account_name: 'Customer Account', // Will be auto-fixed if exists
            tenant_id: profile?.tenant_id || ''
        })

        await createTransaction({
            account_id: accountId,
            type: 'Credit',
            amount: deposit.amount,
            description: `Kapora Ödemesi (${deposit.paper_type === 'Check' ? 'Çek' : deposit.paper_type === 'Note' ? 'Senet' : 'Nakit/Transfer'})`,
            currency: deposit.currency,
            reference_type: 'Deposit',
            reference_id: deposit.id
        })
    } catch (txError) {
        console.error('Record Deposit Transaction Error:', txError)
        // Non-blocking for the status update
    }

    revalidatePath('/finance/deposits')
    revalidatePath('/inventory')
    revalidatePath('/offers')

    return { success: true }
}

/**
 * Confirms a refund and finalizes cancellation.
 */
export async function confirmRefund(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Fetch deposit details
    const { data: deposit, error: fetchError } = await supabase
        .from('deposits')
        .select('*')
        .eq('id', depositId)
        .single()

    if (fetchError || !deposit) return { error: 'Deposit not found' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    // 2. Update deposit status to Refunded
    const { error: updateError } = await supabase
        .from('deposits')
        .update({
            status: 'Refunded',
            updated_at: new Date().toISOString()
        })
        .eq('id', depositId)

    if (updateError) return { error: updateError.message }

    // 3. Finalize Cancellation of the associated entity
    if (deposit.sale_id) {
        // Free the Unit and update Sale
        const { data: sale } = await supabase.from('sales').select('unit_id').eq('id', deposit.sale_id).single()

        await supabase.from('sales').update({ status: 'Lost', reservation_expiry: null }).eq('id', deposit.sale_id)

        if (sale?.unit_id) {
            await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
        }

        // Broker Sync
        await syncBrokerLeadFromSale(deposit.sale_id, 'Lost')
    } else if (deposit.offer_id) {
        // Update Offer status
        await supabase.from('offers').update({ status: 'Cancelled' }).eq('id', deposit.offer_id)
    }

    // 4. Record Financial Transaction (İade Kaydı)
    try {
        const accountId = await ensureFinancialAccount({
            owner_type: 'Customer',
            customer_id: deposit.customer_id,
            account_name: 'Customer Account',
            tenant_id: profile?.tenant_id || ''
        })

        await createTransaction({
            account_id: accountId,
            type: 'Debit',
            amount: deposit.amount,
            description: 'Kapora İadesi',
            currency: deposit.currency,
            reference_type: 'Refund',
            reference_id: deposit.id
        })
    } catch (txError) {
        console.error('Record Refund Transaction Error:', txError)
    }

    revalidatePath('/finance/deposits')
    revalidatePath('/inventory')
    revalidatePath('/offers')
    revalidatePath('/crm')

    return { success: true }
}

/**
 * Cancels a pending deposit.
 */
export async function cancelDeposit(depositId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('deposits')
        .update({ status: 'Cancelled' })
        .eq('id', depositId)

    if (error) return { error: error.message }

    revalidatePath('/finance/deposits')
    return { success: true }
}

/**
 * Fetches all financial accounts with their current balances.
 */
export async function getFinancialAccounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('financial_accounts')
        .select(`
            *,
            project:projects(name),
            unit:units(block, unit_number)
        `)
        .order('account_name', { ascending: true })

    if (error) {
        console.error('Fetch Accounts Error:', error)
        return []
    }

    return data
}

/**
 * Fetches transaction history (Statement/Ekstre) for a specific account.
 */
export async function getAccountStatement(accountId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('finance_transactions')
        .select(`
            *,
            profiles:created_by ( full_name )
        `)
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false })

    if (error) {
        console.error('Fetch Statement Error:', error)
        return []
    }

    return data
}

/**
 * Records a debit or credit transaction.
 */
export async function createTransaction(params: {
    account_id: string,
    type: 'Debit' | 'Credit',
    amount: number,
    description: string,
    currency?: string,
    reference_type?: string,
    reference_id?: string,
    project_id?: string,
    unit_id?: string,
    contract_id?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const profile = (await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()).data

    const { error } = await supabase
        .from('finance_transactions')
        .insert({
            tenant_id: profile?.tenant_id,
            account_id: params.account_id,
            type: params.type,
            amount: params.amount,
            description: params.description,
            currency: params.currency || 'TRY',
            transaction_date: new Date().toISOString(),
            reference_type: params.reference_type || 'Manual',
            reference_id: params.reference_id,
            project_id: params.project_id,
            unit_id: params.unit_id,
            contract_id: params.contract_id,
            created_by: user.id
        })

    if (error) {
        console.error('Record Transaction Error:', error)
        return { error: 'İşlem kaydedilemedi.' }
    }

    revalidatePath('/finance')
    return { success: true }
}

/**
 * Fetches valuable papers (Checks/Notes) in the portfolio.
 */
export async function getValuablePapers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('valuable_papers')
        .select(`
            *,
            customers ( full_name ),
            project:projects(name),
            unit:units(block, unit_number)
        `)
        .order('due_date', { ascending: true })

    if (error) {
        console.error('Fetch Papers Error:', error)
        return []
    }

    return data
}

/**
 * Updates the status of a valuable paper.
 */
export async function updateValuablePaperStatus(id: string, status: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('valuable_papers')
        .update({ status })
        .eq('id', id)

    if (error) {
        console.error('Update Paper Status Error:', error)
        return { error: 'Durum güncellenemedi.' }
    }

    revalidatePath('/finance')
    return { success: true }
}

/**
 * Ensures a financial account exists for a specific owner.
 * Internal helper for integrations.
 */
export async function ensureFinancialAccount(params: {
    owner_type: 'Customer' | 'Broker' | 'Employee' | 'Tedarikçi' | 'Diğer',
    customer_id?: string,
    employee_id?: string,
    profile_id?: string,
    account_name: string,
    tenant_id: string,
    project_id?: string,
    unit_id?: string
}) {
    const supabase = await createClient()

    // Check existing
    let query = supabase.from('financial_accounts').select('id')
    if (params.customer_id) query = query.eq('customer_id', params.customer_id)
    else if (params.employee_id) query = query.eq('employee_id', params.employee_id)
    else if (params.profile_id) query = query.eq('profile_id', params.profile_id)
    else query = query.eq('account_name', params.account_name)

    const { data: existing } = await query.single()
    if (existing) return existing.id

    // Create new
    const { data, error } = await supabase
        .from('financial_accounts')
        .insert({
            tenant_id: params.tenant_id,
            owner_type: params.owner_type,
            customer_id: params.customer_id,
            employee_id: params.employee_id,
            profile_id: params.profile_id,
            account_name: params.account_name,
            project_id: params.project_id,
            unit_id: params.unit_id
        })
        .select('id')
        .single()

    if (error) throw error
    return data.id
}

/**
 * Manually creates a financial account.
 */
export async function createFinancialAccount(params: {
    account_name: string,
    owner_type: 'Customer' | 'Broker' | 'Employee' | 'Tedarikçi' | 'Diğer',
    account_code?: string,
    customer_id?: string,
    employee_id?: string,
    profile_id?: string,
    tax_no?: string,
    address?: string,
    project_id?: string,
    unit_id?: string,
    risk_limit?: number
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const profile = (await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()).data

    const { error } = await supabase
        .from('financial_accounts')
        .insert({
            tenant_id: profile?.tenant_id,
            account_name: params.account_name,
            account_code: params.account_code,
            owner_type: params.owner_type,
            customer_id: params.customer_id,
            employee_id: params.employee_id,
            profile_id: params.profile_id,
            tax_no: params.tax_no,
            address: params.address,
            project_id: params.project_id,
            unit_id: params.unit_id,
            risk_limit: params.risk_limit
        })

    if (error) {
        console.error('Create Account Error:', error)
        return { error: 'Hesap oluşturulamadı.' }
    }

    revalidatePath('/finance')
    return { success: true }
}

/**
 * Manually records a valuable paper.
 */
export async function createValuablePaper(params: {
    customer_id: string,
    paper_type: 'Check' | 'PromissoryNote',
    amount: number,
    currency: string,
    due_date: string,
    issue_number?: string,
    bank_name?: string,
    description?: string,
    direction?: 'Alınan' | 'Verilen',
    issuer?: string,
    project_id?: string,
    unit_id?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const profile = (await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()).data

    const { error } = await supabase
        .from('valuable_papers')
        .insert({
            tenant_id: profile?.tenant_id,
            customer_id: params.customer_id,
            paper_type: params.paper_type,
            amount: params.amount,
            currency: params.currency,
            due_date: params.due_date,
            issue_number: params.issue_number,
            bank_name: params.bank_name,
            description: params.description,
            direction: params.direction || 'Alınan',
            issuer: params.issuer,
            project_id: params.project_id,
            unit_id: params.unit_id,
            status: 'Portföyde',
            created_by: user.id
        })

    if (error) {
        console.error('Create Paper Error:', error)
        return { error: 'Evrak kaydedilemedi.' }
    }

    revalidatePath('/finance')
    return { success: true }
}

/**
 * Fetches aggregated statistics for the finance dashboard.
 */
export async function getFinanceDashboardStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const today = new Date().toISOString().split('T')[0]
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    // 1. Total Receivables / Payables from Accounts
    const { data: accounts } = await supabase.from('financial_accounts').select('balance')
    const totalAlacak = accounts?.reduce((acc, curr) => curr.balance > 0 ? acc + Number(curr.balance) : acc, 0) || 0
    const totalBorc = Math.abs(accounts?.reduce((acc, curr) => curr.balance < 0 ? acc + Number(curr.balance) : acc, 0) || 0)

    // 2. Valuable Papers Stats
    const { data: papers } = await supabase.from('valuable_papers')
        .select('amount, due_date, status, paper_type')
        .eq('status', 'Portföyde')

    const portfolioTotal = papers?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0
    const overduePapers = papers?.filter(p => p.due_date < today).reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 3. Overdue Collections from Payment Items (CRM)
    const { data: paymentItems } = await supabase.from('payment_items')
        .select('amount, due_date, status')
        .neq('status', 'Paid')
        .lt('due_date', today)

    const overdueCrmItems = paymentItems?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 4. This Month's Collections (Transactions)
    const { data: transactions } = await supabase.from('finance_transactions')
        .select('amount, type, project_id, projects(name)')
        .gte('transaction_date', startOfMonth)
        .eq('type', 'Credit')

    const collectionsThisMonth = transactions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0

    // 5. Project Based Collections
    const projectCollections: Record<string, number> = {}
    transactions?.forEach(tx => {
        const projName = (tx.projects as any)?.name || 'Diğer'
        projectCollections[projName] = (projectCollections[projName] || 0) + Number(tx.amount)
    })

    const projectData = Object.entries(projectCollections).map(([name, value]) => ({ name, value }))

    return {
        totalAlacak,
        totalBorc,
        portfolioTotal,
        overdueItems: overduePapers + overdueCrmItems,
        collectionsThisMonth,
        projectData,
        paperCount: papers?.length || 0
    }
}

/**
 * Fetches data for the Aging Report (Receivables analysis).
 */
export async function getAgingReport() {
    const supabase = await createClient()
    const today = new Date()

    // Get overdue payment items from CRM
    const { data: paymentItems } = await supabase.from('payment_items')
        .select(`
            amount, 
            due_date, 
            status,
            payment_plans (
                sales (
                    customers ( full_name ),
                    project:projects(name),
                    unit:units(block, unit_number)
                )
            )
        `)
        .neq('status', 'Paid')
        .lt('due_date', today.toISOString())
        .order('due_date')

    // Get overdue valuable papers
    const { data: papers } = await supabase.from('valuable_papers')
        .select(`
            amount, 
            due_date, 
            status,
            customers ( full_name ),
            project:projects(name),
            unit:units(block, unit_number)
        `)
        .eq('status', 'Portföyde')
        .lt('due_date', today.toISOString())
        .order('due_date')

    const agingData = [
        ...(paymentItems?.map(item => {
            const dueDate = new Date(item.due_date)
            const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            const plan = Array.isArray(item.payment_plans) ? item.payment_plans[0] : item.payment_plans
            const sale = Array.isArray(plan?.sales) ? plan?.sales[0] : plan?.sales
            return {
                id: `crm-${(item as any).id}`,
                customer: sale?.customers?.full_name || 'Bilinmiyor',
                project: sale?.project?.name,
                unit: sale?.unit ? `${sale.unit.block}-${sale.unit.unit_number}` : '',
                amount: Number(item.amount),
                due_date: item.due_date,
                delay_days: diffDays,
                type: 'Ödeme Planı'
            }
        }) || []),
        ...(papers?.map(paper => {
            const dueDate = new Date(paper.due_date)
            const diffDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            const customer = Array.isArray(paper.customers) ? paper.customers[0] : paper.customers
            const project = Array.isArray(paper.project) ? paper.project[0] : paper.project
            const unit = Array.isArray(paper.unit) ? paper.unit[0] : paper.unit
            return {
                id: `paper-${(paper as any).id}`,
                customer: customer?.full_name || 'Bilinmiyor',
                project: project?.name,
                unit: unit ? `${unit.block}-${unit.unit_number}` : '',
                amount: Number(paper.amount),
                due_date: paper.due_date,
                delay_days: diffDays,
                type: 'Çek/Senet'
            }
        }) || [])
    ]

    // Sort by delay (most delayed first)
    agingData.sort((a, b) => b.delay_days - a.delay_days)

    return agingData
}
