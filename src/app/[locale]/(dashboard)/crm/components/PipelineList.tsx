'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calculator, Sparkles, User } from 'lucide-react'
import { updateSaleStatus, autoAssignLead } from '../actions'
import PaymentPlanCalculator from './PaymentPlanCalculator'
import MatchUnitDialog from './MatchUnitDialog'
import PipelineReservationDialog from './PipelineReservationDialog'
import { RestartSaleButton } from './RestartSaleButton'
import { toast } from 'sonner'




import { useTranslations, useLocale } from 'next-intl'

export default function PipelineList({
    sales,
    customers,
    availableUnits,
    templates = []
}: {
    sales: any[],
    customers: any[],
    availableUnits: any[],
    templates?: any[]
}) {
    const t = useTranslations('CRM')
    const locale = useLocale()
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)

    const [isAssigning, setIsAssigning] = useState<string | null>(null)

    // Resizable Columns State
    const [colWidths, setColWidths] = useState<Record<string, number>>({
        customer: 240,
        project: 200,
        unit: 100,
        status: 160,
        date: 140,
        amount: 160,
        rep: 180,
        actions: 140
    })
    const resizingRef = useRef<{ key: string, startX: number, startWidth: number } | null>(null)

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizingRef.current) return
            const { key, startX, startWidth } = resizingRef.current
            const diff = e.clientX - startX
            setColWidths(prev => ({ ...prev, [key]: Math.max(60, startWidth + diff) }))
            e.preventDefault() // Prevent text selection
        }
        const handleMouseUp = () => {
            if (resizingRef.current) {
                resizingRef.current = null
                document.body.style.cursor = 'default'
            }
        }
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    const ResizeHandle = ({ id }: { id: string }) => (
        <div
            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/50 transition-colors z-20 touch-none active:bg-primary"
            onMouseDown={(e) => {
                resizingRef.current = { key: id, startX: e.clientX, startWidth: colWidths[id] }
                document.body.style.cursor = 'col-resize'
                e.preventDefault()
            }}
            onClick={(e) => e.stopPropagation()}
        />
    )

    const handlePlanClick = (saleId: string) => {
        setSelectedSaleId(saleId)
        setIsPlanOpen(true)
    }

    const handleAutoAssign = async (saleId: string) => {
        setIsAssigning(saleId)
        const result = await autoAssignLead(saleId)
        setIsAssigning(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(t('actions.assigned'))
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        await updateSaleStatus(id, newStatus)
    }

    return (
        <div className="space-y-4">
            <div className="relative group">
                <div className="rounded-xl border bg-card shadow-sm relative w-full overflow-auto max-h-[calc(100vh-250px)] max-w-[calc(100vw-1rem)] lg:max-w-full print:max-h-none print:overflow-visible">
                    <table className="min-w-[1000px] w-full caption-bottom text-sm border-collapse">
                        <TableHeader className="sticky top-0 z-10 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-slate-100/60 font-sans">
                            <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.customer, minWidth: colWidths.customer }}>
                                    {t('table.customer')}
                                    <ResizeHandle id="customer" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.project, minWidth: colWidths.project }}>
                                    {t('table.project')}
                                    <ResizeHandle id="project" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.unit, minWidth: colWidths.unit }}>
                                    {t('table.unit')}
                                    <ResizeHandle id="unit" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.status, minWidth: colWidths.status }}>
                                    {t('table.status')}
                                    <ResizeHandle id="status" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.date, minWidth: colWidths.date }}>
                                    {t('table.date')}
                                    <ResizeHandle id="date" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.amount, minWidth: colWidths.amount }}>
                                    {t('table.amount')}
                                    <ResizeHandle id="amount" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.rep, minWidth: colWidths.rep }}>
                                    {t('table.rep')}
                                    <ResizeHandle id="rep" />
                                </TableHead>
                                <TableHead className="relative h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-75 border-r border-gray-300 dark:border-gray-700" style={{ width: colWidths.actions, minWidth: colWidths.actions }}>
                                    {t('table.actions')}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sales && sales.length > 0 ? (
                                sales.map((sale: any) => {
                                    const isCompleted = sale.status === 'Completed' || sale.status === 'Sold'
                                    const isLost = sale.status === 'Lost'

                                    // Dynamic Status Colors
                                    const getStatusColor = (status: string) => {
                                        switch (status) {
                                            case 'Sold': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
                                            case 'Completed': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200'
                                            case 'Lost': return 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200'
                                            case 'Negotiation': return 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
                                            case 'Proposal': return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
                                            case 'Reservation': return 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200'
                                            default: return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                                        }
                                    }

                                    return (
                                        <TableRow
                                            key={sale.id}
                                            className={`transition-colors border-b hover:bg-muted/30 ${isCompleted ? 'bg-emerald-50/30' : ''} ${isLost ? 'bg-red-50/20' : ''}`}
                                        >
                                            <TableCell className="p-4 align-middle border-r border-border/50">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground text-sm">{sale.customers?.full_name}</span>
                                                    <span className="text-xs text-muted-foreground hidden lg:inline-block">ID: {sale.id.slice(0, 8)}...</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 align-middle border-r border-border/50">
                                                <span className="font-medium text-foreground">
                                                    {sale.units?.projects?.name || sale.projects?.name || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-4 align-middle border-r border-border/50">
                                                {sale.units ? (
                                                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit">
                                                        NO: {sale.units.unit_number}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 align-middle border-r border-border/50">
                                                {isCompleted ? (
                                                    <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                        <Sparkles className="w-3 h-3" /> {t('actions.won')}
                                                    </div>
                                                ) : (
                                                    <Select
                                                        value={sale.status}
                                                        onValueChange={(val) => handleStatusChange(sale.id, val)}
                                                        disabled={sale.status === 'Lost'}
                                                    >
                                                        <SelectTrigger className={`w-full h-8 border text-xs font-medium focus:ring-1 focus:ring-offset-0 ${getStatusColor(sale.status)}`}>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Lead">{t('status.Lead')}</SelectItem>
                                                            <SelectItem value="Prospect">{t('status.Prospect')}</SelectItem>
                                                            <SelectItem value="Reservation">{t('status.Reservation')}</SelectItem>
                                                            <SelectItem value="Opsiyon - Kapora Bekleniyor">{t('status.OptionPending')}</SelectItem>
                                                            <SelectItem value="Proposal">{t('status.Proposal')}</SelectItem>
                                                            <SelectItem value="Teklif - Kapora Bekleniyor">{t('status.ProposalPending')}</SelectItem>
                                                            <SelectItem value="Negotiation">{t('status.Negotiation')}</SelectItem>
                                                            <SelectItem value="Sold">{t('status.Sold')}</SelectItem>
                                                            <SelectItem value="Lost">{t('status.Lost')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 align-middle text-muted-foreground font-medium text-sm">
                                                <span suppressHydrationWarning>
                                                    {new Date(sale.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-4 align-middle text-right border-r border-border/50">
                                                {sale.final_price || sale.units?.price ? (
                                                    <span className="font-bold text-foreground font-mono tracking-tight">
                                                        {sale.final_price ?
                                                            formatCurrency(sale.final_price, sale.currency || sale.units?.currency)
                                                            : formatCurrency(sale.units.price, sale.units.currency)
                                                        }
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 align-middle border-r border-border/50">
                                                <div className="flex items-center gap-2">
                                                    {sale.profiles?.full_name ? (
                                                        <div className="flex items-center gap-2 text-sm bg-muted/30 pl-1 pr-2 py-1 rounded-full border border-transparent hover:border-border transition-colors">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                                                                {sale.profiles.full_name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium text-foreground text-xs">{sale.profiles.full_name}</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] px-2 border border-blue-200 dashed bg-blue-50/30"
                                                            onClick={() => handleAutoAssign(sale.id)}
                                                            disabled={isAssigning === sale.id || !sale.units?.projects?.id}
                                                            title={!sale.units?.projects?.id ? t('actions.assignError') : t('actions.assignTooltip')}
                                                        >
                                                            {isAssigning === sale.id ? (
                                                                t('actions.assigning')
                                                            ) : (
                                                                <>
                                                                    <Sparkles className="w-3 h-3 mr-1" /> {t('actions.autoAssign')}
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 align-middle text-right">
                                                {!isCompleted && (
                                                    <div className="flex justify-end gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                                                        {(['Lead', 'Prospect', 'Reservation', 'Reserved', 'Opsiyon - Kapora Bekleniyor'].includes(sale.status)) && (
                                                            <PipelineReservationDialog
                                                                saleId={sale.id}
                                                                currentUnitId={sale.unit_id}
                                                                availableUnits={availableUnits}
                                                                customerName={sale.customers?.full_name}
                                                                status={sale.status}
                                                                expiryDate={sale.reservation_expiry}
                                                            />
                                                        )}

                                                        {['Lead', 'Prospect'].includes(sale.status) && (
                                                            <MatchUnitDialog
                                                                saleId={sale.id}
                                                                currentUnitId={sale.unit_id}
                                                                availableUnits={availableUnits}
                                                                customerName={sale.customers?.full_name}
                                                            />
                                                        )}
                                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handlePlanClick(sale.id)} title="Ödeme Planı">
                                                            <Calculator className="h-4 w-4 text-muted-foreground" />
                                                        </Button>

                                                        {sale.status === 'Lost' && !sale.restarted_at && (
                                                            <RestartSaleButton saleId={sale.id} />
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-32 text-muted-foreground flex-col items-center justify-center">
                                        <span className="block mb-2">{t('table.empty')}</span>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </table>
                </div>
                {/* Mobile Scroll Hint Overlay */}
                <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none bg-gradient-to-l from-background/40 to-transparent sm:hidden flex items-center justify-end pr-2">
                    <div className="w-1.5 h-12 bg-blue-500/20 rounded-full animate-pulse backdrop-blur-sm border border-blue-500/10" />
                </div>
            </div>

            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('actions.paymentPlanTitle')}</DialogTitle>
                    </DialogHeader>
                    {selectedSaleId && (
                        <PaymentPlanCalculator
                            saleId={selectedSaleId}
                            totalAmount={sales.find(s => s.id === selectedSaleId)?.final_price || sales.find(s => s.id === selectedSaleId)?.units?.price || 0}
                            initialCurrency={sales.find(s => s.id === selectedSaleId)?.currency || sales.find(s => s.id === selectedSaleId)?.units?.currency || 'TRY'}
                            onClose={() => setIsPlanOpen(false)}
                            templates={templates}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
