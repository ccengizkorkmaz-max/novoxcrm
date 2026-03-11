'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BackButton } from '@/components/back-button'

interface OfferDetailProps {
    offer: any
}

export default function OfferDetail({ offer }: OfferDetailProps) {
    const plan = offer.payment_plan

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg print:shadow-none print:max-w-none print:m-0 print:p-0">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    nav, header, footer, .no-print, .print-hidden {
                        display: none !important;
                    }
                    .print-container {
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                }
            `}</style>

            <div className="flex justify-between items-center print:hidden">
                <BackButton variant="outline" />
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Yazdır
                </Button>
            </div>

            {/* Header Section */}
            <div className="border-b pb-4 mb-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        {offer.units?.projects?.image_url && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden border bg-slate-50 flex-shrink-0">
                                <img 
                                    src={offer.units.projects.image_url} 
                                    alt={offer.units.projects.name} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 uppercase">SATIŞ TEKLİFİ</h1>
                            <p className="text-gray-500 mt-1 font-mono text-xs">NO: #{offer.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{new Date(offer.created_at).toLocaleDateString('tr-TR')}</p>
                        <p className="text-sm text-gray-500">Geçerlilik: {new Date(offer.valid_until).toLocaleDateString('tr-TR')}</p>
                        <p className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-tight">Bu teklif 7 gün geçerlidir.</p>
                    </div>
                </div>
            </div>

            {/* Customer & Unit Details */}
            <div className="grid grid-cols-2 gap-8 mb-6">
                <div>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Sayın</h3>
                    <p className="text-xl font-medium">{offer.customers?.full_name}</p>
                    <p className="text-gray-600">{offer.customers?.phone}</p>
                    <p className="text-gray-600">{offer.customers?.email}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Konut Bilgileri</h3>
                    <p className="text-xl font-medium">{offer.units?.projects?.name}</p>
                    <p className="text-gray-600">Ünite: {offer.units?.unit_number}</p>
                    <p className="text-gray-600">Tip: {offer.units?.type || '-'}</p>
                </div>
            </div>

            {/* Price Summary */}
            <Card className="mb-8 border-2 border-primary/10 bg-primary/5">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-gray-500 mb-1">Toplam Satış Tutarı</p>
                    <p className="text-4xl font-bold text-primary">
                        {formatCurrency(offer.price, offer.currency)}
                    </p>
                </CardContent>
            </Card>

            {/* Payment Plan */}
            {plan && plan.payment_items && plan.payment_items.length > 0 && (
                <div>
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-black font-medium">
                        Bu belge bilgilendirme amaçlıdır. Satış sözleşmesi yerine geçmez.
                    </div>
                    <h3 className="text-lg font-bold mb-4 border-b pb-2">Ödeme Planı</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tarih</TableHead>
                                <TableHead>Tip</TableHead>
                                <TableHead className="text-right">Tutar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plan.payment_items && plan.payment_items.length > 0 ? (
                                plan.payment_items.map((item: any, index: number) => (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(item.due_date).toLocaleDateString('tr-TR')}</TableCell>
                                        <TableCell>
                                            {item.payment_type === 'Down Payment' || item.payment_type === 'DownPayment' ? 'Peşinat' :
                                                item.payment_type === 'Installment' ? 'Taksit' :
                                                    item.payment_type === 'Interim Payment' || item.payment_type === 'InterimPayment' || item.payment_type === 'Balloon' ? 'Ara Ödeme' : 'Final Ödeme'}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(item.amount, offer.currency)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic">
                                        Ödeme planı dökümana henüz yansıtılmamış. Lütfen CRM panelinden tekrar kaydedin.
                                    </TableCell>
                                </TableRow>
                            )}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={2}>Toplam</TableCell>
                                <TableCell className="text-right">
                                    {formatCurrency(offer.price, offer.currency)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Validity Note */}
            <div className="mt-8 p-4 border border-dashed border-slate-200 rounded-lg text-center bg-slate-50/50">
                <p className="text-sm font-bold text-slate-600 italic">
                    "Bu teklif verildiği tarihten itibaren 7 gün boyunca geçerlidir."
                </p>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t text-center text-xs text-gray-400 print:mt-auto print:pt-4">
                <p>© {new Date().getFullYear()} NovoCRM - Profesyonel Gayrimenkul Yönetimi</p>
            </div>
        </div>
    )
}
