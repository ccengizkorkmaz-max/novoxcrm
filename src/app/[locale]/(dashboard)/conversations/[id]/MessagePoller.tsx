'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Polls for new messages every N seconds by calling router.refresh()
 */
export default function MessagePoller({ intervalMs = 5000 }: { intervalMs?: number }) {
    const router = useRouter()

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh()
        }, intervalMs)

        return () => clearInterval(interval)
    }, [router, intervalMs])

    return null
}
