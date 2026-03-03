'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all messaging sessions for the tenant
 */
export async function getMessagingSessions() {
    try {
        const supabase = await createClient()

        // Get all sessions with their latest message
        const { data: sessions, error } = await supabase
            .from('messaging_sessions')
            .select(`
                *,
                customers(full_name, phone)
            `)
            .order('updated_at', { ascending: false })

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
 * Fetches messages for a specific session
 */
export async function getSessionMessages(sessionId: string) {
    try {
        const supabase = await createClient()
        const { data: messages, error } = await supabase
            .from('messaging_messages')
            .select('*')
            .eq('session_id', sessionId)
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
