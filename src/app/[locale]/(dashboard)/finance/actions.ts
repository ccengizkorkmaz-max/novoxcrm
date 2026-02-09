'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all financial accounts with their current balances.
 */
export async function getFinancialAccounts() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
        .from('financial_accounts')
        .select('*')
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
    reference_id?: string
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
            customers ( full_name )
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
    tenant_id: string
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
            account_name: params.account_name
        })
        .select('id')
        .single()

    if (error) throw error
    return data.id
}
