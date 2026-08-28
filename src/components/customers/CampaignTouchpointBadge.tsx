'use client'

import React from 'react'
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Megaphone, Phone, PhoneOff, Clock, MessageSquare, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export interface CampaignTouchpointInfo {
    workflowName?: string | null
    channel?: 'whatsapp' | 'ai_call' | 'sms' | string
    startedAt?: string | null
    responseType?: 'call_requested' | 'opted_out' | 'answered' | 'no_response' | 'warm' | string | null
    buttonText?: string | null
    replyTime?: string | null
    callOutcome?: string | null
    callDuration?: number | null
}

export function CampaignTouchpointBadge({ info }: { info?: CampaignTouchpointInfo | null }) {
    if (!info || !info.workflowName) {
        return <span className="text-slate-300 text-xs">—</span>
    }

    const {
        workflowName,
        channel = 'whatsapp',
        startedAt,
        responseType,
        buttonText,
        replyTime,
        callOutcome,
        callDuration
    } = info

    // Determine Status Badge & Color
    let statusLabel = 'Gönderildi'
    let statusBadgeCls = 'bg-slate-100 text-slate-600 border-slate-200'
    let Icon = Clock

    if (buttonText) {
        const lowerBtn = buttonText.toLowerCase()
        if (lowerBtn.includes('beni') || lowerBtn.includes('evet') || lowerBtn.includes('ara')) {
            statusLabel = buttonText
            statusBadgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
            Icon = Phone
        } else if (lowerBtn.includes('hayır') || lowerBtn.includes('hayir') || lowerBtn.includes('red')) {
            statusLabel = buttonText
            statusBadgeCls = 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
            Icon = PhoneOff
        } else {
            statusLabel = buttonText
            statusBadgeCls = 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
            Icon = MessageSquare
        }
    } else if (responseType === 'call_requested') {
        statusLabel = 'Beni Arayın'
        statusBadgeCls = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
        Icon = Phone
    } else if (responseType === 'opted_out') {
        statusLabel = 'Reddetti'
        statusBadgeCls = 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
        Icon = PhoneOff
    } else if (channel === 'ai_call' && callOutcome) {
        if (['answered', 'interested', 'appointment_set'].includes(callOutcome)) {
            statusLabel = `Cevaplandı (${callDuration ? `${callDuration}s` : ''})`
            statusBadgeCls = 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
            Icon = CheckCircle2
        } else {
            statusLabel = callOutcome === 'no_answer' ? 'Cevapsız' : (callOutcome === 'busy' ? 'Meşgul' : callOutcome)
            statusBadgeCls = 'bg-slate-100 text-slate-600 border-slate-200'
            Icon = XCircle
        }
    }

    const formattedStart = startedAt ? new Date(startedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
    const formattedReply = replyTime ? new Date(replyTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex flex-col items-start text-left group cursor-pointer max-w-[170px] transition-all hover:scale-[1.02]">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 truncate w-full group-hover:text-blue-600">
                        <Megaphone className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate">{workflowName}</span>
                    </div>
                    <Badge variant="outline" className={`mt-0.5 text-[9px] px-1.5 py-0.2 rounded-md flex items-center gap-1 border ${statusBadgeCls}`}>
                        <Icon className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate max-w-[120px]">{statusLabel}</span>
                    </Badge>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-white shadow-xl rounded-2xl border border-slate-100 text-xs">
                <div className="font-bold text-slate-900 border-b pb-1.5 mb-2 flex items-center gap-1.5">
                    <Megaphone className="h-4 w-4 text-blue-500" />
                    <span className="truncate">{workflowName}</span>
                </div>
                <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">Kanal:</span>
                        <span className="font-semibold text-slate-700 capitalize">{channel === 'ai_call' ? '🤖 AI Sesli Arama' : (channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS')}</span>
                    </div>
                    {startedAt && (
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Gönderim:</span>
                            <span className="font-semibold text-slate-700">{formattedStart}</span>
                        </div>
                    )}
                    {buttonText && (
                        <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                            <span className="text-slate-500 font-medium">Buton Yanıtı:</span>
                            <span className="font-bold text-emerald-700">{buttonText}</span>
                        </div>
                    )}
                    {replyTime && (
                        <div className="flex justify-between">
                            <span className="text-slate-400 font-medium">Yanıt Saati:</span>
                            <span className="font-semibold text-slate-700">{formattedReply}</span>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
