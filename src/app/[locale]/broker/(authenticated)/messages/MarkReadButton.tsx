'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export function MarkReadButton({ messageId }: { messageId: string }) {
    const router = useRouter()

    const handleMarkRead = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        await supabase
            .from('broker_contact_messages')
            .update({ is_read: true })
            .eq('id', messageId)
        router.refresh()
    }

    return (
        <button
            onClick={handleMarkRead}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
            title="Okundu olarak işaretle"
        >
            <CheckCircle className="h-3.5 w-3.5" />
            Okundu
        </button>
    )
}
