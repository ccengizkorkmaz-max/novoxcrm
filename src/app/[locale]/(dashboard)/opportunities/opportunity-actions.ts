'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateOpportunityStage(opportunityId: string, newStage: string) {
    const supabase = await createClient()

    // 1. Get current user & tenant_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

    // 2. Fetch the opportunity details first to get customer_id, project_id, lead_id
    const { data: opp, error: fetchErr } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (fetchErr || !opp) {
        return { success: false, error: 'Fırsat bulunamadı' }
    }

    // 3. Update opportunity stage
    const { error: updateErr } = await supabase
        .from('opportunities')
        .update({
            stage: newStage,
            updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)

    if (updateErr) {
        return { success: false, error: `Fırsat güncellenemedi: ${updateErr.message}` }
    }

    // 4. Synchronize with related Sales record (legacy CRM pipeline)
    // Map opportunity stages to sales status
    const stageToSalesStatusMap: Record<string, string> = {
        'prospect': 'Prospect',
        'qualified': 'Prospect',
        'proposal': 'Proposal',
        'negotiation': 'Negotiation',
        'won': 'Completed',
        'lost': 'Lost'
    }

    const salesStatus = stageToSalesStatusMap[newStage.toLowerCase()]
    if (salesStatus) {
        // Find sales record(s) for this customer and project
        let salesQuery = supabase
            .from('sales')
            .select('id, status')
            .eq('tenant_id', profile.tenant_id)
            .eq('customer_id', opp.customer_id)

        if (opp.project_id) {
            salesQuery = salesQuery.eq('project_id', opp.project_id)
        }

        const { data: salesList } = await salesQuery

        if (salesList && salesList.length > 0) {
            const { updateSaleStatus } = await import('@/app/[locale]/(dashboard)/crm/actions')
            for (const s of salesList) {
                if (s.status !== salesStatus) {
                    await updateSaleStatus(s.id, salesStatus)
                }
            }
        }
    }

    // 5. Synchronize with related Lead record
    // Map opportunity stages to leads status
    const stageToLeadsStatusMap: Record<string, string> = {
        'won': 'converted',
        'lost': 'lost',
        'prospect': 'contacted',
        'qualified': 'qualified'
    }

    const leadStatus = stageToLeadsStatusMap[newStage.toLowerCase()]
    if (leadStatus) {
        if (opp.lead_id) {
            await supabase
                .from('leads')
                .update({
                    status: leadStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', opp.lead_id)
                .neq('status', 'converted')
        } else {
            // Fallback: look up lead by converted_customer_id
            await supabase
                .from('leads')
                .update({
                    status: leadStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('converted_customer_id', opp.customer_id)
                .neq('status', 'converted')
        }
    }

    revalidatePath('/[locale]/(dashboard)/opportunities')
    revalidatePath('/[locale]/(dashboard)/leads')
    revalidatePath('/[locale]/(dashboard)/crm')

    return { success: true }
}

export async function getSaleForOpportunity(opportunityId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return null

    // Fetch opportunity to get customer_id & project_id
    const { data: opp } = await supabase
        .from('opportunities')
        .select('customer_id, project_id, title')
        .eq('id', opportunityId)
        .eq('tenant_id', profile.tenant_id)
        .single()

    if (!opp) return null

    // Get matching sales record
    let salesQuery = supabase
        .from('sales')
        .select('id, unit_id, final_price, currency, units(price, currency), customers(full_name)')
        .eq('tenant_id', profile.tenant_id)
        .eq('customer_id', opp.customer_id)

    if (opp.project_id) {
        salesQuery = salesQuery.eq('project_id', opp.project_id)
    }

    const { data: salesList } = await salesQuery
    if (salesList && salesList.length > 0) {
        const firstSale = salesList[0] as any
        const customerName = Array.isArray(firstSale.customers)
            ? (firstSale.customers[0]?.full_name || '')
            : (firstSale.customers?.full_name || '')
        const totalAmount = firstSale.final_price || firstSale.units?.price || 0
        const initialCurrency = firstSale.currency || firstSale.units?.currency || 'TRY'
        return {
            saleId: firstSale.id,
            customerName,
            currentUnitId: firstSale.unit_id,
            totalAmount,
            initialCurrency
        }
    }

    // Fallback: If no matching sales record exists, create one!
    const { data: customer } = await supabase
        .from('customers')
        .select('full_name')
        .eq('id', opp.customer_id)
        .single()

    const { data: newSale } = await supabase
        .from('sales')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: opp.customer_id,
            project_id: opp.project_id || null,
            status: 'Prospect',
            description: `Otomatik oluşturuldu: Fırsat #${opp.title}`
        })
        .select('id')
        .single()

    if (newSale) {
        return {
            saleId: newSale.id,
            customerName: customer?.full_name || '',
            currentUnitId: null,
            totalAmount: 0,
            initialCurrency: 'TRY'
        }
    }

    return null
}
