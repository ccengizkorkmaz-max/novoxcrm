'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface AgentProfile {
    id: string
    full_name: string
    title?: string
    bio?: string
    phone?: string
    email?: string
    photo_url?: string
    cover_url?: string
    slug?: string
    social_links?: {
        instagram?: string
        linkedin?: string
        twitter?: string
        youtube?: string
        website?: string
    }
    specializations?: string[]
    service_areas?: string[]
    certifications?: string[]
    years_experience?: number
    is_public: boolean
}

export async function getAgentPublicProfile(slug: string) {
    const supabase = await createClient()
    
    const { data: agent } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, email, avatar_url, agent_bio, agent_title, agent_slug, agent_social_links, agent_specializations, agent_service_areas, agent_certifications, agent_years_experience, agent_is_public, agent_cover_url')
        .eq('agent_slug', slug)
        .eq('agent_is_public', true)
        .single()

    if (!agent) return null

    // Get agent's active portfolios
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, title, property_type, listing_type, city, district, neighborhood, price, currency, room_count, area_net, floor, status, portfolio_images(url, is_cover)')
        .eq('agent_id', agent.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    // Get agent's stats
    const { data: transactions } = await supabase
        .from('agent_transactions')
        .select('sale_price, status')
        .or(`listing_agent_id.eq.${agent.id},buyer_agent_id.eq.${agent.id}`)
        .in('status', ['approved', 'paid'])

    const totalDeals = transactions?.length || 0
    const totalVolume = transactions?.reduce((s, t) => s + (t.sale_price || 0), 0) || 0

    return {
        agent: {
            ...agent,
            name: agent.full_name,
            title: agent.agent_title,
            bio: agent.agent_bio,
            photo: agent.avatar_url,
            cover: agent.agent_cover_url,
            slug: agent.agent_slug,
            social: agent.agent_social_links,
            specializations: agent.agent_specializations,
            serviceAreas: agent.agent_service_areas,
            certifications: agent.agent_certifications,
            yearsExperience: agent.agent_years_experience,
        },
        portfolios: portfolios || [],
        stats: { totalDeals, totalVolume },
    }
}

export async function updateAgentWebsite(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const slug = (formData.get('slug') as string)?.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const title = (formData.get('title') as string)?.trim() || null
    const bio = (formData.get('bio') as string)?.trim() || null
    const isPublic = formData.get('is_public') === 'true'
    const yearsExperience = Number(formData.get('years_experience') || 0) || null

    let social: any = {}
    try { social = JSON.parse(formData.get('social_links') as string || '{}') } catch {}

    let specializations: string[] = []
    try { specializations = JSON.parse(formData.get('specializations') as string || '[]') } catch {}

    let serviceAreas: string[] = []
    try { serviceAreas = JSON.parse(formData.get('service_areas') as string || '[]') } catch {}

    let certifications: string[] = []
    try { certifications = JSON.parse(formData.get('certifications') as string || '[]') } catch {}

    // Check slug uniqueness
    if (slug) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('agent_slug', slug).neq('id', user.id).single()
        if (existing) throw new Error('Bu URL adresi zaten kullanımda. Farklı bir adres seçin.')
    }

    const { error } = await supabase.from('profiles').update({
        agent_slug: slug || null,
        agent_title: title,
        agent_bio: bio,
        agent_is_public: isPublic,
        agent_social_links: social,
        agent_specializations: specializations,
        agent_service_areas: serviceAreas,
        agent_certifications: certifications,
        agent_years_experience: yearsExperience,
    }).eq('id', user.id)

    if (error) throw new Error('Güncellenemedi: ' + error.message)
    revalidatePath('/agent-website')
    return { success: true }
}
