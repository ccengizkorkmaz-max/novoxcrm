'use client'

import { useState, useEffect } from 'react'

interface CRMStatsCollapseProps {
    children: React.ReactNode
}

export function CRMStatsCollapse({ children }: CRMStatsCollapseProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleToggle = (e: Event) => {
            const ce = e as CustomEvent
            if (ce.detail?.open !== undefined) {
                setIsOpen(ce.detail.open)
            } else {
                setIsOpen(prev => {
                    const next = !prev
                    window.dispatchEvent(new CustomEvent('crm-stats-state', { detail: { open: next } }))
                    return next
                })
            }
        }
        window.addEventListener('toggle-crm-stats', handleToggle)
        return () => window.removeEventListener('toggle-crm-stats', handleToggle)
    }, [])

    // Synchronize initial state or updates back to toggles just in case
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('crm-stats-state', { detail: { open: isOpen } }))
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-card shadow-sm mb-3 transition-all animate-in fade-in slide-in-from-top-4 duration-200">
            {children}
        </div>
    )
}
