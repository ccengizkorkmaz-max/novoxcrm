'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function approveInboxItem(inboxItemId: string, projectId?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Get inbox item details
        const { data: inboxItem, error: fetchError } = await supabase
            .from('inbox_items')
            .select('*')
            .eq('id', inboxItemId)
            .eq('status', 'pending')
            .single()

        if (fetchError || !inboxItem) {
            console.error('Error fetching inbox item:', fetchError)
            return { success: false, error: 'Inbox item not found or already processed' }
        }

        // 1. Create or find customer
        let customerId: string

        if (inboxItem.email) {
            // Try to find existing customer by email
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', inboxItem.tenant_id)
                .eq('email', inboxItem.email)
                .maybeSingle()

            if (existingCustomer) {
                customerId = existingCustomer.id
            } else {
                // Create new customer
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        tenant_id: inboxItem.tenant_id,
                        full_name: inboxItem.name,
                        email: inboxItem.email,
                        phone: inboxItem.phone,
                        source: inboxItem.source,
                        status: 'active'
                    })
                    .select('id')
                    .single()

                if (customerError || !newCustomer) {
                    console.error('Error creating customer:', customerError)
                    console.error('Full error details:', JSON.stringify(customerError, null, 2))
                    return {
                        success: false,
                        error: `Failed to create customer: ${customerError?.message || 'Unknown error'}`,
                        details: customerError
                    }
                }
                customerId = newCustomer.id
            }
        } else {
            // No email, create customer anyway (phone-only customers)
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    tenant_id: inboxItem.tenant_id,
                    full_name: inboxItem.name,
                    email: inboxItem.email,
                    phone: inboxItem.phone,
                    source: inboxItem.source,
                    status: 'active'
                })
                .select('id')
                .single()

            if (customerError || !newCustomer) {
                console.error('Error creating customer (phone-only):', customerError)
                console.error('Full error details:', JSON.stringify(customerError, null, 2))
                return {
                    success: false,
                    error: `Failed to create customer: ${customerError?.message || 'Unknown error'}`,
                    details: customerError
                }
            }
            customerId = newCustomer.id
        }

        // 2. Create sale
        const { data: newSale, error: saleError } = await supabase
            .from('sales')
            .insert({
                tenant_id: inboxItem.tenant_id,
                customer_id: customerId,
                project_id: projectId || null,
                status: 'Lead',
                description: inboxItem.message
            })
            .select('id')
            .single()

        if (saleError || !newSale) {
            console.error('Error creating sale:', saleError)
            return { success: false, error: 'Failed to create sale' }
        }

        // 3. Update inbox item status
        const { error: updateError } = await supabase
            .from('inbox_items')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                sale_id: newSale.id
            })
            .eq('id', inboxItemId)

        if (updateError) {
            console.error('Error updating inbox item:', updateError)
            // Sale is already created, so we still return success
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        revalidatePath('/[locale]/(dashboard)/crm')
        revalidatePath('/[locale]/(dashboard)/customers')

        return {
            success: true,
            customer_id: customerId,
            sale_id: newSale.id
        }
    } catch (error: any) {
        console.error('Server error approving inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function updateInboxItem(inboxItemId: string, updates: {
    name?: string
    email?: string
    phone?: string
    message?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('inbox_items')
            .update(updates)
            .eq('id', inboxItemId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error updating inbox item:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')

        return { success: true }
    } catch (error: any) {
        console.error('Server error updating inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function rejectInboxItem(inboxItemId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('inbox_items')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: user.id
            })
            .eq('id', inboxItemId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error rejecting inbox item:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')

        return { success: true }
    } catch (error: any) {
        console.error('Server error rejecting inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}
