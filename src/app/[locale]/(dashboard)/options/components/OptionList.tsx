'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Eye, Calendar, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { EditOptionDialog } from './edit-option-dialog'
import { convertReservationToOffer, cancelReservation } from '../../inventory/actions'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import PaymentPlanCalculator from '../../crm/components/PaymentPlanCalculator'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

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
    const t = useTranslations('Options')
    const [planOpen, setPlanOpen] = useState(false)
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

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
            toast.success(t('messages.offerCreated'))
        } else {
            toast.error(res.error || t('messages.offerError'))
        }
    }

    const handleCancelReservation = async (unitId: string, saleId: string) => {
        if (!confirm(t('confirm.cancelOption'))) return

        setIsDeleting(saleId)
        try {
            const res = await cancelReservation(unitId, saleId)
            if (res.success) {
                toast.success(t('messages.optionCancelled'))
            } else {
                toast.error(res.error || 'İşlem başarısız')
            }
        } catch (error) {
            toast.error('Bir hata oluştu')
        } finally {
            setIsDeleting(null)
        }
    }

    return (

        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('table.projectUnit')}</TableHead>
                            <TableHead>{t('table.customer')}</TableHead>
                            <TableHead>{t('table.type')}</TableHead>
                            <TableHead>{t('table.price')}</TableHead>
                            <TableHead>{t('table.expiry')}</TableHead>
                            <TableHead className="text-right">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {options && options.length > 0 ? (
                            options.map((option) => {
                                // Find the active reservation sale if it exists
                                const activeSale = option.sales?.find(s => s.status === 'Reservation' || s.status === 'Lead' || s.status === 'Opsiyon - Kapora Bekleniyor')
                                const customerName = activeSale?.customers?.full_name || '-'
                                const expiryDate = activeSale?.reservation_expiry

                                // Check if expired
                                const isExpired = expiryDate && new Date(expiryDate) < new Date()

                                // Find the associated offer (the latest one)
                                const activeOffer = option.offers && option.offers.length > 0
                                    ? option.offers.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                                    : null

                                return (
                                    <TableRow key={option.id} className={cn(isExpired && "opacity-60 bg-muted/30 grayscale-[0.5]")}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{option.projects?.name || '-'}</span>
                                                <span className="text-sm text-muted-foreground">{option.unit_number}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{customerName}</span>
                                                {isExpired && (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">SÜRESİ DOLDU</span>
                                                )}
                                            </div>
                                        </TableCell>
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
                                                <div className={cn("flex items-center gap-2", isExpired ? "text-red-500 font-bold" : "text-foreground")}>
                                                    <Calendar className="h-4 w-4 opacity-70" />
                                                    {new Date(expiryDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/inventory/${option.id}`}
                                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                                    title={t('actions.viewUnit')}
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
                                                        title={t('actions.viewOffer')}
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
                                                        {t('actions.createOffer')}
                                                    </Button>
                                                )}

                                                {/* Cancel/Delete button — always visible for reserved units */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => handleCancelReservation(option.id, activeSale?.id || '')}
                                                    disabled={isDeleting === (activeSale?.id || option.id)}
                                                    title={t('actions.cancelOption')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    {t('table.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={planOpen} onOpenChange={setPlanOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t('dialog.title')}</DialogTitle>
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

