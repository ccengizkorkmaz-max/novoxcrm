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
    
    const title = (formData.get('title') as string || '').trim()
    if (!title) throw new Error('Portföy başlığı zorunludur')
    
    const portfolio = {
        tenant_id: profile.tenant_id,
        agent_id: user.id,
        title,
        listing_type: (formData.get('listing_type') as string) || 'sale',
        property_type: (formData.get('property_type') as string) || 'apartment',
        city: (formData.get('city') as string)?.trim() || null,
        district: (formData.get('district') as string)?.trim() || null,
        neighborhood: (formData.get('neighborhood') as string)?.trim() || null,
        address: (formData.get('address') as string)?.trim() || null,
        room_count: (formData.get('room_count') as string)?.trim() || null,
        floor_number: formData.get('floor_number') ? Number(formData.get('floor_number')) : null,
        total_floors: formData.get('total_floors') ? Number(formData.get('total_floors')) : null,
        building_age: formData.get('building_age') ? Number(formData.get('building_age')) : null,
        area_gross: formData.get('area_gross') ? Number(formData.get('area_gross')) : null,
        area_net: formData.get('area_net') ? Number(formData.get('area_net')) : null,
        price: formData.get('price') ? Number(formData.get('price')) : null,
        currency: (formData.get('currency') as string) || 'TRY',
        owner_name: (formData.get('owner_name') as string)?.trim() || null,
        owner_phone: (formData.get('owner_phone') as string)?.trim() || null,
        description: (formData.get('description') as string)?.trim() || null,
        authorization_type: (formData.get('authorization_type') as string) || 'exclusive',
        authorization_start: (formData.get('authorization_start') as string)?.trim() || null,
        authorization_end: (formData.get('authorization_end') as string)?.trim() || null,
        features: (() => {
            try {
                const raw = formData.get('features') as string
                return raw ? JSON.parse(raw) : {}
            } catch { return {} }
        })(),
    }
    
    const { data, error } = await supabase
        .from('portfolios')
        .insert(portfolio)
        .select()
        .single()
    
    if (error) {
        console.error('Portfolio create error:', error)
        throw new Error(error.message || 'Portföy oluşturulamadı')
    }
    
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

export async function updatePortfolio(id: string, formData: FormData) {
    const supabase = await createClient()
    
    const updates: Record<string, any> = {
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
        price_negotiable: formData.get('price_negotiable') === 'true',
        owner_name: formData.get('owner_name') as string || null,
        owner_phone: formData.get('owner_phone') as string || null,
        owner_email: formData.get('owner_email') as string || null,
        description: formData.get('description') as string || null,
        internal_notes: formData.get('internal_notes') as string || null,
        authorization_type: formData.get('authorization_type') as string || 'exclusive',
        authorization_start: formData.get('authorization_start') as string || null,
        authorization_end: formData.get('authorization_end') as string || null,
        updated_at: new Date().toISOString(),
    }
    
    const { error } = await supabase
        .from('portfolios')
        .update(updates)
        .eq('id', id)
    
    if (error) throw error
    
    revalidatePath(`/portfolios/${id}`)
    revalidatePath('/portfolios')
    return { success: true }
}

export async function uploadPortfolioImage(portfolioId: string, fileBase64: string, fileName: string, isCover: boolean = false) {
    const supabase = await createClient()
    
    // Decode base64 to buffer
    const base64Data = fileBase64.split(',')[1] || fileBase64
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Determine content type
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg'
    const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    
    // Upload to storage
    const storagePath = `portfolios/${portfolioId}/${Date.now()}_${fileName}`
    const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(storagePath, buffer, { contentType, upsert: false })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: urlData } = supabase.storage
        .from('portfolio-images')
        .getPublicUrl(storagePath)
    
    // Get current max order_index
    const { data: existingImages } = await supabase
        .from('portfolio_images')
        .select('order_index')
        .eq('portfolio_id', portfolioId)
        .order('order_index', { ascending: false })
        .limit(1)
    
    const nextOrder = (existingImages?.[0]?.order_index || 0) + 1
    
    // If this is cover, unset existing covers
    if (isCover) {
        await supabase
            .from('portfolio_images')
            .update({ is_cover: false })
            .eq('portfolio_id', portfolioId)
    }
    
    // Insert image record
    const { data, error } = await supabase
        .from('portfolio_images')
        .insert({
            portfolio_id: portfolioId,
            url: urlData.publicUrl,
            is_cover: isCover,
            order_index: nextOrder,
            caption: fileName,
        })
        .select()
        .single()
    
    if (error) throw error
    
    revalidatePath(`/portfolios/${portfolioId}`)
    return data
}

export async function deletePortfolioImage(imageId: string, portfolioId: string) {
    const supabase = await createClient()
    
    const { error } = await supabase
        .from('portfolio_images')
        .delete()
        .eq('id', imageId)
    
    if (error) throw error
    
    revalidatePath(`/portfolios/${portfolioId}`)
    return { success: true }
}

export async function setCoverImage(imageId: string, portfolioId: string) {
    const supabase = await createClient()
    
    // Unset all covers
    await supabase
        .from('portfolio_images')
        .update({ is_cover: false })
        .eq('portfolio_id', portfolioId)
    
    // Set this one
    const { error } = await supabase
        .from('portfolio_images')
        .update({ is_cover: true })
        .eq('id', imageId)
    
    if (error) throw error
    
    revalidatePath(`/portfolios/${portfolioId}`)
    return { success: true }
}

export async function findMatchingCustomers(portfolioId: string) {
    const supabase = await createClient()
    
    // Get portfolio details
    const { data: portfolio } = await supabase
        .from('portfolios')
        .select('city, district, room_count, property_type, price, listing_type')
        .eq('id', portfolioId)
        .single()
    
    if (!portfolio) return []
    
    // Get user profile for tenant isolation
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()
    
    if (!profile?.tenant_id) return []
    
    // Search customers whose demands match this portfolio
    // Look in customer demands/notes for matching criteria
    let query = supabase
        .from('customers')
        .select('id, full_name, phone, email, source, notes, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(200)
    
    const { data: allCustomers } = await query
    if (!allCustomers) return []
    
    // Score each customer based on keyword matching
    const keywords: string[] = []
    if (portfolio.city) keywords.push(portfolio.city.toLowerCase())
    if (portfolio.district) keywords.push(portfolio.district.toLowerCase())
    if (portfolio.room_count) keywords.push(portfolio.room_count.toLowerCase())
    if (portfolio.property_type) {
        const typeMap: Record<string,string> = { apartment: 'daire', villa: 'villa', land: 'arsa', commercial: 'ticari', office: 'ofis' }
        keywords.push(typeMap[portfolio.property_type] || portfolio.property_type)
    }
    if (portfolio.listing_type === 'rent') keywords.push('kiralık', 'kira')
    else keywords.push('satılık', 'satın')
    
    const scored = allCustomers
        .map(customer => {
            const text = [customer.notes, customer.full_name, customer.source].filter(Boolean).join(' ').toLowerCase()
            let score = 0
            keywords.forEach(kw => {
                if (text.includes(kw)) score += 1
            })
            // Price proximity bonus (if customer notes mention a budget)
            return { ...customer, matchScore: score }
        })
        .filter(c => c.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 20)
    
    return scored
}
