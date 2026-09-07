'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function quickCreateCustomer(formData: { full_name: string; phone?: string; email?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const { data: customer, error } = await supabase
        .from('customers')
        .insert({
            tenant_id: profile.tenant_id,
            user_id: user.id,
            full_name: formData.full_name.trim(),
            phone: formData.phone?.trim() || null,
            email: formData.email?.trim() || null,
            source: 'Fiyat & Teklif Masası'
        })
        .select('id, full_name, phone, email')
        .single()

    if (error) {
        console.error('Quick customer creation error:', error)
        return { error: error.message }
    }

    return { customer }
}

export async function saveQuoteToCRM(payload: {
    customerId: string
    unitId?: string
    finalPrice: number
    currency: string
    scenarioTitle: string
    downPaymentAmount: number
    downPaymentRate: number
    installmentCount: number
    paymentItems: any[]
    notes?: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    try {
        // 1. Check or create a sale record in Pipeline (Offer / Negotiation stage)
        let saleId: string | null = null

        const { data: existingSale } = await supabase
            .from('sales')
            .select('id, status')
            .eq('customer_id', payload.customerId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (existingSale) {
            saleId = existingSale.id
            // Update final price & unit if specified
            await supabase
                .from('sales')
                .update({
                    unit_id: payload.unitId || undefined,
                    final_price: payload.finalPrice,
                    currency: payload.currency,
                    updated_at: new Date().toISOString()
                })
                .eq('id', saleId)
        } else {
            // Create a new sale lead
            const { data: newSale, error: saleErr } = await supabase
                .from('sales')
                .insert({
                    tenant_id: profile.tenant_id,
                    user_id: user.id,
                    customer_id: payload.customerId,
                    unit_id: payload.unitId || null,
                    final_price: payload.finalPrice,
                    currency: payload.currency,
                    status: 'Teklif'
                })
                .select('id')
                .single()

            if (saleErr) throw saleErr
            saleId = newSale.id
        }

        // 2. Also save an official offer record in offers table
        const validUntil = new Date()
        validUntil.setDate(validUntil.getDate() + 15) // 15 days validity

        const { data: newOffer, error: offerErr } = await supabase
            .from('offers')
            .insert({
                tenant_id: profile.tenant_id,
                user_id: user.id,
                customer_id: payload.customerId,
                unit_id: payload.unitId || null,
                sale_id: saleId,
                price: payload.finalPrice,
                currency: payload.currency,
                status: 'Draft',
                valid_until: validUntil.toISOString().split('T')[0],
                notes: `${payload.scenarioTitle} - ${payload.notes || ''}`.trim(),
                payment_plan: {
                    scenario: payload.scenarioTitle,
                    down_payment_rate: payload.downPaymentRate,
                    down_payment_amount: payload.downPaymentAmount,
                    installments: payload.installmentCount,
                    payment_items: payload.paymentItems
                }
            })
            .select('id')
            .single()

        if (offerErr) {
            console.warn('Could not insert to offers table (fallback to payment_plans):', offerErr.message)
        }

        // 3. Save payment plan to payment_plans and payment_items
        if (saleId && payload.paymentItems?.length) {
            // delete old items if any
            const { data: existingPlan } = await supabase
                .from('payment_plans')
                .select('id')
                .eq('sale_id', saleId)
                .maybeSingle()

            let planId = existingPlan?.id

            if (!planId) {
                const { data: createdPlan } = await supabase
                    .from('payment_plans')
                    .insert({
                        tenant_id: profile.tenant_id,
                        sale_id: saleId,
                        total_amount: payload.finalPrice
                    })
                    .select('id')
                    .single()
                planId = createdPlan?.id
            } else {
                await supabase
                    .from('payment_plans')
                    .update({ total_amount: payload.finalPrice })
                    .eq('id', planId)

                await supabase
                    .from('payment_items')
                    .delete()
                    .eq('payment_plan_id', planId)
            }

            if (planId) {
                const itemsToInsert = payload.paymentItems.map(item => ({
                    payment_plan_id: planId,
                    description: item.description,
                    amount: item.amount,
                    due_date: item.due_date,
                    payment_mode: item.payment_mode || 'Cash',
                    interest_amount: item.interest_amount || 0
                }))

                await supabase.from('payment_items').insert(itemsToInsert)
            }
        }

        // 4. Log activity
        await supabase
            .from('activities')
            .insert({
                tenant_id: profile.tenant_id,
                user_id: user.id,
                customer_id: payload.customerId,
                type: 'Note',
                subject: `Özel Teklif Çalışıldı: ${payload.finalPrice.toLocaleString('tr-TR')} ${payload.currency}`,
                description: `${payload.scenarioTitle} | Peşinat: %${payload.downPaymentRate} (${payload.downPaymentAmount.toLocaleString('tr-TR')} ${payload.currency}) | Taksit: ${payload.installmentCount} Ay`,
                date: new Date().toISOString()
            })

        revalidatePath('/crm')
        revalidatePath('/offers')

        return { success: true, saleId, offerId: newOffer?.id }
    } catch (err: any) {
        console.error('Error saving quote to CRM:', err)
        return { error: err.message || 'Teklif kaydedilirken bir hata oluştu' }
    }
}
