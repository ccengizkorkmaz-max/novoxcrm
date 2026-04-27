'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

export async function getAgentPublicProfile(slug: string) {
    const supabase = createAdminClient()
    const normalizedSlug = slug.toLowerCase().trim()
    
    const { data: agent } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, tenant_id, agent_bio, agent_title, agent_slug, broker_slug, agent_social_links, agent_specializations, agent_service_areas, agent_certifications, agent_years_experience, agent_is_public, agent_cover_url, profile_photo_url')
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

    // Get broker's assigned projects
    const { data: brokerProjects } = await supabase
        .from('broker_projects')
        .select('projects(id, name, city, district, status, cover_image_url)')
        .eq('broker_id', agent.id)

    return {
        agent: {
            id: agent.id,
            name: agent.full_name,
            email: agent.email,
            phone: agent.phone,
            title: agent.agent_title,
            bio: agent.agent_bio,
            photo: agent.profile_photo_url || agent.agent_cover_url,
            slug: agent.agent_slug || agent.broker_slug,
            social: agent.agent_social_links,
            specializations: agent.agent_specializations,
            serviceAreas: agent.agent_service_areas,
            certifications: agent.agent_certifications,
            yearsExperience: agent.agent_years_experience,
            tenantId: agent.tenant_id,
        },
        portfolios: portfolios || [],
        projects: brokerProjects?.map((bp: any) => bp.projects).filter(Boolean) || [],
        stats: { totalDeals, totalVolume },
    }
}

export async function submitContactForm(formData: FormData) {
    const brokerId = formData.get('broker_id') as string
    const tenantId = formData.get('tenant_id') as string
    const senderName = formData.get('sender_name') as string
    const senderEmail = formData.get('sender_email') as string
    const senderPhone = formData.get('sender_phone') as string
    const message = formData.get('message') as string
    const subject = formData.get('subject') as string
    const brokerEmail = formData.get('broker_email') as string
    const brokerName = formData.get('broker_name') as string

    if (!brokerId || !senderName || !message) {
        return { success: false, error: 'Lütfen zorunlu alanları doldurun.' }
    }

    const supabase = createAdminClient()

    // 1. Save to database
    const { error: dbError } = await supabase
        .from('broker_contact_messages')
        .insert({
            broker_id: brokerId,
            tenant_id: tenantId || null,
            sender_name: senderName,
            sender_email: senderEmail || null,
            sender_phone: senderPhone || null,
            message,
            subject: subject || null,
        })

    if (dbError) {
        console.error('Contact form DB error:', dbError)
        return { success: false, error: 'Mesajınız kaydedilemedi.' }
    }

    // 2. Send email notification to broker
    if (brokerEmail) {
        try {
            const resend = new Resend(process.env.RESEND_API_KEY)
            await resend.emails.send({
                from: 'Novo CRM <noreply@novoxcrm.com>',
                to: brokerEmail,
                subject: `Yeni İletişim Talebi: ${senderName}`,
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
                        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 24px 32px;">
                            <h2 style="color: white; margin: 0; font-size: 20px;">📬 Yeni İletişim Talebi</h2>
                            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Profil sayfanız üzerinden yeni bir mesaj aldınız</p>
                        </div>
                        <div style="padding: 32px;">
                            <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 8px; font-size: 14px;"><strong>Ad Soyad:</strong> ${senderName}</p>
                                ${senderEmail ? `<p style="margin: 0 0 8px; font-size: 14px;"><strong>E-posta:</strong> ${senderEmail}</p>` : ''}
                                ${senderPhone ? `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Telefon:</strong> ${senderPhone}</p>` : ''}
                                ${subject ? `<p style="margin: 0 0 8px; font-size: 14px;"><strong>Konu:</strong> ${subject}</p>` : ''}
                            </div>
                            <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
                                <p style="margin: 0 0 8px; font-size: 13px; color: #64748b; font-weight: 600;">MESAJ</p>
                                <p style="margin: 0; font-size: 14px; line-height: 1.6;">${message}</p>
                            </div>
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="https://www.novoxcrm.com/broker" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Broker Portaline Git</a>
                            </div>
                        </div>
                        <div style="padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0; font-size: 11px; color: #94a3b8;">Powered by Novo CRM</p>
                        </div>
                    </div>
                `
            })
        } catch (emailError) {
            console.error('Contact form email error:', emailError)
            // Don't fail - the message was saved to DB
        }
    }

    return { success: true }
}
