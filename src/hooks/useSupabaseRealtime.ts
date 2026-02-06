'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseSupabaseRealtimeProps {
    table: string
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
    filter?: string
    onMessage?: (payload: RealtimePostgresChangesPayload<any>) => void
}

export function useSupabaseRealtime({
    table,
    event = '*',
    schema = 'public',
    filter,
    onMessage
}: UseSupabaseRealtimeProps) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel(`realtime:${table}`)
            .on(
                'postgres_changes' as any,
                {
                    event,
                    schema,
                    table,
                    filter
                },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    console.log(`Realtime change detected in ${table}:`, payload)

                    if (onMessage) {
                        onMessage(payload)
                    }

                    // Refresh the current route to fetch new data via Server Components
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [table, event, schema, filter, onMessage, router, supabase])
}
