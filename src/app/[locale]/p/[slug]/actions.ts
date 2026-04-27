'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getAgentPublicProfile(slug: string) {
    const supabase = createAdminClient()
    const normalizedSlug = slug.toLowerCase().trim()
    
    // Search both agent_slug and broker_slug columns (broker dashboard writes to broker_slug)
    const { data: agent } = await supabase
        .from('profiles')
        .select('id, full_name, role, email, agent_bio, agent_title, agent_slug, broker_slug, agent_social_links, agent_specializations, agent_service_areas, agent_certifications, agent_years_experience, agent_is_public, agent_cover_url')
        .or(`agent_slug.ilike.${normalizedSlug},broker_slug.ilike.${normalizedSlug}`)
        .limit(1)
        .maybeSingle()

    if (!agent) return null

    // Get agent's active portfolios
    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id, title, property_type, listing_type, city, district, neighborhood, price, currency, room_count, area_net, floor_number, status, portfolio_images(url, is_cover)')
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
            photo: agent.agent_cover_url,
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
