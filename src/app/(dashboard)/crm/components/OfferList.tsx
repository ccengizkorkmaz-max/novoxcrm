'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Printer, Trash, Eye, FileSignature } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"



import NegotiationDialog from './NegotiationDialog'
import ApproveOfferButton from './ApproveOfferButton'


interface Offer {
    id: string
    offer_number?: string // Added
    customer_id: string
    unit_id?: string
    price: number
    currency: string
    status: string
    valid_until?: string
    payment_plan?: any
    customers?: { full_name: string }
    units?: { unit_number: string, projects?: { name: string } }
    offer_negotiations?: any[]
    created_at: string
}

export default function OfferList({ offers }: { offers: Offer[] }) {
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)

    // Helper to get latest negotiation
    const getLatestNegotiation = (offer: Offer) => {
        if (!offer.offer_negotiations || offer.offer_negotiations.length === 0) return null
        return [...offer.offer_negotiations].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
    }

    // Placeholder for delete or print actions
    const handlePrint = (id: string) => {
        alert('PDF yazdırma özelliği eklenecek: ' + id)
    }

    const openPlan = (offer: Offer) => {
        setSelectedOffer(offer)
        setIsPlanOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Teklif No</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>Proje / Ünite</TableHead>
                            <TableHead>Fiyat</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Geçerlilik</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {offers && offers.length > 0 ? (
                            offers.map((offer) => {
                                const latestNeg = getLatestNegotiation(offer)
                                const displayPrice = latestNeg ? latestNeg.proposed_price : offer.price
                                const displayDate = latestNeg ? latestNeg.proposed_valid_until : offer.valid_until

                                return (
                                    <TableRow key={offer.id}>
                                        <TableCell className="font-medium text-xs text-muted-foreground whitespace-nowrap">
                                            {offer.offer_number || '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">{offer.customers?.full_name}</TableCell>
                                        <TableCell>
                                            {offer.units?.projects?.name ? `${offer.units.projects.name} - ` : ''}
                                            {offer.units?.unit_number || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={latestNeg ? "font-bold text-orange-600" : ""}>
                                                    {formatCurrency(displayPrice, offer.currency)}
                                                </span>
                                                {latestNeg && (
                                                    <span className="text-[10px] text-muted-foreground line-through">
                                                        {formatCurrency(offer.price, offer.currency)}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${offer.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                                                offer.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                                    offer.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                                                        offer.status.includes('Kapora') ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {offer.status === 'Sent' ? (
                                                    latestNeg?.source === 'Customer' ? 'Teklif Geldi' : 'Teklif Verildi'
                                                ) :
                                                    offer.status === 'Accepted' ? 'Teklif Onaylandı' :
                                                        offer.status === 'Draft' ? 'Taslak' :
                                                            offer.status === 'Teklif - Kapora Bekleniyor' ? 'Kapora Bekleniyor' : offer.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={latestNeg ? "font-medium text-orange-600" : ""}>
                                                    {displayDate ? new Date(displayDate).toLocaleDateString('tr-TR') : '-'}
                                                </span>
                                                {latestNeg && (
                                                    <span className="text-[10px] text-muted-foreground line-through">
                                                        {offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('tr-TR') : '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => openPlan(offer)} title="Ödeme Planını Gör">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Link href={`/offers/${offer.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                                    <FileText className="h-4 w-4" />
                                                </Link>
                                                <NegotiationDialog
                                                    offerId={offer.id}
                                                    currentPrice={offer.price}
                                                    currentCurrency={offer.currency}
                                                    customerName={offer.customers?.full_name || ''}
                                                    unitInfo={`${offer.units?.projects?.name || ''} - ${offer.units?.unit_number || ''}`}
                                                />
                                                <ApproveOfferButton
                                                    offerId={offer.id}
                                                    customerName={offer.customers?.full_name || ''}
                                                    unitInfo={`${offer.units?.projects?.name || ''} - ${offer.units?.unit_number || ''}`}
                                                />
                                                {offer.status === 'Accepted' && (
                                                    <Link href={`/contracts/new?offerId=${offer.id}&unitId=${offer.unit_id}&customerId=${offer.customer_id}`}>
                                                        <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                                                            <FileSignature className="h-4 w-4 mr-2" />
                                                            Sözleşme Sürecini Başlat
                                                        </Button>
                                                    </Link>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handlePrint(offer.id)} title="Yazdır" className="hidden">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                )
                            })
                        ) : (

                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Henüz bir teklif oluşturulmamış.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Ödeme Planı Detayı</DialogTitle>
                    </DialogHeader>
                    {selectedOffer && selectedOffer.payment_plan?.payment_items ? (
                        <div className="border rounded-md max-h-[400px] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tip</TableHead>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead className="text-right">Tutar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedOffer.payment_plan.payment_items.map((item: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                {item.payment_type === 'Down Payment' ? 'Peşinat' :
                                                    item.payment_type === 'Installment' ? 'Taksit' :
                                                        item.payment_type === 'Interim Payment' ? 'Ara Ödeme' : 'Final Ödeme'}
                                            </TableCell>
                                            <TableCell>{new Date(item.due_date).toLocaleDateString('tr-TR')}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(item.amount, selectedOffer.currency)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell colSpan={2}>Toplam</TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(selectedOffer.price, selectedOffer.currency)}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Bu teklif için ödeme planı bulunamadı.
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
