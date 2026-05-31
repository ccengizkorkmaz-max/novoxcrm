'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
    className?: string
    contentClassName?: string
}

export function CollapsibleSection({ 
    title, 
    children, 
    defaultOpen = false,
    className,
    contentClassName
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className={cn("relative rounded-xl border bg-card shadow-sm overflow-hidden", className)}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 hover:bg-slate-100 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest transition-colors"
            >
                <span className="truncate">{title}</span>
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
            {isOpen && (
                <div className={cn("border-t bg-background", contentClassName)}>
                    {children}
                </div>
            )}
        </div>
    )
}
