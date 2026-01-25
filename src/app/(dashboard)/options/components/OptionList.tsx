'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Eye, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EditOptionDialog } from './edit-option-dialog'
import { convertReservationToOffer } from '../../inventory/actions'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import PaymentPlanCalculator from '../../crm/components/PaymentPlanCalculator'
import { useState } from 'react'



interface Option {
    id: string
    unit_number: string
    type: string
    price: number
    currency: string
    status: string
    projects?: { name: string }
    sales?: any[] // Joined sales records
    offers?: any[] // Joined offer records
}

export default function OptionList({ options, templates = [] }: { options: Option[], templates?: any[] }) {
    const [planOpen, setPlanOpen] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)

    const handleOfferClick = (saleId: string, unitId: string) => {
        setSelectedSaleId(saleId)
        setSelectedUnitId(unitId)
        setPlanOpen(true)
    }

    const handlePlanSaved = async () => {
        if (!selectedUnitId) return
        const res = await convertReservationToOffer(selectedUnitId)
        if (res.success) {
            setPlanOpen(false)
            toast.success("Teklif başarıyla oluşturuldu.")
        } else {
            toast.error(res.error || "Teklif oluşturulurken bir hata oluştu.")
        }
    }

    return (

        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Proje / Ünite</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Tip</TableHead>
                            <TableHead>Fiyat</TableHead>
                            <TableHead>Opsiyon Bitiş</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {options && options.length > 0 ? (
                            options.map((option) => {
                                // Find the active reservation sale if it exists
                                const activeSale = option.sales?.find(s => s.status === 'Reservation' || s.status === 'Lead' || s.status === 'Opsiyon - Kapora Bekleniyor')
                                const customerName = activeSale?.customers?.full_name || '-'
                                const expiryDate = activeSale?.reservation_expiry

                                // Find the associated offer (the latest one)
                                const activeOffer = option.offers && option.offers.length > 0
                                    ? option.offers.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                                    : null

                                return (
                                    <TableRow key={option.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{option.projects?.name || '-'}</span>
                                                <span className="text-sm text-muted-foreground">{option.unit_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{customerName}</TableCell>
                                        <TableCell>{option.type}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                {activeSale?.final_price ? (
                                                    <>
                                                        <span className="font-semibold text-primary">
                                                            {formatCurrency(activeSale.final_price, activeSale.currency)}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground line-through">
                                                            {formatCurrency(option.price, option.currency)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span>{formatCurrency(option.price, option.currency)}</span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {expiryDate ? (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {new Date(expiryDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/inventory/${option.id}`}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    title="Ünite Detayını Gör"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <EditOptionDialog
                                                    unitId={option.id}
                                                    unitNumber={option.unit_number}
                                                    projectName={option.projects?.name}
                                                    currentExpiry={expiryDate}
                                                />
                                                {activeOffer && (
                                                    <Link
                                                        href={`/offers/${activeOffer.id}`}
                                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                        title="Teklif Detayını Gör"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </Link>
                                                )}
                                                {activeSale && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleOfferClick(activeSale.id, option.id)}
                                                    >
                                                        Teklif Ver
                                                    </Button>
                                                )}


                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Aktif bir opsiyon kaydı bulunamadı.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ödeme Planı ve Teklif Oluştur</DialogTitle>
                    </DialogHeader>
                    {selectedSaleId && (
                        <PaymentPlanCalculator
                            saleId={selectedSaleId}
                            totalAmount={options.find(o => o.id === selectedUnitId)?.price}
                            initialCurrency={options.find(o => o.id === selectedUnitId)?.currency}
                            onClose={() => setPlanOpen(false)}
                            onSaveSuccess={handlePlanSaved}
                            templates={templates}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>

    )
}

