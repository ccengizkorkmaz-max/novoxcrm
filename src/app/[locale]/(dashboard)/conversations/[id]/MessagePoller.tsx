'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

/**
 * Supabase Realtime ile anlık mesaj dinleme.
 * whatsapp_messages tablosuna yeni satır eklendiğinde sayfa anında yenilenir.
 */
export default function MessagePoller({ conversationId }: { conversationId: string }) {
    const router = useRouter()

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'whatsapp_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                () => {
                    // Yeni mesaj geldi — sayfayı anında yenile
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, router])

    return null
}
