'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SaleProcessIndicatorProps {
    sale: {
        unit_id?: string | null
        status: string
        offers?: Array<{ id: string; status: string; valid_until?: string; price?: number; currency?: string }> | null
        deposits?: Array<{ id: string; amount: number; currency: string; status: string }> | null
        reservation_expiry?: string | null
    }
}

type StepStatus = 'done' | 'active' | 'pending'

interface Step {
    label: string
    status: StepStatus
    detail?: string
}

function getSteps(sale: SaleProcessIndicatorProps['sale']): Step[] {
    const hasUnit = !!sale.unit_id
    const activeOffer = sale.offers?.find(o => !['Rejected', 'Cancelled', 'Expired', 'Lost'].includes(o.status))
    const hasOffer = !!activeOffer
    const pendingDeposit = sale.deposits?.find(d => d.status === 'Pending')
    const paidDeposit = sale.deposits?.find(d => d.status === 'Paid')
    const hasDeposit = !!pendingDeposit || !!paidDeposit
    const isReservation = ['Reservation', 'Opsiyon - Kapora Bekleniyor'].includes(sale.status)
    const isSold = ['Sold', 'Completed'].includes(sale.status)

    // Step 1: Ünite Eşleme
    const unitStep: Step = {
        label: 'Ünite',
        status: hasUnit ? 'done' : 'pending',
        detail: hasUnit ? 'Ünite eşlendi' : 'Ünite eşlenmedi'
    }

    // Step 2: Teklif
    const offerStep: Step = {
        label: 'Teklif',
        status: hasOffer ? 'done' : (hasUnit ? 'active' : 'pending'),
        detail: hasOffer
            ? `Teklif: ${activeOffer?.status}${activeOffer?.valid_until ? ` (${new Date(activeOffer.valid_until).toLocaleDateString('tr-TR')})` : ''}`
            : 'Teklif verilmedi'
    }

    // Step 3: Kapora
    const depositStep: Step = {
        label: 'Kapora',
        status: paidDeposit ? 'done' : pendingDeposit ? 'active' : 'pending',
        detail: paidDeposit
            ? `Kapora ödendi`
            : pendingDeposit
                ? `Kapora bekleniyor`
                : 'Kapora yok'
    }

    // Step 4: Onay / Satış
    const finalStep: Step = {
        label: 'Satış',
        status: isSold ? 'done' : 'pending',
        detail: isSold ? 'Satış tamamlandı' : 'Satış bekleniyor'
    }

    return [unitStep, offerStep, depositStep, finalStep]
}

const STATUS_COLORS: Record<StepStatus, { dot: string; bar: string; text: string }> = {
    done: { dot: 'bg-emerald-500', bar: 'bg-emerald-400', text: 'text-emerald-600' },
    active: { dot: 'bg-blue-500 animate-pulse', bar: 'bg-blue-300', text: 'text-blue-600' },
    pending: { dot: 'bg-slate-200', bar: 'bg-slate-100', text: 'text-slate-400' }
}

export default function SaleProcessIndicator({ sale }: SaleProcessIndicatorProps) {
    const steps = getSteps(sale)
    const completedCount = steps.filter(s => s.status === 'done').length
    const activeCount = steps.filter(s => s.status === 'active').length

    // Don't show for Lost/Completed
    if (['Lost', 'Completed'].includes(sale.status)) return null

    // If nothing has started (no unit), don't clutter
    if (completedCount === 0 && activeCount === 0) return null

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-[3px] cursor-default">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-[3px]">
                                <div className={`h-[6px] w-[6px] rounded-full ${STATUS_COLORS[step.status].dot} transition-all`} />
                                {i < steps.length - 1 && (
                                    <div className={`h-[2px] w-2.5 rounded-full ${step.status === 'done' ? STATUS_COLORS.done.bar : STATUS_COLORS.pending.bar} transition-all`} />
                                )}
                            </div>
                        ))}
                        <span className="text-[9px] font-bold text-slate-400 ml-1">{completedCount}/{steps.length}</span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-3 max-w-xs">
                    <div className="space-y-1.5">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLORS[step.status].dot}`} />
                                <span className={`text-xs font-semibold ${STATUS_COLORS[step.status].text}`}>
                                    {step.label}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-auto">
                                    {step.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
