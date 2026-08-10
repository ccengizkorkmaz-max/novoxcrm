'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutList, Users } from 'lucide-react'

export default function CRMTabs({ activeTab }: { activeTab: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const switchTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (tab === 'pipeline') {
            params.delete('tab')
        } else {
            params.set('tab', tab)
        }
        // Reset page when switching
        params.set('page', '1')
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
                onClick={() => switchTab('pipeline')}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                    activeTab === 'pipeline'
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
            >
                <LayoutList className="w-3.5 h-3.5" />
                Satış Listesi
            </button>
            <button
                onClick={() => switchTab('tracking')}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                    activeTab === 'tracking'
                        ? "bg-white text-slate-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
            >
                <Users className="w-3.5 h-3.5" />
                Temsilci Takip
            </button>
        </div>
    )
}
