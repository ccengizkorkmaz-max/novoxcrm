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
                customers(full_name, phone)
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
                    .select('full_name, phone')
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
                        session.customers = { full_name: bestName, phone: session.phone_number }
                    }
                }
            }
        }

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
