'use client'

import { useMemo, useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, User, Calendar } from 'lucide-react'
import { updateOpportunityStage, getSaleForOpportunity } from './opportunity-actions'
import PipelineReservationDialog from '../crm/components/PipelineReservationDialog'
import PipelineProposalDialog from '../crm/components/PipelineProposalDialog'

interface PipelineStage {
    key: string
    label: string
    color: string
    order: number
}

interface Opportunity {
    id: string
    title: string
    stage: string
    value: number | null
    currency: string
    value_try: number | null
    close_date: string | null
    notes: string | null
    created_at: string
    project_id?: string | null
    customers?: { id: string; full_name: string; phone: string | null } | null
    profiles?: { full_name: string } | null
}

interface OpportunitiesPageClientProps {
    opportunities: Opportunity[]
    pipelineStages: PipelineStage[]
    userRole: string
    projects: any[]
}

function formatCurrency(value: number | null, currency: string = 'TRY') {
    if (!value) return '-'
    const formatted = new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)

    const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£' }
    return `${symbols[currency] || currency} ${formatted}`
}

export default function OpportunitiesPageClient({ opportunities, pipelineStages, userRole, projects }: OpportunitiesPageClientProps) {
    const [localOpps, setLocalOpps] = useState<Opportunity[]>(opportunities)
    const [reservationSale, setReservationSale] = useState<{
        saleId: string
        customerName: string
        currentUnitId?: string | null
        opportunityId: string
    } | null>(null)
    const [reservationOpen, setReservationOpen] = useState(false)

    const [proposalSale, setProposalSale] = useState<{
        saleId: string
        customerName: string
        opportunityId: string
        totalAmount: number
        initialCurrency: string
        projectId?: string | null
    } | null>(null)
    const [proposalOpen, setProposalOpen] = useState(false)

    useEffect(() => {
        setLocalOpps(opportunities)
    }, [opportunities])

    // Sort stages by order
    const sortedStages = useMemo(() =>
        [...pipelineStages].sort((a, b) => a.order - b.order),
        [pipelineStages]
    )

    // Group opportunities by stage
    const grouped = useMemo(() => {
        const map: Record<string, Opportunity[]> = {}
        for (const stage of sortedStages) {
            map[stage.key] = []
        }
        for (const opp of localOpps) {
            if (map[opp.stage]) {
                map[opp.stage].push(opp)
            } else {
                // Bilinmeyen stage → ilk stage'e at
                const firstKey = sortedStages[0]?.key
                if (firstKey && map[firstKey]) {
                    map[firstKey].push(opp)
                }
            }
        }
        return map
    }, [localOpps, sortedStages])

    // Stats
    const totalValue = useMemo(() =>
        localOpps.reduce((sum, o) => sum + (o.value_try || 0), 0),
        [localOpps]
    )

    const wonValue = useMemo(() =>
        localOpps.filter(o => o.stage === 'won').reduce((sum, o) => sum + (o.value_try || 0), 0),
        [localOpps]
    )

    // HTML5 Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('text/plain', id)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleDrop = async (e: React.DragEvent, stageKey: string) => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (!id) return

        if (stageKey === 'reservation') {
            const saleInfo = await getSaleForOpportunity(id)
            if (saleInfo) {
                setReservationSale({
                    ...saleInfo,
                    opportunityId: id
                })
                setReservationOpen(true)
            } else {
                alert('Bu fırsata bağlı aktif bir satış kaydı bulunamadı. Lütfen önce satış kaydını kontrol edin.')
            }
            return
        }

        if (stageKey === 'proposal') {
            const saleInfo = await getSaleForOpportunity(id)
            if (saleInfo) {
                const opp = localOpps.find(o => o.id === id)
                setProposalSale({
                    saleId: saleInfo.saleId,
                    customerName: saleInfo.customerName,
                    opportunityId: id,
                    totalAmount: saleInfo.totalAmount || 0,
                    initialCurrency: saleInfo.initialCurrency || 'TRY',
                    projectId: opp?.project_id || null
                })
                setProposalOpen(true)
            } else {
                alert('Bu fırsata bağlı aktif bir satış kaydı bulunamadı. Lütfen önce satış kaydını kontrol edin.')
            }
            return
        }

        // Optimistic update
        const originalOpps = [...localOpps]
        setLocalOpps(prev => prev.map(o => o.id === id ? { ...o, stage: stageKey } : o))

        try {
            const res = await updateOpportunityStage(id, stageKey)
            if (!res.success) {
                setLocalOpps(originalOpps)
                alert('Fırsat aşaması güncellenemedi: ' + res.error)
            }
        } catch (err: any) {
            setLocalOpps(originalOpps)
            alert('Beklenmedik bir hata oluştu: ' + err.message)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-amber-500" />
                        Fırsatlar (Pipeline)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Satış fırsatlarınızı aşama aşama takip edin
                    </p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Toplam Fırsat</div>
                    <div className="text-2xl font-bold text-slate-700">{localOpps.length}</div>
                </Card>
                <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Pipeline Değeri (₺)</div>
                    <div className="text-2xl font-bold text-indigo-600">{formatCurrency(totalValue)}</div>
                </Card>
                <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Kazanılan (₺)</div>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(wonValue)}</div>
                </Card>
                <Card className="p-3">
                    <div className="text-xs text-muted-foreground">Dönüşüm Oranı</div>
                    <div className="text-2xl font-bold text-amber-600">
                        {localOpps.length > 0
                            ? `%${Math.round((localOpps.filter(o => o.stage === 'won').length / localOpps.length) * 100)}`
                            : '-'
                        }
                    </div>
                </Card>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-3 overflow-x-auto pb-4">
                {sortedStages.map(stage => {
                    const stageOpps = grouped[stage.key] || []
                    const stageValue = stageOpps.reduce((sum, o) => sum + (o.value_try || 0), 0)

                    return (
                        <div
                            key={stage.key}
                            className="flex-shrink-0 w-[280px] flex flex-col"
                        >
                            {/* Stage Header */}
                            <div
                                className="rounded-t-lg px-3 py-2 flex items-center justify-between"
                                style={{ backgroundColor: stage.color + '15', borderBottom: `2px solid ${stage.color}` }}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="font-medium text-sm">{stage.label}</span>
                                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                                        {stageOpps.length}
                                    </Badge>
                                </div>
                                {stageValue > 0 && (
                                    <span className="text-xs text-muted-foreground font-medium">
                                        {formatCurrency(stageValue)}
                                    </span>
                                )}
                            </div>

                            {/* Opportunity Cards */}
                            <div 
                                className="flex-1 bg-muted/30 rounded-b-lg p-2 space-y-2 min-h-[200px]"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, stage.key)}
                            >
                                {stageOpps.length === 0 ? (
                                    <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                                        Fırsat yok
                                    </div>
                                ) : (
                                    stageOpps.map(opp => (
                                        <Card 
                                            key={opp.id} 
                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, opp.id)}
                                        >
                                            <CardContent className="p-3 space-y-2">
                                                <div className="font-medium text-sm leading-tight">{opp.title}</div>

                                                {opp.customers && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <User className="h-3 w-3" />
                                                        {opp.customers.full_name}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    {opp.value && (
                                                        <span className="text-sm font-semibold" style={{ color: stage.color }}>
                                                            {formatCurrency(opp.value, opp.currency)}
                                                        </span>
                                                    )}
                                                    {opp.close_date && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {new Date(opp.close_date).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    )}
                                                </div>

                                                {opp.profiles && (
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <User className="h-3 w-3" />
                                                        {opp.profiles.full_name}
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            {reservationSale && (
                <PipelineReservationDialog
                    saleId={reservationSale.saleId}
                    customerName={reservationSale.customerName}
                    currentUnitId={reservationSale.currentUnitId}
                    projects={projects}
                    status="Prospect"
                    isOpen={reservationOpen}
                    onOpenChange={(open) => {
                        setReservationOpen(open)
                        if (!open) setReservationSale(null)
                    }}
                    showTriggerButton={false}
                    onSuccess={() => {
                        // Optimistically move card to reservation column
                        setLocalOpps(prev => prev.map(o => o.id === reservationSale.opportunityId ? { ...o, stage: 'reservation' } : o))
                    }}
                />
            )}
            {proposalSale && (
                <PipelineProposalDialog
                    saleId={proposalSale.saleId}
                    opportunityId={proposalSale.opportunityId}
                    customerName={proposalSale.customerName}
                    totalAmount={proposalSale.totalAmount}
                    initialCurrency={proposalSale.initialCurrency}
                    projectId={proposalSale.projectId}
                    isOpen={proposalOpen}
                    onOpenChange={(open) => {
                        setProposalOpen(open)
                        if (!open) setProposalSale(null)
                    }}
                    onSuccess={() => {
                        setLocalOpps(prev => prev.map(o => o.id === proposalSale.opportunityId ? { ...o, stage: 'proposal' } : o))
                    }}
                />
            )}
        </div>
    )
}
