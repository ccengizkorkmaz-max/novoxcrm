'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// ==========================================
// 1. SUBCONTRACTORS ACTIONS
// ==========================================

export async function createSubcontractor(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant profile not found' }

    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const contactName = formData.get('contact_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!name || !category) {
        return { error: 'Adı ve Kategori alanları zorunludur.' }
    }

    const { error } = await supabase
        .from('subcontractors')
        .insert({
            tenant_id: profile.tenant_id,
            name,
            category,
            contact_name: contactName,
            phone,
            email
        })

    if (error) {
        console.error('Create subcontractor error:', error)
        return { error: 'Taşeron oluşturulamadı.' }
    }

    revalidatePath('/customer-support/subcontractors')
    return { success: true }
}

export async function updateSubcontractor(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const contactName = formData.get('contact_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string

    if (!id || !name || !category) {
        return { error: 'Geçersiz parametreler.' }
    }

    const { error } = await supabase
        .from('subcontractors')
        .update({
            name,
            category,
            contact_name: contactName,
            phone,
            email
        })
        .eq('id', id)

    if (error) {
        console.error('Update subcontractor error:', error)
        return { error: 'Taşeron güncellenemedi.' }
    }

    revalidatePath('/customer-support/subcontractors')
    return { success: true }
}

export async function deleteSubcontractor(id: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete subcontractor error:', error)
        return { error: 'Taşeron silinemedi.' }
    }

    revalidatePath('/customer-support/subcontractors')
    return { success: true }
}

// ==========================================
// 2. SNAG ITEMS ACTIONS
// ==========================================

export async function createSnagItem(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant profile not found' }

    const unitId = formData.get('unit_id') as string
    const serviceRequestId = formData.get('service_request_id') as string || null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const subcontractorId = formData.get('subcontractor_id') as string || null
    const priority = formData.get('priority') as string || 'Normal'

    if (!unitId || !title || !category) {
        return { error: 'Daire, Başlık ve Kategori alanları zorunludur.' }
    }

    const { error } = await supabase
        .from('snag_items')
        .insert({
            tenant_id: profile.tenant_id,
            unit_id: unitId,
            service_request_id: serviceRequestId,
            title,
            description,
            category,
            subcontractor_id: subcontractorId,
            priority,
            status: 'Pending'
        })

    if (error) {
        console.error('Create snag item error:', error)
        return { error: 'Kusur kaydı oluşturulamadı.' }
    }

    revalidatePath('/customer-support/snag-list')
    if (serviceRequestId) {
        revalidatePath(`/customer-support/${serviceRequestId}`)
    }
    return { success: true }
}

export async function updateSnagStatus(id: string, status: string) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const updates: any = { status, updated_at: new Date().toISOString() }
    if (status === 'Repaired' || status === 'Verified') {
        updates.resolved_at = new Date().toISOString()
    }

    const { error } = await supabase
        .from('snag_items')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Update snag status error:', error)
        return { error: 'Kusur durumu güncellenemedi.' }
    }

    revalidatePath('/customer-support/snag-list')
    return { success: true }
}

export async function assignSubcontractor(id: string, subcontractorId: string | null) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { error } = await supabase
        .from('snag_items')
        .update({ 
            subcontractor_id: subcontractorId,
            status: subcontractorId ? 'In Progress' : 'Pending',
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) {
        console.error('Assign subcontractor error:', error)
        return { error: 'Taşeron atanamadı.' }
    }

    revalidatePath('/customer-support/snag-list')
    return { success: true }
}

// ==========================================
// 3. DELIVERY APPOINTMENTS ACTIONS
// ==========================================

export async function scheduleDeliveryAppointment(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant profile not found' }

    const unitId = formData.get('unit_id') as string
    const customerId = formData.get('customer_id') as string
    const appointmentDate = formData.get('appointment_date') as string
    const notes = formData.get('notes') as string

    if (!unitId || !customerId || !appointmentDate) {
        return { error: 'Daire, Müşteri ve Randevu Tarihi alanları zorunludur.' }
    }

    const { error } = await supabase
        .from('delivery_appointments')
        .insert({
            tenant_id: profile.tenant_id,
            unit_id: unitId,
            customer_id: customerId,
            appointment_date: appointmentDate,
            notes,
            status: 'Scheduled'
        })

    if (error) {
        console.error('Schedule delivery appointment error:', error)
        return { error: 'Teslim randevusu oluşturulamadı.' }
    }

    revalidatePath('/customer-support/deliveries')
    return { success: true }
}

export async function completeDeliveryChecklist(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const id = formData.get('id') as string
    const checklistItemsStr = formData.get('checklist_items') as string
    const initialMeterReadingsStr = formData.get('initial_meter_readings') as string
    const notes = formData.get('notes') as string
    const status = formData.get('status') as string || 'Completed'

    if (!id) return { error: 'Randevu ID gereklidir.' }

    const checklistItems = JSON.parse(checklistItemsStr || '[]')
    const initialMeterReadings = JSON.parse(initialMeterReadingsStr || '{}')

    // 1. Fetch appointment details to get unit_id
    const { data: appointment, error: fetchErr } = await supabase
        .from('delivery_appointments')
        .select('unit_id')
        .eq('id', id)
        .single()

    if (fetchErr || !appointment) {
        return { error: 'Teslimat randevusu bulunamadı.' }
    }

    // 2. Update Delivery Appointment
    const { error: appError } = await supabase
        .from('delivery_appointments')
        .update({
            checklist_items: checklistItems,
            initial_meter_readings: initialMeterReadings,
            notes,
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (appError) {
        console.error('Complete checklist error:', appError)
        return { error: 'Kontrol listesi kaydedilemedi.' }
    }

    // 3. If Completed, update Unit and Contract delivery status
    if (status === 'Completed') {
        // Find contract for the unit
        const { data: sale } = await supabase
            .from('sales')
            .select('id')
            .eq('unit_id', appointment.unit_id)
            .in('status', ['Sold', 'ContractSigned'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (sale) {
            // Update contract delivery_status to 'Delivered'
            await supabase
                .from('contracts')
                .update({ delivery_status: 'Delivered' })
                .eq('sale_id', sale.id)
        }
    }

    revalidatePath('/customer-support/deliveries')
    return { success: true }
}

// ==========================================
// 4. CSAT FEEDBACK ACTIONS
// ==========================================

export async function submitRequestFeedback(formData: FormData) {
    const supabase = await createClient()
    
    // Auth check (either tenant user or customer)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const serviceRequestId = formData.get('service_request_id') as string
    const ratingVal = parseInt(formData.get('rating') as string, 10)
    const comment = formData.get('comment') as string

    if (!serviceRequestId || isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
        return { error: 'Geçersiz puanlama verisi.' }
    }

    // Resolve tenant_id from request
    const { data: request, error: fetchErr } = await supabase
        .from('service_requests')
        .select('tenant_id')
        .eq('id', serviceRequestId)
        .single()

    if (fetchErr || !request) {
        return { error: 'Servis talebi bulunamadı.' }
    }

    const { error } = await supabase
        .from('service_request_feedback')
        .insert({
            tenant_id: request.tenant_id,
            service_request_id: serviceRequestId,
            rating: ratingVal,
            comment
        })

    if (error) {
        console.error('Submit feedback error:', error)
        return { error: 'Geri bildirim kaydedilemedi. Zaten geri bildirim yapılmış olabilir.' }
    }

    revalidatePath('/customer-support')
    revalidatePath(`/customer-support/${serviceRequestId}`)
    return { success: true }
}
