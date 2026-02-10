'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from '@/lib/notifications/create'

// Helper function to log contract activities
async function logContractActivity(
    supabase: any,
    contractId: string,
    activityType: string,
    description: string,
    metadata?: any
) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!profile?.tenant_id || !user) return

    await supabase.from('contract_activities').insert({
        tenant_id: profile.tenant_id,
        contract_id: contractId,
        activity_type: activityType,
        description: description,
        metadata: metadata,
        performed_by: user.id
    })
}

export async function createContract(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Extract basic fields
    const project_id = formData.get('project_id') as string || null
    const unit_id = formData.get('unit_id') as string || null
    const contract_number = formData.get('contract_number') as string
    const contract_date = formData.get('contract_date') as string
    const delivery_date = formData.get('delivery_date') as string
    const sales_rep_id = formData.get('sales_rep_id') as string
    const currency = formData.get('currency') as string
    const amount = parseFloat(formData.get('amount') as string) || 0
    const notes = formData.get('notes') as string

    // Extract JSON fields
    const selectedCustomersRaw = formData.get('selectedCustomers') as string
    const paymentPlanRaw = formData.get('payment_plan') as string

    const selectedCustomers: string[] = selectedCustomersRaw ? JSON.parse(selectedCustomersRaw) : []
    const paymentPlan: any[] = paymentPlanRaw ? JSON.parse(paymentPlanRaw) : []

    // Basic validation
    if (!contract_number) return { error: 'Sözleşme numarası gereklidir.' }
    if (!amount || amount <= 0) return { error: 'Geçerli bir sözleşme tutarı girilmelidir.' }
    if (!contract_date) return { error: 'Sözleşme tarihi gereklidir.' }
    if (!unit_id) return { error: 'Ünite seçimi zorunludur.' }

    try {
        // Get Tenant ID
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) throw new Error('No tenant found')

        // 1. Insert Contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .insert({
                tenant_id: profile.tenant_id,
                project_id,
                unit_id,
                sales_rep_id: sales_rep_id || user.id,
                contract_number,
                contract_date,
                delivery_date: delivery_date || null,
                currency,
                amount,
                final_amount: amount, // Logic for discount to be added
                total_amount: amount, // Logic for VAT to be added
                notes,
                created_by: user.id,
                status: 'Draft'
            })
            .select()
            .single()

        if (contractError) throw contractError

        // 2. Insert Contract Customers
        if (selectedCustomers.length > 0) {
            const customerInserts = selectedCustomers.map((customerId, index) => ({
                contract_id: contract.id,
                customer_id: customerId,
                role: index === 0 ? 'Primary' : 'Partner', // First one is primary for now
                share_percentage: 100 / selectedCustomers.length // Split equally for now
            }))

            const { error: customerError } = await supabase
                .from('contract_customers')
                .insert(customerInserts)

            if (customerError) throw customerError // Should manually rollback contract here ideally
        }

        // 3. Insert Payment Plan
        if (paymentPlan.length > 0) {
            const planInserts = paymentPlan.map(item => ({
                contract_id: contract.id,
                payment_type: item.payment_type,
                due_date: item.due_date,
                amount: item.amount,
                currency: item.currency,
                notes: item.notes,
                status: 'Pending'
            }))

            const { error: planError } = await supabase
                .from('payment_plans')
                .insert(planInserts)

            if (planError) throw planError
        }

        // 4. Update Unit Status (if Unit ID is present)
        if (unit_id) {
            const { error: unitError } = await supabase
                .from('units')
                .update({ status: 'Sold' }) // Or 'Contracted'/'Reserved'
                .eq('id', unit_id)

            // Log error but don't fail the whole process for unit update
            if (unitError) console.error('Failed to update unit status', unitError)
        }

        revalidatePath('/contracts')
        return { success: true, data: contract }
    } catch (error: any) {
        console.error('Create Contract Error:', error)
        return { error: error.message }
    }
}

export async function updateContract(id: string, formData: FormData) {
    const supabase = await createClient()

    // Extract fields to update
    const updates: any = {}
    const allowedFields = ['contract_number', 'status', 'amount', 'notes', 'delivery_date']

    for (const field of allowedFields) {
        const value = formData.get(field)
        if (value !== null) updates[field] = value
    }

    try {
        const { error } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)

        if (error) throw error

        revalidatePath(`/contracts/${id}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function signContract(id: string) {
    const supabase = await createClient()
    try {
        // 1. Get contract details
        const { data: contract } = await supabase
            .from('contracts')
            .select('unit_id, contract_number')
            .eq('id', id)
            .single()

        if (!contract) throw new Error('Sözleşme bulunamadı')

        // 2. Update contract status to Signed
        const { error: contractError } = await supabase
            .from('contracts')
            .update({ status: 'Signed' })
            .eq('id', id)

        if (contractError) throw contractError

        // 3. Update unit status to Sold (lock the unit)
        if (contract.unit_id) {
            const { error: unitError } = await supabase
                .from('units')
                .update({ status: 'Sold' })
                .eq('id', contract.unit_id)

            if (unitError) throw unitError

            // 4. Complete all related sales records for this unit
            await supabase
                .from('sales')
                .update({ status: 'Completed' })
                .eq('unit_id', contract.unit_id)
                .in('status', ['Reservation', 'Opsiyon - Kapora Bekleniyor', 'Sold', 'Proposal', 'Negotiation', 'Teklif - Kapora Bekleniyor', 'Prospect'])

            // 5. Close any active offers for this unit
            await supabase
                .from('offers')
                .update({ status: 'Closed' })
                .eq('unit_id', contract.unit_id)
                .in('status', ['Sent', 'Accepted'])
        }

        // 6. Log activity
        await logContractActivity(
            supabase,
            id,
            'status_changed',
            `Sözleşme imzalandı (${contract.contract_number})`,
            { old_status: 'Draft', new_status: 'Signed', unit_id: contract.unit_id }
        )

        // 7. Notification: Contract signed
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', (await supabase.auth.getUser()).data.user?.id).single()
        if (profile?.tenant_id) {
            await createNotification({
                tenant_id: profile.tenant_id,
                type: 'Success',
                category: 'Finance',
                title: '✍️ Sözleşme İmzalandı',
                message: `${contract.contract_number} nolu sözleşme başarıyla imzalandı. Ünite satış listesinden çıkarıldı.`,
                link: `/contracts/${id}`
            })
        }

        revalidatePath(`/contracts/${id}`)
        revalidatePath('/contracts')
        revalidatePath('/inventory')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function payInstallment(paymentId: string, contractId: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('payment_plans')
            .update({
                status: 'Paid',
                paid_date: new Date().toISOString(),
                paid_amount: supabase.rpc('get_current_payment_amount', { p_id: paymentId }) // Simplified, let's just use a direct update for now
            })
            .eq('id', paymentId)

        // Correcting the paid_amount logic for simplicity in MVP
        // In a real app we'd fetch the amount first or use a subquery.
        // Let's just set status and paid_date first.

        const { data: p } = await supabase.from('payment_plans').select('amount').eq('id', paymentId).single()

        const { error: updateError } = await supabase
            .from('payment_plans')
            .update({
                status: 'Paid',
                paid_date: new Date().toISOString(),
                paid_amount: p?.amount || 0
            })
            .eq('id', paymentId)

        if (updateError) throw updateError

        // Log activity
        await logContractActivity(
            supabase,
            contractId,
            'payment_confirmed',
            `Ödeme alındı: ${p?.amount || 0} TL`,
            { payment_id: paymentId, amount: p?.amount || 0 }
        )

        revalidatePath(`/contracts/${contractId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function cancelContract(id: string, reason?: string) {
    const supabase = await createClient()
    try {
        // 1. Get contract details (including unit and tenant)
        const { data: contract } = await supabase
            .from('contracts')
            .select('unit_id, id, tenant_id, sale_id')
            .eq('id', id)
            .single()

        if (!contract) throw new Error('Sözleşme bulunamadı')

        // Get primary customer for valuable papers cleanup
        const { data: primaryCustomer } = await supabase
            .from('contract_customers')
            .select('customer_id')
            .eq('contract_id', id)
            .eq('role', 'Primary')
            .single()

        const customer_id = primaryCustomer?.customer_id

        // 2. Update contract status
        const { error: contractError } = await supabase
            .from('contracts')
            .update({
                status: 'Cancelled',
                notes: reason ? `İptal Nedeni: ${reason}` : undefined
            })
            .eq('id', id)

        if (contractError) throw contractError

        // 3. Release unit and related sales
        if (contract.unit_id) {
            // Restore unit to 'For Sale'
            const { error: unitError } = await supabase
                .from('units')
                .update({ status: 'For Sale' })
                .eq('id', contract.unit_id)

            if (unitError) console.error('Failed to release unit during cancellation', unitError)

            // Log unit activity
            try {
                const { logUnitActivity } = await import('../inventory/actions')
                await logUnitActivity(
                    contract.unit_id,
                    'status_change',
                    `Sözleşme iptal edildi. Ünite tekrar satışa açıldı.${reason ? ` (Neden: ${reason})` : ''}`,
                    'Sold',
                    'For Sale',
                    { reason, contractId: id }
                )
            } catch (e) {
                console.error('Failed to log unit activity during contract cancellation:', e)
            }

            // 4. Update Sales Status (Mark AS MANY AS POSSIBLE AS Cancelled)
            await supabase
                .from('sales')
                .update({ status: 'Cancelled' })
                .eq('unit_id', contract.unit_id)
                .in('status', ['Sold', 'Completed', 'Contract', 'Prospect', 'Reservation', 'Proposal'])
        } else if (contract.sale_id) {
            await supabase.from('sales').update({ status: 'Cancelled' }).eq('id', contract.sale_id)
        }

        // 5. Cancel Payment Plans
        const { data: plans } = await supabase.from('payment_plans')
            .select('id')
            .eq('contract_id', id)

        await supabase
            .from('payment_plans')
            .update({ status: 'Cancelled' })
            .eq('contract_id', id)

        // 6. Handle Deposits (If PAID, mark as Refund Pending)
        if (contract.sale_id) {
            const { data: deposits } = await supabase
                .from('deposits')
                .select('id, status')
                .eq('sale_id', contract.sale_id)

            if (deposits && deposits.length > 0) {
                for (const dep of deposits) {
                    if (dep.status === 'Paid') {
                        await supabase.from('deposits').update({ status: 'Refund Pending' }).eq('id', dep.id)
                    } else if (dep.status === 'Pending') {
                        await supabase.from('deposits').update({ status: 'Cancelled' }).eq('id', dep.id)
                    }
                }
            }
        }

        // 7. Handle Valuable Papers (Checks/Promissory Notes)
        if (customer_id) {
            const { data: papers } = await supabase
                .from('valuable_papers')
                .select('id')
                .eq('tenant_id', contract.tenant_id)
                .match({ customer_id: customer_id, unit_id: contract.unit_id })
                .in('status', ['Portfolio', 'Portföyde'])

            if (papers && papers.length > 0) {
                const paperIds = papers.map(p => p.id)
                await supabase.from('valuable_papers')
                    .update({ status: 'Rejected' })
                    .in('id', paperIds)
            }
        }

        // 8. Cleanup Finance Transactions (DELETE)
        await supabase.from('finance_transactions').delete().eq('contract_id', id)

        if (plans && plans.length > 0) {
            const planIds = plans.map(p => p.id)
            await supabase.from('finance_transactions').delete().in('reference_id', planIds)
        }

        // 9. Notification: Contract cancelled
        if (contract.tenant_id) {
            await createNotification({
                tenant_id: contract.tenant_id,
                type: 'Alert',
                category: 'Finance',
                title: '🚫 Sözleşme İptal Edildi',
                message: `${id.slice(0, 8)}... referanslı sözleşme iptal edildi. Ünite tekrar satışa açıldı.`,
                link: '/contracts'
            })
        }

        revalidatePath(`/contracts/${id}`)
        revalidatePath('/contracts')
        revalidatePath('/inventory')
        revalidatePath('/dashboard')
        revalidatePath('/crm')

        return { success: true }
    } catch (error: any) {
        console.error('Cancel Contract Error:', error)
        return { error: error.message }
    }
}

export async function deleteContract(id: string) {
    const supabase = await createClient()
    try {
        // 1. Get contract info first
        const { data: contract } = await supabase
            .from('contracts')
            .select('unit_id, id')
            .eq('id', id)
            .single()

        if (!contract) throw new Error('Sözleşme bulunamadı')

        // 2. Release unit
        if (contract.unit_id) {
            await supabase.from('units').update({ status: 'For Sale' }).eq('id', contract.unit_id)

            // Log unit activity
            try {
                const { logUnitActivity } = await import('../inventory/actions')
                await logUnitActivity(
                    contract.unit_id,
                    'status_change',
                    'Sözleşme iptal edildi/silindi, ünite tekrar satışa açıldı.',
                    'Sold',
                    'For Sale'
                )
            } catch (e) {
                console.error('Failed to log unit activity during contract deletion:', e)
            }
        }

        // 3. Delete the contract (Cascading will handle customers, payments, documents, activities if set up)
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/contracts')
        revalidatePath('/inventory')
        return { success: true }
    } catch (error: any) {
        console.error('Delete Contract Error:', error)
        return { error: error.message }
    }
}


export async function transferContract(id: string, notes: string) {
    const supabase = await createClient()
    try {
        const { data: contract } = await supabase.from('contracts').select('contract_number, tenant_id').eq('id', id).single()

        const { error } = await supabase
            .from('contracts')
            .update({
                status: 'Transferred',
                notes: notes
            })
            .eq('id', id)

        if (error) throw error

        // Notification: Contract transferred
        if (contract?.tenant_id) {
            await createNotification({
                tenant_id: contract.tenant_id,
                type: 'Warning',
                category: 'Finance',
                title: '🔄 Sözleşme Devredildi',
                message: `${contract.contract_number} nolu sözleşme devir işlemi yapıldı.`,
                link: `/contracts/${id}`
            })
        }

        revalidatePath(`/contracts/${id}`)
        revalidatePath('/contracts')
        return { success: true }
    } catch (error: any) {
        console.error('Transfer Contract Error:', error)
        return { error: error.message }
    }
}

export async function getPaymentTemplates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .eq('tenant_id', profile.tenant_id)

    return templates || []
}

export async function seedDefaultPaymentTemplates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant not found' }

    // 1. Fetch existing templates for this tenant to avoid duplicates
    const { data: existingTemplates } = await supabase
        .from('payment_plan_templates')
        .select('name')
        .eq('tenant_id', profile.tenant_id)

    const existingNames = new Set(existingTemplates?.map(t => t.name) || [])

    const defaultTemplates = [
        {
            tenant_id: profile.tenant_id,
            name: 'Standart (%25 Peşin, 12 Taksit)',
            down_payment_rate: 25,
            installment_count: 12,
            interim_payment_structure: []
        },
        {
            tenant_id: profile.tenant_id,
            name: 'Standart (%20 Peşin, 24 Taksit)',
            down_payment_rate: 20,
            installment_count: 24,
            interim_payment_structure: []
        },
        {
            tenant_id: profile.tenant_id,
            name: 'Ara Ödemeli (%30 Peşin, 6. ve 12. Ay Ara Ödeme)',
            down_payment_rate: 30,
            installment_count: 12,
            interim_payment_structure: [{ month: 6, rate: 10 }, { month: 12, rate: 10 }]
        },
        {
            tenant_id: profile.tenant_id,
            name: 'Yarısı Peşin (12 Taksit)',
            down_payment_rate: 50,
            installment_count: 12,
            interim_payment_structure: []
        }
    ]

    // 2. Only insert templates that don't exist yet
    const templatesToInsert = defaultTemplates.filter(t => !existingNames.has(t.name))

    if (templatesToInsert.length === 0) return { success: true }

    const { error } = await supabase
        .from('payment_plan_templates')
        .insert(templatesToInsert)

    if (error) {
        console.error('Seed Templates Error Detail:', JSON.stringify(error, null, 2))
        return { error: error.message || 'Unknown error during seeding' }
    }

    return { success: true }
}
export async function updateContractDeliveryDetails(id: string, deliveryStatus: string, titleDeedStatus: string) {
    const supabase = await createClient()
    try {
        const { error } = await supabase
            .from('contracts')
            .update({
                delivery_status: deliveryStatus,
                title_deed_status: titleDeedStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) throw error

        // Log activity
        await logContractActivity(
            supabase,
            id,
            'status_changed',
            `Teslimat/Tapu durumları güncellendi. (Teslimat: ${deliveryStatus}, Tapu: ${titleDeedStatus})`,
            { delivery_status: deliveryStatus, title_deed_status: titleDeedStatus }
        )

        revalidatePath(`/contracts/${id}`)
        return { success: true }
    } catch (error: any) {
        console.error('Update Delivery Details Error:', error)
        return { error: error.message }
    }
}
