'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

export function RealtimeInventoryRefresher() {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('inventory-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'units'
                },
                (payload) => {
                    // Update the router to fetch new server component data
                    router.refresh()

                    if (payload.eventType === 'UPDATE') {
                        // Optional: Show a small notification for status changes
                        const oldStatus = payload.old.status
                        const newStatus = payload.new.status
                        if (oldStatus !== newStatus) {
                            toast.info(`Ünite durumu güncellendi: ${payload.new.unit_number}`, {
                                description: `${oldStatus} → ${newStatus}`,
                                duration: 3000
                            })
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [router, supabase])

    return null // This component doesn't render anything
}
