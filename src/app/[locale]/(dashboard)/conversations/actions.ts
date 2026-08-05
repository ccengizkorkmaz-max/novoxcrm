'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all WhatsApp messaging sessions for the tenant
 */
export async function getMessagingSessions() {
    try {
        const supabase = await createClient()

        // Get all sessions
        const { data: sessions, error } = await supabase
            .from('whatsapp_conversations')
            .select(`
                *,
                customers(full_name, phone)
            `)
            .order('last_message_at', { ascending: false })

        if (error) {
            console.error('Error fetching messaging sessions:', error)
            return []
        }

        if (!sessions || sessions.length === 0) return []

        // Telefon numarası üzerinden müşteri adı eşleştir (customer_id olmayan sessionlar için)
        const unmatchedSessions = sessions.filter(s => !s.customers?.full_name && s.phone_number)
        if (unmatchedSessions.length > 0) {
            // Her eşleşmemiş session için son 10 hane ile arama yap
            for (const s of unmatchedSessions) {
                const last10 = s.phone_number.replace(/\D/g, '').slice(-10)
                if (last10.length < 10) continue

                const { data: matches } = await supabase
                    .from('customers')
                    .select('full_name, phone')
                    .ilike('phone', `%${last10}%`)
                    .limit(10)

                if (matches && matches.length > 0) {
                    // Birden fazla varsa en çok tekrar eden ismi al
                    const nameCounts: Record<string, number> = {}
                    matches.forEach(m => {
                        if (m.full_name) {
                            nameCounts[m.full_name] = (nameCounts[m.full_name] || 0) + 1
                        }
                    })
                    const bestName = Object.entries(nameCounts)
                        .sort((a, b) => b[1] - a[1])[0]?.[0]
                    if (bestName) {
                        s.customers = { full_name: bestName, phone: s.phone_number }
                    }
                }
            }
        }

        return sessions
    } catch (error) {
        console.error('Server error fetching sessions:', error)
        return []
    }
}

import { updateLead } from '../leads/lead-actions'

/**
 * Fetches a single WhatsApp session with customer data
 */
export async function getMessagingSession(id: string) {
    try {
        const supabase = await createClient()
        const { data: session, error } = await supabase
            .from('whatsapp_conversations')
            .select(`
                *,
                customers(id, full_name, phone, assigned_to)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching session:', error)
            return null
        }

        // Telefon numarası ile müşteri eşleştir (son 10 hane ile)
        if (session && !session.customers?.full_name && session.phone_number) {
            const last10 = session.phone_number.replace(/\D/g, '').slice(-10)
            if (last10.length >= 10) {
                const { data: matches } = await supabase
                    .from('customers')
                    .select('id, full_name, phone, assigned_to')
                    .ilike('phone', `%${last10}%`)
                    .limit(10)

                if (matches && matches.length > 0) {
                    const nameCounts: Record<string, number> = {}
                    matches.forEach(m => {
                        if (m.full_name) {
                            nameCounts[m.full_name] = (nameCounts[m.full_name] || 0) + 1
                        }
                    })
                    const bestName = Object.entries(nameCounts)
                        .sort((a, b) => b[1] - a[1])[0]?.[0]
                    if (bestName) {
                        const matchedCust = matches.find(m => m.full_name === bestName) || matches[0]
                        session.customers = {
                            id: matchedCust.id,
                            full_name: matchedCust.full_name,
                            phone: session.phone_number,
                            assigned_to: matchedCust.assigned_to
                        }
                        if (matchedCust.id) session.customer_id = matchedCust.id
                    }
                }
            }
        }

        // Temsilci ve Lead Eşleştirme Bilgilerini Çözümle
        let assignedToId: string | null = session.customers?.assigned_to || null
        let assignedToName: string | null = null
        let leadId: string | null = session.lead_id || null

        // Müşteri veya telefon ile lead eşleştir
        if (!leadId && session.customer_id) {
            const { data: leadMatch } = await supabase
                .from('leads')
                .select('id, assigned_to')
                .or(`converted_customer_id.eq.${session.customer_id},id.eq.${session.customer_id}`)
                .limit(1)
                .maybeSingle()
            if (leadMatch) {
                leadId = leadMatch.id
                if (!assignedToId && leadMatch.assigned_to) {
                    assignedToId = leadMatch.assigned_to
                }
            }
        }

        if (!leadId && session.phone_number) {
            const last10 = session.phone_number.replace(/\D/g, '').slice(-10)
            if (last10.length >= 10) {
                const { data: leadMatch } = await supabase
                    .from('leads')
                    .select('id, assigned_to')
                    .ilike('phone', `%${last10}%`)
                    .limit(1)
                    .maybeSingle()
                if (leadMatch) {
                    leadId = leadMatch.id
                    if (!assignedToId && leadMatch.assigned_to) {
                        assignedToId = leadMatch.assigned_to
                    }
                }
            }
        }

        // Temsilci adını bul
        if (assignedToId) {
            const { data: rep } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', assignedToId)
                .maybeSingle()
            if (rep?.full_name) {
                assignedToName = rep.full_name
            }
        }

        session.assigned_to = assignedToId
        session.assigned_to_name = assignedToName
        session.resolved_lead_id = leadId

        // Okunmamış mesajları sıfırla
        if (session && session.unread_count > 0) {
            await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', id)
        }

        return session
    } catch (error) {
        console.error('Server error fetching session:', error)
        return null
    }
}

/**
 * Fetches all sales representatives (profiles) for current tenant
 */
export async function getSalesRepresentatives() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data: userProfile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userProfile?.tenant_id) return []

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, full_name, role')
            .eq('tenant_id', userProfile.tenant_id)
            .order('full_name', { ascending: true })

        if (error) {
            console.error('Error fetching sales reps:', error)
            return []
        }

        return profiles || []
    } catch (error) {
        console.error('Server error fetching sales reps:', error)
        return []
    }
}

/**
 * Assigns a sales representative to the active customer's lead & customer record
 */
export async function assignRepresentativeToConversation(params: {
    conversationId: string
    customerId?: string | null
    leadId?: string | null
    assignedTo: string | null
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Oturum bulunamadı' }

        const { data: userProfile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!userProfile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

        const { conversationId, customerId, leadId, assignedTo } = params

        // 1. Fetch conversation details if customerId/leadId missing
        const { data: conv } = await supabase
            .from('whatsapp_conversations')
            .select('customer_id, lead_id, phone_number, lead_score')
            .eq('id', conversationId)
            .single()

        const effectiveCustomerId = customerId || conv?.customer_id
        let effectiveLeadId = leadId || conv?.lead_id

        // Match lead if missing
        if (!effectiveLeadId) {
            if (effectiveCustomerId) {
                const { data: leadMatch } = await supabase
                    .from('leads')
                    .select('id')
                    .or(`converted_customer_id.eq.${effectiveCustomerId},id.eq.${effectiveCustomerId}`)
                    .limit(1)
                    .maybeSingle()
                if (leadMatch) effectiveLeadId = leadMatch.id
            }

            if (!effectiveLeadId && conv?.phone_number) {
                const last10 = conv.phone_number.replace(/\D/g, '').slice(-10)
                if (last10.length >= 10) {
                    const { data: leadMatch } = await supabase
                        .from('leads')
                        .select('id')
                        .ilike('phone', `%${last10}%`)
                        .limit(1)
                        .maybeSingle()
                    if (leadMatch) effectiveLeadId = leadMatch.id
                }
            }
        }

        // 2. Update Lead if leadId exists (updates assigned_to & sends notification)
        if (effectiveLeadId) {
            await updateLead(effectiveLeadId, { assigned_to: assignedTo })
        }

        // 3. Update Customer if customerId exists
        if (effectiveCustomerId) {
            await supabase
                .from('customers')
                .update({ assigned_to: assignedTo, updated_at: new Date().toISOString() })
                .eq('id', effectiveCustomerId)
                .eq('tenant_id', userProfile.tenant_id)
        }

        // 4. Update Conversation link if lead_id was missing
        if (effectiveLeadId && !conv?.lead_id) {
            await supabase
                .from('whatsapp_conversations')
                .update({ lead_id: effectiveLeadId })
                .eq('id', conversationId)
        }

        // 5. Get assigned representative name & send WhatsApp alert
        let assigneeName = 'Atanmamış'
        if (assignedTo) {
            const { data: rep } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', assignedTo)
                .maybeSingle()

            if (rep?.full_name) assigneeName = rep.full_name

            // Send explicit WhatsApp notification to the assigned representative
            try {
                const { data: tenant } = await supabase
                    .from('tenants')
                    .select('wa_phone_number_id, wa_access_token')
                    .eq('id', userProfile.tenant_id)
                    .single()

                if (tenant?.wa_phone_number_id && tenant.wa_access_token && rep?.phone) {
                    const { sendWhatsAppTemplate } = await import('@/lib/whatsapp')
                    
                    // Fetch actual customer/lead name
                    let custName = ''
                    if (effectiveCustomerId) {
                        const { data: cust } = await supabase
                            .from('customers')
                            .select('full_name')
                            .eq('id', effectiveCustomerId)
                            .maybeSingle()
                        if (cust?.full_name) custName = cust.full_name
                    }
                    if (!custName && effectiveLeadId) {
                        const { data: lead } = await supabase
                            .from('leads')
                            .select('full_name')
                            .eq('id', effectiveLeadId)
                            .maybeSingle()
                        if (lead?.full_name) custName = lead.full_name
                    }
                    if (!custName) custName = conv?.phone_number || 'Aday Müşteri'

                    let scoreText = 'MESAJLAŞMA (WHATSAPP)'
                    let foundLevel = conv?.lead_score

                    if (!foundLevel || foundLevel === 'unknown') {
                        if (effectiveLeadId) {
                            const { data: lq } = await supabase
                                .from('lead_qualifications')
                                .select('interest_level')
                                .eq('lead_id', effectiveLeadId)
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle()
                            
                            if (lq?.interest_level) {
                                foundLevel = lq.interest_level
                            }
                        }
                    }

                    if (foundLevel && foundLevel !== 'unknown') {
                        const scoreLabel: Record<string, string> = {
                            hot: 'HOT', warm: 'WARM', cold: 'COLD',
                            call_requested: 'ARAMA', disqualified: 'DQ'
                        }
                        scoreText = scoreLabel[foundLevel] || foundLevel.toUpperCase()
                    }

                    await sendWhatsAppTemplate(
                        rep.phone,
                        'lead_assignment_alert',
                        [custName, conv?.phone_number || '', scoreText],
                        'tr',
                        tenant.wa_phone_number_id,
                        tenant.wa_access_token
                    )
                    console.log(`✅ WhatsApp atama bildirimi temsilciye gönderildi: ${rep.full_name} (${rep.phone})`)

                    // Hot Lead Manager'lara da bildir (Atanan temsilci hariç)
                    const { data: hotLeadManagers } = await supabase
                        .from('profiles')
                        .select('phone, full_name, id')
                        .eq('tenant_id', userProfile.tenant_id)
                        .eq('is_hot_lead_manager', true)
                    
                    if (hotLeadManagers && hotLeadManagers.length > 0) {
                        for (const manager of hotLeadManagers) {
                            if (manager.phone && manager.id !== assignedTo) {
                                await sendWhatsAppTemplate(
                                    manager.phone,
                                    'lead_assignment_alert',
                                    [custName, conv?.phone_number || '', `${scoreText} - Atanan: ${rep.full_name}`],
                                    'tr',
                                    tenant.wa_phone_number_id,
                                    tenant.wa_access_token
                                )
                                console.log(`✅ WhatsApp atama bildirimi hot lead manager'a gönderildi: ${manager.full_name}`)
                            }
                        }
                    }
                }
            } catch (waErr) {
                console.error('Temsilciye WA bildirim gönderme hatası:', waErr)
            }
        }

        return {
            success: true,
            assignedTo,
            assigneeName,
            leadId: effectiveLeadId,
            customerId: effectiveCustomerId
        }
    } catch (error: any) {
        console.error('Error assigning representative:', error)
        return { success: false, error: error?.message || 'Temsilci atanırken bir hata oluştu' }
    }
}

/**
 * Fetches messages for a specific WhatsApp session
 */
export async function getSessionMessages(sessionId: string) {
    try {
        const supabase = await createClient()
        const { data: messages, error } = await supabase
            .from('whatsapp_messages')
            .select('*')
            .eq('conversation_id', sessionId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching session messages:', error)
            return []
        }

        return messages || []
    } catch (error) {
        console.error('Server error fetching messages:', error)
        return []
    }
}
