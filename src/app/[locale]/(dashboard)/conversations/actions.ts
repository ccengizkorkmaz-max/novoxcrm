'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all WhatsApp messaging sessions for the tenant
 */
export async function getMessagingSessions() {
    try {
        const supabase = await createClient()

        // Get all sessions with their latest message
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

        return sessions || []
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
