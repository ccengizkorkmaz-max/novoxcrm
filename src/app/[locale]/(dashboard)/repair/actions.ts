
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function runRepair() {
    const supabase = await createClient()
    const logs: string[] = []

    try {
        logs.push('🔍 Searching for contract SZL-20260206-841...')

        // 1. Find Contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('contract_number', 'SZL-20260206-841')
            .single()

        if (contractError || !contract) {
            logs.push('❌ Contract not found: ' + (contractError?.message || 'No data'))
            return { success: false, logs, error: 'Contract not found' }
        }

        logs.push(`✅ Found Contract ID: ${contract.id}`)
        logs.push(`ℹ️ Current Status: ${contract.status}`)
        logs.push(`ℹ️ Unit ID: ${contract.unit_id}`)

        // 2. Fix Contract Status
        if (contract.status !== 'Cancelled') {
            logs.push('🔧 Updating contract status to Cancelled...')
            const { error } = await supabase.from('contracts').update({ status: 'Cancelled' }).eq('id', contract.id)
            if (error) logs.push('❌ Error updating contract: ' + error.message)
            else logs.push('✅ Contract status updated.')
        } else {
            logs.push('✅ Contract already Cancelled.')
        }

        // 3. Fix Unit Status
        if (contract.unit_id) {
            // Check current unit status
            const { data: unit } = await supabase.from('units').select('status').eq('id', contract.unit_id).single()
            logs.push(`ℹ️ Current Unit Status: ${unit?.status}`)

            if (unit?.status !== 'For Sale') {
                logs.push('🔧 Force updating Unit to "For Sale"...')
                const { error: unitError } = await supabase
                    .from('units')
                    .update({ status: 'For Sale' })
                    .eq('id', contract.unit_id)

                if (unitError) logs.push('❌ Error updating unit: ' + unitError.message)
                else logs.push('✅ Unit status updated to "For Sale".')
            } else {
                logs.push('✅ Unit is already "For Sale".')
            }

            // 4. Fix Sales Records
            logs.push('🔍 Checking Sales records for this unit...')
            const { data: sales } = await supabase.from('sales').select('id, status').eq('unit_id', contract.unit_id)

            if (sales && sales.length > 0) {
                logs.push(`ℹ️ Found ${sales.length} sales records.`)
                for (const sale of sales) {
                    if (sale.status === 'Sold' || sale.status === 'Completed' || sale.status === 'Contract') {
                        logs.push(`🔧 Cancelling Sale ID: ${sale.id} (Status: ${sale.status})...`)
                        await supabase.from('sales').update({ status: 'Cancelled' }).eq('id', sale.id)
                    } else {
                        logs.push(`ℹ️ Sale ${sale.id} status is "${sale.status}" (OK).`)
                    }
                }
            }
        }

        // 5. Fix Payment Plans
        logs.push('🔍 Checking Payment Plans...')
        const { data: plans } = await supabase.from('payment_plans').select('id, status').eq('contract_id', contract.id)
        if (plans && plans.length > 0) {
            logs.push(`ℹ️ Found ${plans.length} payment plans.`)
            const { error: ppError } = await supabase
                .from('payment_plans')
                .update({ status: 'Cancelled' })
                .eq('contract_id', contract.id)
            if (ppError) logs.push('❌ Error cancelling plans: ' + ppError.message)
            else logs.push('✅ All payment plans marked as Cancelled.')
        }

        // 6. Fix Finance Transactions
        logs.push('🔍 Checking Finance Transactions...')
        // Delete by contract_id
        const { count: count1 } = await supabase.from('finance_transactions').select('*', { count: 'exact', head: true }).eq('contract_id', contract.id)
        if (count1) {
            logs.push(`🗑️ Deleting ${count1} transactions linked to contract...`)
            await supabase.from('finance_transactions').delete().eq('contract_id', contract.id)
        }

        // Delete by unit_id (if not linked to other active contracts? Be careful.)
        // Actually, for specific contract repair, we should be careful. 
        // But since this unit is being reset, we should clear transactions for this unit that are NOT cancelled?
        // Let's stick to contract_id and payment_plans reference.

        if (plans && plans.length > 0) {
            const planIds = plans.map(p => p.id)
            const { count: count2 } = await supabase.from('finance_transactions').select('*', { count: 'exact', head: true }).in('reference_id', planIds)
            if (count2) {
                logs.push(`🗑️ Deleting ${count2} transactions linked to payment plans...`)
                await supabase.from('finance_transactions').delete().in('reference_id', planIds)
            }
        }

        revalidatePath('/')
        revalidatePath('/dashboard')
        revalidatePath('/inventory')

        return { success: true, logs }

    } catch (error: any) {
        logs.push('❌ CRITICAL ERROR: ' + error.message)
        return { success: false, logs, error: error.message }
    }
}
