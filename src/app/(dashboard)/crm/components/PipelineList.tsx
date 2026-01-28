'use client'

import { useState } from 'react'
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
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)

    const [isAssigning, setIsAssigning] = useState<string | null>(null)

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
            toast.success('Satış başarıyla atandı.')
        }
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        await updateSaleStatus(id, newStatus)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-xl border bg-card shadow-sm relative w-full overflow-auto max-h-[calc(100vh-220px)] max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-18rem)]">
                <table className="min-w-[1200px] w-full caption-bottom text-sm">
                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/60">
                        <TableRow className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <TableHead className="min-w-[200px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Müşteri</TableHead>
                            <TableHead className="min-w-[240px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Proje / Ünite</TableHead>
                            <TableHead className="w-[200px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Durum</TableHead>
                            <TableHead className="w-[140px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tarih</TableHead>
                            <TableHead className="w-[160px] h-12 px-4 text-right align-middle font-medium text-muted-foreground">Tutar</TableHead>
                            <TableHead className="min-w-[180px] h-12 px-4 text-left align-middle font-medium text-muted-foreground">Temsilci</TableHead>
                            <TableHead className="min-w-[200px] h-12 px-4 text-right align-middle font-medium text-muted-foreground">İşlemler</TableHead>
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
                                        <TableCell className="p-4 align-middle">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground text-sm">{sale.customers?.full_name}</span>
                                                <span className="text-xs text-muted-foreground hidden lg:inline-block">ID: {sale.id.slice(0, 8)}...</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="p-4 align-middle">
                                            {sale.units ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{sale.units.projects?.name}</span>
                                                    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                                        NO: {sale.units.unit_number}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="italic text-muted-foreground text-sm flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Ünite Seçilmedi
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="p-4 align-middle">
                                            {isCompleted ? (
                                                <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                                    <Sparkles className="w-3 h-3" /> Kazanıldı
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
                                                        <SelectItem value="Lead">Lead</SelectItem>
                                                        <SelectItem value="Prospect">Fırsat</SelectItem>
                                                        <SelectItem value="Reservation">Opsiyonlu</SelectItem>
                                                        <SelectItem value="Opsiyon - Kapora Bekleniyor">Opsiyon - Kapora Bekleniyor</SelectItem>
                                                        <SelectItem value="Proposal">Teklif Verildi</SelectItem>
                                                        <SelectItem value="Teklif - Kapora Bekleniyor">Teklif - Kapora Bekleniyor</SelectItem>
                                                        <SelectItem value="Negotiation">Pazarlık</SelectItem>
                                                        <SelectItem value="Sold">Teklif Onaylandı</SelectItem>
                                                        <SelectItem value="Lost">Kaybedildi</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                        <TableCell className="p-4 align-middle text-muted-foreground font-medium text-sm">
                                            {new Date(sale.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </TableCell>
                                        <TableCell className="p-4 align-middle text-right">
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
                                        <TableCell className="p-4 align-middle">
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
                                                        title={!sale.units?.projects?.id ? "Önce bir ünite/proje seçilmelidir" : "Ekibe otomatik ata"}
                                                    >
                                                        {isAssigning === sale.id ? (
                                                            "Atanıyor..."
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-3 h-3 mr-1" /> Otomatik Ata
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
                            <TableRow><TableCell colSpan={7} className="text-center h-32 text-muted-foreground flex-col items-center justify-center">
                                <span className="block mb-2">Aktif satış bulunamadı.</span>
                            </TableCell></TableRow>
                        )}
                    </TableBody>
                </table>
            </div>

            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ödeme Planı Hesapla</DialogTitle>
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
        </div >
    )
}
