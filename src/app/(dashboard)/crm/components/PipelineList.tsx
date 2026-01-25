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
import { Calculator } from 'lucide-react'
import { updateSaleStatus } from '../actions'
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

    const handlePlanClick = (saleId: string) => {
        setSelectedSaleId(saleId)
        setIsPlanOpen(true)
    }

    const handleStatusChange = async (id: string, newStatus: string) => {
        await updateSaleStatus(id, newStatus)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card relative w-full overflow-auto max-h-[calc(100vh-220px)]">
                <table className="w-full caption-bottom text-sm">
                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur shadow-sm">
                        <TableRow>
                            <TableHead className="min-w-[180px]">Müşteri</TableHead>
                            <TableHead className="min-w-[220px]">Proje / Ünite</TableHead>
                            <TableHead className="w-[240px]">Durum</TableHead>
                            <TableHead className="w-[120px]">Tarih</TableHead>
                            <TableHead className="w-[140px] text-right">Tutar</TableHead>
                            <TableHead className="min-w-[180px] text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales && sales.length > 0 ? (
                            sales.map((sale: any) => {
                                const isCompleted = sale.status === 'Completed'
                                return (
                                    <TableRow
                                        key={sale.id}
                                        className={isCompleted ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                                    >
                                        <TableCell className={`font-medium ${isCompleted ? 'text-white' : ''}`}>{sale.customers?.full_name}</TableCell>
                                        <TableCell className={isCompleted ? 'text-white' : ''}>
                                            {sale.units ? (
                                                `${sale.units.projects?.name} - ${sale.units.unit_number}`
                                            ) : (
                                                <span className={`italic ${isCompleted ? 'text-white/80' : 'text-muted-foreground'}`}>Ünite Seçilmedi</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isCompleted ? (
                                                <span className="font-semibold text-white">Kazanıldı</span>
                                            ) : (
                                                <Select
                                                    value={sale.status}
                                                    onValueChange={(val) => handleStatusChange(sale.id, val)}
                                                    disabled={sale.status === 'Lost'}
                                                >
                                                    <SelectTrigger className="w-full h-8">
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
                                        <TableCell className={isCompleted ? 'text-white' : ''}>{new Date(sale.created_at).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell className={`text-right ${isCompleted ? 'text-white font-semibold' : ''}`}>
                                            {sale.final_price ?
                                                formatCurrency(sale.final_price, sale.currency || sale.units?.currency)
                                                : sale.units?.price ?
                                                    formatCurrency(sale.units.price, sale.units.currency)
                                                    : '-'
                                            }
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {!isCompleted && (
                                                <div className="flex justify-end gap-2">
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
                                                    <Button variant="outline" size="sm" onClick={() => handlePlanClick(sale.id)}>
                                                        <Calculator className="mr-2 h-4 w-4" /> Ödeme Planı
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
                            <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">Aktif satış bulunamadı.</TableCell></TableRow>
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
