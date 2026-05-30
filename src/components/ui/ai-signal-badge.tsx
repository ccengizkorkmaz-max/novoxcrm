"use client"

import React from "react"
import { Bot } from "lucide-react"
import { differenceInDays, differenceInMonths, differenceInWeeks } from "date-fns"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface AiSignalBadgeProps {
    lastCallAt?: string | null;
    interestLevel?: string | null;
    callNotes?: string | null;
}

export function AiSignalBadge({ lastCallAt, interestLevel, callNotes }: AiSignalBadgeProps) {
    if (!lastCallAt) return null;

    const callDate = new Date(lastCallAt)
    const daysAgo = differenceInDays(new Date(), callDate)
    
    // Determine freshness colors
    let colorClass = "text-slate-400 bg-slate-50 border-slate-200" // Default: Very old (>1 month)
    let iconClass = "text-slate-400"
    
    if (daysAgo <= 7) {
        colorClass = "text-green-700 bg-green-50 border-green-200" // Fresh (< 1 week)
        iconClass = "text-green-600"
    } else if (daysAgo <= 30) {
        colorClass = "text-amber-700 bg-amber-50 border-amber-200" // Mid (1-4 weeks)
        iconClass = "text-amber-600"
    }

    // Format relative time
    let timeText = ""
    if (daysAgo === 0) {
        timeText = "Bugün"
    } else if (daysAgo === 1) {
        timeText = "Dün"
    } else if (daysAgo < 7) {
        timeText = `${daysAgo}g`
    } else if (daysAgo <= 30) {
        const weeks = differenceInWeeks(new Date(), callDate)
        timeText = `${Math.max(1, weeks)}hf`
    } else {
        const months = differenceInMonths(new Date(), callDate)
        timeText = `${Math.max(1, months)}ay`
    }

    const formattedDate = new Intl.DateTimeFormat('tr-TR', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    }).format(callDate)

    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-bold cursor-help transition-colors",
                        colorClass
                    )}>
                        <Bot className={cn("w-3 h-3", iconClass)} />
                        <span>{timeText}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] p-3 space-y-2">
                    <div className="font-semibold text-xs border-b pb-1 mb-1 border-slate-200">
                        🤖 AI Arama Sinyali
                    </div>
                    <div className="text-[11px] space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-400">Tarih:</span>
                            <span className="font-medium">{formattedDate}</span>
                        </div>
                        {interestLevel && (
                            <div className="flex justify-between">
                                <span className="text-slate-400">Skor:</span>
                                <span className="font-medium uppercase">{interestLevel}</span>
                            </div>
                        )}
                        {callNotes && (
                            <div className="mt-2 text-slate-300 bg-slate-800 p-1.5 rounded border border-slate-700 max-h-[80px] overflow-y-auto whitespace-pre-wrap">
                                {callNotes.replace('🤖 AI Arama Skoru:', 'Skor:')}
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
