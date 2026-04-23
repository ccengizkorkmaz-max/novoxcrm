'use client'

import { useState } from 'react'
import { Sparkles, UserCheck, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface AiToggleProps {
    sessionId: string
    initialAiEnabled: boolean
}

export default function AiToggle({ sessionId, initialAiEnabled }: AiToggleProps) {
    const [aiEnabled, setAiEnabled] = useState(initialAiEnabled)
    const [isToggling, setIsToggling] = useState(false)
    const router = useRouter()

    async function handleToggle(checked: boolean) {
        setIsToggling(true)
        try {
            const res = await fetch('/api/conversations/toggle-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, aiEnabled: checked })
            })

            const result = await res.json()

            if (!res.ok) {
                throw new Error(result.error || 'AI durumu değiştirilemedi')
            }

            setAiEnabled(checked)
            toast.success(checked ? 'AI Asistan devreye alındı' : 'İnsan operatör devrede')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsToggling(false)
        }
    }

    return (
        <div className="flex items-center gap-3">
            <Badge className={cn(
                "py-1.5 px-3 font-black text-[10px] uppercase tracking-wider shadow-sm border transition-all",
                aiEnabled
                    ? "bg-blue-50 text-blue-700 border-blue-100"
                    : "bg-amber-50 text-amber-700 border-amber-100"
            )}>
                {isToggling ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : aiEnabled ? (
                    <Sparkles className="h-3 w-3 mr-1" />
                ) : (
                    <UserCheck className="h-3 w-3 mr-1" />
                )}
                {aiEnabled ? 'AI AKTİF' : 'İNSAN'}
            </Badge>
            <Switch
                checked={aiEnabled}
                onCheckedChange={handleToggle}
                disabled={isToggling}
                className="data-[state=checked]:bg-blue-600"
            />
        </div>
    )
}
