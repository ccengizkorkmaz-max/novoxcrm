'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ContactType = 'seller' | 'buyer' | 'tenant' | 'landlord' | 'both'

export async function getContacts(type?: ContactType) {
    const supabase = await createClient()
    
    let query = supabase
        .from('customers')
        .select('*, portfolios:portfolios(id, title, status, listing_type)')
        .order('created_at', { ascending: false })
    
    if (type && type !== 'both') {
        query = query.eq('contact_type', type)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data || []
}

export async function createContact(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    const fullName = (formData.get('full_name') as string)?.trim()
    if (!fullName) throw new Error('Ad soyad zorunlu')
    
    const contact = {
        tenant_id: profile.tenant_id,
        full_name: fullName,
        phone: (formData.get('phone') as string)?.trim() || null,
        email: (formData.get('email') as string)?.trim() || null,
        contact_type: (formData.get('contact_type') as string) || 'buyer',
        city: (formData.get('city') as string)?.trim() || null,
        district: (formData.get('district') as string)?.trim() || null,
        source: (formData.get('source') as string) || 'office',
        notes: (formData.get('notes') as string)?.trim() || null,
        // Buyer/tenant specific
        budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : null,
        budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : null,
        desired_rooms: (formData.get('desired_rooms') as string)?.trim() || null,
        desired_area_min: formData.get('desired_area_min') ? Number(formData.get('desired_area_min')) : null,
        desired_districts: (formData.get('desired_districts') as string)?.trim() || null,
        listing_preference: (formData.get('listing_preference') as string) || null,
        assigned_to: user.id,
    }
    
    const { data, error } = await supabase
        .from('customers')
        .insert(contact)
        .select()
        .single()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/contacts')
    return data
}

export async function updateContact(id: string, formData: FormData) {
    const supabase = await createClient()
    
    const updates: Record<string, any> = {
        full_name: formData.get('full_name') as string,
        phone: formData.get('phone') as string || null,
        email: formData.get('email') as string || null,
        contact_type: formData.get('contact_type') as string,
        city: formData.get('city') as string || null,
        district: formData.get('district') as string || null,
        source: formData.get('source') as string || null,
        notes: formData.get('notes') as string || null,
        budget_min: formData.get('budget_min') ? Number(formData.get('budget_min')) : null,
        budget_max: formData.get('budget_max') ? Number(formData.get('budget_max')) : null,
        desired_rooms: formData.get('desired_rooms') as string || null,
        desired_area_min: formData.get('desired_area_min') ? Number(formData.get('desired_area_min')) : null,
        desired_districts: formData.get('desired_districts') as string || null,
        listing_preference: formData.get('listing_preference') as string || null,
    }
    
    const { error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/contacts')
    return { success: true }
}

// ===== CONTRACTS =====

export type ContractType = 'authorization' | 'sale' | 'rental' | 'commission'

export async function getContracts(type?: ContractType) {
    const supabase = await createClient()
    
    let query = supabase
        .from('broker_contracts')
        .select('*, customer:customers(full_name, phone), portfolio:portfolios(title, listing_type)')
        .order('created_at', { ascending: false })
    
    if (type) {
        query = query.eq('contract_type', type)
    }
    
    const { data, error } = await query
    if (error) {
        // Table might not exist yet
        console.error('Contracts query error:', error)
        return []
    }
    return data || []
}

export async function createContract(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    const contract = {
        tenant_id: profile.tenant_id,
        contract_type: formData.get('contract_type') as string || 'authorization',
        customer_id: formData.get('customer_id') as string || null,
        portfolio_id: formData.get('portfolio_id') as string || null,
        title: (formData.get('title') as string)?.trim() || 'Sözleşme',
        start_date: (formData.get('start_date') as string) || null,
        end_date: (formData.get('end_date') as string) || null,
        amount: formData.get('amount') ? Number(formData.get('amount')) : null,
        commission_rate: formData.get('commission_rate') ? Number(formData.get('commission_rate')) : null,
        commission_amount: formData.get('commission_amount') ? Number(formData.get('commission_amount')) : null,
        currency: (formData.get('currency') as string) || 'TRY',
        status: 'draft',
        notes: (formData.get('notes') as string)?.trim() || null,
        template_design: null,
        template_html: null,
        created_by: user.id,
    }
    
    const { data, error } = await supabase
        .from('broker_contracts')
        .insert(contract)
        .select()
        .single()
    
    if (error) throw new Error(error.message)
    
    revalidatePath('/contracts')
    return data
}

export async function updateContractStatus(id: string, status: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('broker_contracts')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/contracts')
    return { success: true }
}

export async function saveContractTemplate(id: string, html: string, design: any) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('broker_contracts')
        .update({ 
            template_html: html, 
            template_design: design,
            updated_at: new Date().toISOString() 
        })
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/contracts')
    return { success: true }
}
