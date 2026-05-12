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
            // Tüm telefon varyantlarını topla
            const phoneVariants: string[] = []
            unmatchedSessions.forEach(s => {
                const phone = s.phone_number
                phoneVariants.push(phone)
                if (phone.startsWith('90') && phone.length > 10) {
                    phoneVariants.push(phone.substring(2)) // 90 prefix'siz
                    phoneVariants.push('0' + phone.substring(2)) // 0 prefix'li
                }
            })

            const { data: matchedCustomers } = await supabase
                .from('customers')
                .select('full_name, phone')
                .in('phone', phoneVariants)

            if (matchedCustomers && matchedCustomers.length > 0) {
                // Telefon -> ad map'i oluştur
                const phoneToName: Record<string, string> = {}
                matchedCustomers.forEach(c => {
                    if (c.phone && c.full_name) {
                        phoneToName[c.phone] = c.full_name
                    }
                })

                // Eşleştir
                sessions.forEach(s => {
                    if (!s.customers?.full_name && s.phone_number) {
                        const phone = s.phone_number
                        const name = phoneToName[phone] 
                            || phoneToName[phone.startsWith('90') ? phone.substring(2) : ''] 
                            || phoneToName[phone.startsWith('90') ? '0' + phone.substring(2) : '']
                        if (name) {
                            s.customers = { full_name: name, phone: phone }
                        }
                    }
                })
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

        // Telefon numarası ile müşteri eşleştir
        if (session && !session.customers?.full_name && session.phone_number) {
            const phone = session.phone_number
            const variants = [phone]
            if (phone.startsWith('90') && phone.length > 10) {
                variants.push(phone.substring(2))
                variants.push('0' + phone.substring(2))
            }
            const { data: customer } = await supabase
                .from('customers')
                .select('full_name, phone')
                .in('phone', variants)
                .limit(1)
                .single()

            if (customer?.full_name) {
                session.customers = { full_name: customer.full_name, phone: phone }
            }
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
