'use client'

import { useState, useEffect } from 'react'
import { BarChart3, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function CRMHeaderToggles() {
    const [statsOpen, setStatsOpen] = useState(false)
    const [viewsOpen, setViewsOpen] = useState(false)

    useEffect(() => {
        const handleStats = (e: Event) => {
            const ce = e as CustomEvent
            if (ce.detail?.open !== undefined) {
                setStatsOpen(ce.detail.open)
            }
        }
        const handleViews = (e: Event) => {
            const ce = e as CustomEvent
            if (ce.detail?.open !== undefined) {
                setViewsOpen(ce.detail.open)
            }
        }

        window.addEventListener('crm-stats-state', handleStats)
        window.addEventListener('crm-views-state', handleViews)
        return () => {
            window.removeEventListener('crm-stats-state', handleStats)
            window.removeEventListener('crm-views-state', handleViews)
        }
    }, [])

    const toggleStats = () => {
        const next = !statsOpen
        setStatsOpen(next)
        window.dispatchEvent(new CustomEvent('toggle-crm-stats', { detail: { open: next } }))
    }

    const toggleViews = () => {
        const next = !viewsOpen
        setViewsOpen(next)
        window.dispatchEvent(new CustomEvent('toggle-crm-views', { detail: { open: next } }))
    }

    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <Button
                variant={statsOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleStats}
                className={cn(
                    "h-9 text-xs font-semibold gap-1.5 transition-all shadow-sm",
                    statsOpen 
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent" 
                        : "text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
                title="İstatistikleri Göster/Gizle"
            >
                <BarChart3 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">İstatistikler</span>
            </Button>
            <Button
                variant={viewsOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleViews}
                className={cn(
                    "h-9 text-xs font-semibold gap-1.5 transition-all shadow-sm",
                    viewsOpen 
                        ? "bg-blue-600 hover:bg-blue-700 text-white border-transparent" 
                        : "text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
                title="Sütun ve Görünüm Ayarları"
            >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Görünüm Ayarları</span>
            </Button>
        </div>
    )
}
