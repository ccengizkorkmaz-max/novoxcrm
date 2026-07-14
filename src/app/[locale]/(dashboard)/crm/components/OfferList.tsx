'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileText, Printer, FileSignature, ReceiptText, Calculator, Trash2, Loader2, XCircle, Hash, User, Building2, Banknote, Clock, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useRouter, useSearchParams } from 'next/navigation'
import { updateOfferStatus } from '@/app/[locale]/(dashboard)/offers/actions'

import NegotiationDialog from './NegotiationDialog'
import ApproveOfferButton from './ApproveOfferButton'
import { deleteOffer } from '@/app/[locale]/(dashboard)/offers/actions'
import { toast } from 'sonner'
import ProposalShareButton from '@/app/[locale]/(dashboard)/offers/components/ProposalPdfGenerator'


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

import { useTranslations } from 'next-intl'

const ACTIVE_STATUSES = ['Draft', 'Sent', 'Accepted', 'Pending', 'Teklif - Kapora Bekleniyor']
const COMPLETED_STATUSES = ['Contract', 'Rejected', 'Expired', 'Closed']

export default function OfferList({ offers, userRole }: { offers: Offer[], userRole?: string }) {
    const t = useTranslations('Offers')
    const router = useRouter()
    const searchParams = useSearchParams()
    const highlightId = searchParams.get('highlight')
    const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
    const [isPlanOpen, setIsPlanOpen] = useState(false)
    const [startingContractId, setStartingContractId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

    // Automatically switch tabs if the highlighted offer status is completed
    useEffect(() => {
        if (highlightId) {
            const offerToHighlight = offers.find(o => o.id === highlightId)
            if (offerToHighlight) {
                if (COMPLETED_STATUSES.includes(offerToHighlight.status)) {
                    setActiveTab('completed')
                } else {
                    setActiveTab('active')
                }
            }
        }
    }, [highlightId, offers])

    // Smoothly scroll the highlighted row into view
    useEffect(() => {
        if (highlightId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`offer-row-${highlightId}`)
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }, 200)
            return () => clearTimeout(timer)
        }
    }, [highlightId, activeTab])

    const filteredOffers = useMemo(() => {
        const targetStatuses = activeTab === 'active' ? ACTIVE_STATUSES : COMPLETED_STATUSES
        return offers.filter(o => targetStatuses.includes(o.status))
    }, [offers, activeTab])

    const activeCount = useMemo(() => offers.filter(o => ACTIVE_STATUSES.includes(o.status)).length, [offers])
    const completedCount = useMemo(() => offers.filter(o => COMPLETED_STATUSES.includes(o.status)).length, [offers])

    const [lostDialogOpen, setLostDialogOpen] = useState(false)
    const [lostOfferId, setLostOfferId] = useState<string | null>(null)
    const [lostReasonText, setLostReasonText] = useState('')
    const [lostSaving, setLostSaving] = useState(false)

    const openLostDialog = (offerId: string) => {
        setLostOfferId(offerId)
        setLostReasonText('')
        setLostDialogOpen(true)
    }

    const submitLostOffer = async () => {
        if (!lostOfferId) return
        setLostSaving(true)
        try {
            const { markOfferAsLost } = await import('@/app/[locale]/(dashboard)/offers/actions')
            const res = await markOfferAsLost(lostOfferId, lostReasonText)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Teklif kaybedildi olarak işaretlendi.')
            }
            setLostDialogOpen(false)
            router.refresh()
        } catch (error: any) {
            console.error('Submit lost offer error:', error)
            toast.error(error.message || 'Hata oluştu')
            setLostDialogOpen(false)
        } finally {
            setLostSaving(false)
        }
    }

    const handleStartContract = async (offer: Offer) => {
        setStartingContractId(offer.id)
        try {
            const res = await updateOfferStatus(offer.id, 'Contract')
            if (res?.error) {
                toast.error(res.error)
                return
            }
            toast.success("Sözleşme süreci başlatıldı.")
            router.push(`/contracts/new?offerId=${offer.id}&unitId=${offer.unit_id}&customerId=${offer.customer_id}`)
        } catch (error) {
            console.error(error)
            toast.error("İşlem başlatılırken bir hata oluştu.")
        } finally {
            setStartingContractId(null)
        }
    }

    // Helper to get latest negotiation
    const getLatestNegotiation = (offer: Offer) => {
        if (!offer.offer_negotiations || offer.offer_negotiations.length === 0) return null
        return [...offer.offer_negotiations].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
    }

    // Print/PDF replaced by ProposalShareButton

    const handleDelete = async (id: string) => {
        if (!window.confirm("Teklifi silmek istediğinize emin misiniz?")) return
        
        try {
            const formData = new FormData()
            formData.append('id', id)
            const result = await deleteOffer(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Teklif başarıyla silindi.")
            }
        } catch (error) {
            toast.error("Teklif silinirken bir hata oluştu.")
        }
    }

    const openPlan = (offer: Offer) => {
        setSelectedOffer(offer)
        setIsPlanOpen(true)
    }

    return (
        <div className="space-y-4">
            {/* Tab Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'active'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    Aktif Teklifler
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {activeCount}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        activeTab === 'completed'
                            ? 'bg-slate-700 text-white shadow-lg shadow-slate-300'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                    Tamamlanan
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                        activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                        {completedCount}
                    </span>
                </button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-800 hover:bg-slate-800 border-none">
                            <TableHead className="text-white font-bold text-[11px] uppercase tracking-wider"><span className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5 text-blue-300" />{t('table.offerNo')}</span></TableHead>
                            <TableHead className="text-white font-bold text-[11px] uppercase tracking-wider"><span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-300" />{t('table.customer')}</span></TableHead>
                            <TableHead className="text-white font-bold text-[11px] uppercase tracking-wider"><span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-amber-300" />{t('table.projectUnit')}</span></TableHead>
                            <TableHead className="text-white font-bold text-[11px] uppercase tracking-wider"><span className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-emerald-300" />{t('table.price')}</span></TableHead>
                            <TableHead className="text-slate-300 font-bold text-[11px] uppercase tracking-wider">{t('table.status')}</TableHead>
                            <TableHead className="text-white font-bold text-[11px] uppercase tracking-wider"><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-purple-300" />{t('table.validity')}</span></TableHead>
                            <TableHead className="text-right text-slate-300 font-bold text-[11px] uppercase tracking-wider">{t('table.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOffers && filteredOffers.length > 0 ? (
                            filteredOffers.map((offer) => {
                                const latestNeg = getLatestNegotiation(offer)
                                const displayPrice = latestNeg ? latestNeg.proposed_price : offer.price
                                const displayDate = latestNeg ? latestNeg.proposed_valid_until : offer.valid_until

                                return (
                                    <TableRow 
                                        key={offer.id}
                                        id={`offer-row-${offer.id}`}
                                        className={offer.id === highlightId ? "bg-amber-50/80 hover:bg-amber-100/80 border-l-4 border-l-amber-500 dark:bg-amber-950/30 ring-2 ring-amber-500/20 transition-all duration-1000" : ""}
                                    >
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
                                                        offer.status === 'Contract' ? 'bg-emerald-100 text-emerald-800' :
                                                            offer.status === 'Closed' ? 'bg-slate-200 text-slate-700' :
                                                                offer.status.includes('Kapora') ? 'bg-orange-100 text-orange-800' :
                                                                    offer.status === 'Expired' ? 'bg-slate-100 text-slate-500' :
                                                                        'bg-gray-100 text-gray-800'
                                                }`}>
                                                {offer.status === 'Sent' ? (
                                                    latestNeg?.source === 'Customer' ? t('status.received') : t('status.sent')
                                                ) :
                                                    offer.status === 'Accepted' ? t('status.accepted') :
                                                        offer.status === 'Draft' ? t('status.draft') :
                                                            offer.status === 'Contract' ? 'Sözleşmede' :
                                                                offer.status === 'Closed' ? 'Kapandı' :
                                                                    offer.status === 'Teklif - Kapora Bekleniyor' ? t('status.depositPending') :
                                                                        offer.status === 'Rejected' ? t('status.rejected') :
                                                                            offer.status === 'Expired' ? t('status.expired') :
                                                                                offer.status === 'Pending' ? t('status.pending') : offer.status}
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
                                            <div className="flex justify-end gap-2 items-center">
                                                <ProposalShareButton offerId={offer.id} compact />
                                                <Button variant="ghost" size="icon" onClick={() => openPlan(offer)} title={t('actions.viewPlan')}>
                                                    <ReceiptText className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                {activeTab === 'active' && (
                                                    <>
                                                        <NegotiationDialog
                                                            offerId={offer.id}
                                                            currentPrice={offer.price}
                                                            currentCurrency={offer.currency}
                                                            customerName={offer.customers?.full_name || ''}
                                                            unitInfo={`${offer.units?.projects?.name || ''} - ${offer.units?.unit_number || ''}`}
                                                            initialPaymentPlan={offer.payment_plan}
                                                            offerStatus={offer.status}
                                                        />
                                                        {offer.status === 'Accepted' && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                                onClick={() => handleStartContract(offer)}
                                                                disabled={startingContractId === offer.id}
                                                            >
                                                                {startingContractId === offer.id ? (
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                ) : (
                                                                    <FileSignature className="h-4 w-4 mr-2" />
                                                                )}
                                                                Sözleşme
                                                            </Button>
                                                        )}
                                                        {!['Rejected', 'Closed', 'Contract', 'Expired'].includes(offer.status) && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                onClick={() => openLostDialog(offer.id)} 
                                                                className="gap-2 h-9 px-4 rounded-xl bg-red-50 border-red-200 text-red-700 font-bold hover:bg-red-100 transition-all select-none text-[11px]"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                                <span>Süreci Sonlandır</span>
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                {(userRole === 'admin' || userRole === 'owner') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(offer.id)} title="Sil" className="hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>

                                    </TableRow>
                                )
                            })
                        ) : (

                            <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">{t('table.empty')}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isPlanOpen} onOpenChange={setIsPlanOpen}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100 italic">
                        <DialogTitle className="flex items-center gap-3 text-xl font-black text-slate-800 uppercase tracking-tight">
                            <ReceiptText className="w-6 h-6 text-blue-600" />
                            {t('dialog.planTitle')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-6 overflow-hidden">
                        {(() => {
                            const latestNeg = selectedOffer ? getLatestNegotiation(selectedOffer) : null
                            const planToShow = latestNeg?.proposed_payment_plan || selectedOffer?.payment_plan
                            const currency = selectedOffer?.currency || 'TRY'
                            const price = latestNeg?.proposed_price || selectedOffer?.price || 0

                            if (!planToShow?.payment_items) {
                                return (
                                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        {t('dialog.noPlan')}
                                    </div>
                                )
                            }

                            return (
                                <div className="space-y-4">
                                    {latestNeg && (
                                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl mb-4">
                                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1 italic">⚠️ ÖNERİLEN PLAN GÖRÜNTÜLENİYOR</p>
                                            <p className="text-xs font-bold text-orange-800">Bu plan {new Date(latestNeg.created_at).toLocaleDateString('tr-TR')} tarihli pazarlık önerisidir.</p>
                                        </div>
                                    )}
                                    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
                                        <div className="max-h-[400px] overflow-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('dialog.type')}</TableHead>
                                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">{t('dialog.date')}</TableHead>
                                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 pr-6">{t('dialog.amount')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {planToShow.payment_items.map((item: any, idx: number) => (
                                                        <TableRow key={idx} className="border-slate-50 group hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="font-bold text-slate-600 py-3">
                                                                {item.payment_type === 'Down Payment' || item.payment_type === 'DownPayment' ? t('dialog.downPayment') :
                                                                    item.payment_type === 'Installment' ? t('dialog.installment') :
                                                                        item.payment_type === 'Interim Payment' || item.payment_type === 'InterimPayment' || item.payment_type === 'Balloon' ? t('dialog.interim') : t('dialog.final')}
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold text-slate-400 text-xs">
                                                                {new Date(item.due_date).toLocaleDateString('tr-TR')}
                                                            </TableCell>
                                                            <TableCell className="text-right font-black text-slate-800 pr-6">
                                                                {formatCurrency(item.amount, currency)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-slate-900 text-white font-black hover:bg-slate-900 border-none">
                                                        <TableCell colSpan={2} className="py-4 rounded-bl-2xl uppercase tracking-widest text-xs opacity-70">
                                                            {t('dialog.total')}
                                                        </TableCell>
                                                        <TableCell className="text-right py-4 rounded-br-2xl text-lg font-black pr-6">
                                                            {formatCurrency(latestNeg ? planToShow.total_amount || price : selectedOffer?.price || 0, currency)}
                                                        </TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lost Reason Dialog */}
            <Dialog open={lostDialogOpen} onOpenChange={setLostDialogOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-white">
                    <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-lg font-black text-slate-800 uppercase tracking-tight">Teklifi Kaybetme Gerekçesi</DialogTitle>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <p className="text-xs text-slate-500 font-medium">
                            Teklifi kaybetme/reddetme nedeninizi açıklayınız. Bu gerekçe aktivite günlüğüne kaydedilecek ve ilişkili satış kaydına yansıtılacaktır.
                        </p>
                        <textarea
                            className="w-full min-h-[120px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none resize-none placeholder:text-slate-300"
                            placeholder="Müşteri bütçeyi aştı, başka projeden ev aldı vb..."
                            value={lostReasonText}
                            onChange={(e) => setLostReasonText(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setLostDialogOpen(false)} className="flex-1 h-11 border-slate-200 hover:bg-slate-50 font-bold rounded-xl">
                            Vazgeç
                        </Button>
                        <Button 
                            onClick={submitLostOffer} 
                            disabled={!lostReasonText.trim() || lostSaving} 
                            className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200"
                        >
                            {lostSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {lostSaving ? 'Kaydediliyor...' : 'Kaydet'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
