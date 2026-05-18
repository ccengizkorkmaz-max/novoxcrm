'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getQualifications(tenantId: string) {
    const supabase = await createClient()
    
    // We will query lead_qualifications joined with customers and profiles
    const { data, error } = await supabase
        .from('lead_qualifications')
        .select(`
            *,
            customers (
                id,
                full_name,
                phone,
                email,
                customer_number
            ),
            profiles!lead_qualifications_assigned_to_fkey (
                id,
                full_name
            )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching qualifications:', error)
        return { error: error.message, data: [] }
    }

    return { data, error: null }
}

export async function updateQualificationStatus(id: string, status: string, disqualifyReason?: string) {
    const supabase = await createClient()
    
    const updateData: any = { status }
    if (disqualifyReason) {
        updateData.disqualify_reason = disqualifyReason
    }
    
    const { error } = await supabase
        .from('lead_qualifications')
        .update(updateData)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }
    
    revalidatePath('/[locale]/(dashboard)/lead-qualification', 'page')
    return { error: null }
}

export async function addCallNote(id: string, customerId: string, note: string, updateStatus?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    // Get user profile for tenant_id
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profile not found' }

    const updateData: any = {
        call_notes: note,
        last_call_at: new Date().toISOString(),
        last_call_by: user.id
    }
    
    if (updateStatus) {
        updateData.status = updateStatus
    }
    
    // 1. Update qualification record
    const { error: qualError } = await supabase
        .from('lead_qualifications')
        .update(updateData)
        .eq('id', id)

    if (qualError) return { error: qualError.message }

    // 2. Add to activities for historical record
    const { error: actError } = await supabase
        .from('activities')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: customerId,
            user_id: user.id,
            type: 'Call',
            summary: 'Ön Değerlendirme Görüşmesi',
            notes: note,
            status: 'Completed'
        })

    if (actError) {
        console.error('Failed to add activity:', actError)
        // Non-blocking error
    }

    revalidatePath('/[locale]/(dashboard)/lead-qualification', 'page')
    return { error: null }
}

export async function convertToSale(qualificationId: string, projectId: string, unitId: string | null = null, description: string = '') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    if (!projectId) return { error: 'Satış hunisine aktarmak için bir proje seçmelisiniz' }

    // 1. Get the qualification record
    const { data: qual, error: fetchError } = await supabase
        .from('lead_qualifications')
        .select('*')
        .eq('id', qualificationId)
        .single()
        
    if (fetchError || !qual) return { error: 'Qualification not found' }
    
    if (qual.status === 'qualified' && qual.sale_id) {
        return { error: 'Already converted to sale' }
    }

    // 2. Create the sale record
    const { data: newSale, error: saleError } = await supabase
        .from('sales')
        .insert({
            tenant_id: qual.tenant_id,
            customer_id: qual.customer_id,
            status: 'Prospect', // Start at Prospect since it's qualified
            assigned_to: qual.assigned_to || user.id,
            project_id: projectId,
            unit_id: unitId,
            description: description || ''
        })
        .select()
        .single()
        
    if (saleError) return { error: saleError.message }
    
    // 3. Update the qualification record
    const { error: updateError } = await supabase
        .from('lead_qualifications')
        .update({
            status: 'qualified',
            sale_id: newSale.id,
            project_id: projectId,
            converted_at: new Date().toISOString()
        })
        .eq('id', qualificationId)
        
    if (updateError) {
        // Rollback would be ideal here in a real transaction
        console.error('Failed to update qualification after sale creation', updateError)
    }
    
    revalidatePath('/[locale]/(dashboard)/lead-qualification', 'page')
    revalidatePath('/[locale]/(dashboard)/crm', 'page')
    
    return { error: null, saleId: newSale.id }
}

export async function revertSaleToQualification(saleId: string, targetStatus: string = 'follow_up', note: string = '') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return { error: 'Not authenticated' }

    // 1. Get the qualification record by sale_id
    const { data: qual, error: qualError } = await supabase
        .from('lead_qualifications')
        .select('id, tenant_id, customer_id')
        .eq('sale_id', saleId)
        .single()
        
    if (qualError || !qual) {
        return { error: 'Bu satış kaydı için bir ön değerlendirme geçmişi bulunamadı.' }
    }
    
    // 2. Delete the sale record
    const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId)
        
    if (deleteError) return { error: deleteError.message }

    // 3. Update the qualification record back to the targetStatus
    const { error: updateError } = await supabase
        .from('lead_qualifications')
        .update({
            status: targetStatus,
            sale_id: null,
            converted_at: null,
            disqualify_reason: targetStatus === 'disqualified' ? note || 'Satış hunisinden elendi' : null
        })
        .eq('id', qual.id)

    if (updateError) return { error: updateError.message }
    
    // 4. Log the note to activities if provided
    if (note) {
        await supabase.from('activities').insert({
            tenant_id: qual.tenant_id,
            customer_id: qual.customer_id,
            user_id: user.id,
            type: 'Note',
            summary: 'Ön Değerlendirmeye İade',
            notes: note,
            status: 'Completed'
        })
    }
    
    revalidatePath('/[locale]/(dashboard)/lead-qualification', 'page')
    revalidatePath('/[locale]/(dashboard)/crm', 'page')
    
    return { error: null }
}
