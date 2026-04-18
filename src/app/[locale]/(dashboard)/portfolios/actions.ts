'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPortfolios() {
    const supabase = await createClient()
    
    const { data, error } = await supabase
        .from('portfolios')
        .select('*, portfolio_images(id, url, is_cover, order_index)')
        .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
}

export async function createPortfolio(formData: FormData) {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) throw new Error('No tenant')
    
    const portfolio = {
        tenant_id: profile.tenant_id,
        agent_id: user.id,
        title: formData.get('title') as string,
        listing_type: formData.get('listing_type') as string || 'sale',
        property_type: formData.get('property_type') as string || 'apartment',
        city: formData.get('city') as string || null,
        district: formData.get('district') as string || null,
        neighborhood: formData.get('neighborhood') as string || null,
        address: formData.get('address') as string || null,
        room_count: formData.get('room_count') as string || null,
        floor_number: formData.get('floor_number') ? Number(formData.get('floor_number')) : null,
        total_floors: formData.get('total_floors') ? Number(formData.get('total_floors')) : null,
        building_age: formData.get('building_age') ? Number(formData.get('building_age')) : null,
        area_gross: formData.get('area_gross') ? Number(formData.get('area_gross')) : null,
        area_net: formData.get('area_net') ? Number(formData.get('area_net')) : null,
        price: formData.get('price') ? Number(formData.get('price')) : null,
        currency: formData.get('currency') as string || 'TRY',
        owner_name: formData.get('owner_name') as string || null,
        owner_phone: formData.get('owner_phone') as string || null,
        description: formData.get('description') as string || null,
        authorization_type: formData.get('authorization_type') as string || 'exclusive',
        authorization_start: formData.get('authorization_start') as string || null,
        authorization_end: formData.get('authorization_end') as string || null,
    }
    
    const { data, error } = await supabase
        .from('portfolios')
        .insert(portfolio)
        .select()
        .single()
    
    if (error) throw error
    
    revalidatePath('/portfolios')
    return data
}

export async function updatePortfolioStatus(id: string, status: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('portfolios')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/portfolios')
    return { success: true }
}

export async function deletePortfolio(id: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath('/portfolios')
    return { success: true }
}
