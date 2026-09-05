'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CRMUnansweredWpToggleProps {
    unreadCount: number
    isActive: boolean
}

export default function CRMUnansweredWpToggle({
    unreadCount,
    isActive
}: CRMUnansweredWpToggleProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const toggle = () => {
        const params = new URLSearchParams(searchParams.toString())
        if (isActive) {
            params.delete('unanswered_wp')
            params.delete('wp_unanswered')
        } else {
            params.set('unanswered_wp', 'true')
        }
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    if (unreadCount === 0 && !isActive) {
        return null
    }

    return (
        <Button
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={toggle}
            className={cn(
                "h-9 text-xs font-bold gap-1.5 transition-all shadow-sm shrink-0",
                isActive
                    ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                    : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 hover:text-rose-800 ring-1 ring-rose-400/50 animate-pulse"
            )}
            title={isActive ? "Filtreyi kaldır (Tüm kayıtları göster)" : "WhatsApp'ta yanıt bekleyen müşterileri filtrele"}
        >
            <span className="relative flex h-2 w-2">
                <span className={cn("inline-flex h-full w-full rounded-full opacity-75", isActive ? "bg-white" : "animate-ping bg-rose-400 absolute")} />
                <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-white" : "bg-rose-600")} />
            </span>
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">
                {isActive ? `Yanıt Bekleyenler (${unreadCount})` : `Yanıt Bekleyenler (${unreadCount})`}
            </span>
        </Button>
    )
}
