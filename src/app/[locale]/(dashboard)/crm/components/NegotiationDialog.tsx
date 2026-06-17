'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, CheckCircle2, XCircle, History, User, Calendar, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import { createNegotiation, approveNegotiation, getNegotiationHistory } from '../actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Badge } from "@/components/ui/badge"
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'
import { Calculator, ReceiptText } from 'lucide-react'
import PaymentPlanCalculator from './PaymentPlanCalculator'
import { getPaymentTemplates } from '../actions'

interface NegotiationDialogProps {
    offerId: string
    currentPrice: number
    currentCurrency: string
    customerName: string
    unitInfo: string
    initialPaymentPlan?: any
}

export default function NegotiationDialog({ offerId, currentPrice, currentCurrency, customerName, unitInfo, initialPaymentPlan }: NegotiationDialogProps) {
    const t = useTranslations('Offers.dialog')
    const tMsg = useTranslations('Offers.messages')
    const tActions = useTranslations('Offers.actions')
    const [isOpen, setIsOpen] = useState(false)
    const [history, setHistory] = useState<any[]>([])
    const [newPrice, setNewPrice] = useState(currentPrice)
    const [validityDate, setValidityDate] = useState('')
    const [source, setSource] = useState<'Sales' | 'Customer'>('Sales')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [approvalDeposit, setApprovalDeposit] = useState<number | string>(0)
    const [negToApprove, setNegToApprove] = useState<any>(null)
    const [showPlanInputs, setShowPlanInputs] = useState(false)
    const [proposedPlan, setProposedPlan] = useState<any>(initialPaymentPlan || null)
    const [templates, setTemplates] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (isOpen) {
            loadHistory()
            loadTemplates()
            const d = new Date()
            d.setDate(d.getDate() + 7)
            setValidityDate(d.toISOString().split('T')[0])
            
            // Default to offer price and plan initially
            setNewPrice(currentPrice)
            setProposedPlan(initialPaymentPlan || null)
        }
    }, [offerId, isOpen, currentPrice, initialPaymentPlan])

    const loadTemplates = async () => {
        const data = await getPaymentTemplates()
        if (data) setTemplates(data)
    }

    const loadHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await getNegotiationHistory(offerId)
            if (data) {
                setHistory(data)
                // Overwrite proposed price and plan with the latest negotiation proposal if it exists
                if (data.length > 0) {
                    const latest = data[0] // ordered by created_at desc
                    setNewPrice(latest.proposed_price)
                    if (latest.proposed_payment_plan) {
                        setProposedPlan(latest.proposed_payment_plan)
                    }
                }
            } else {
                setError(tMsg('historyError'))
            }
        } catch (e) {
            console.error("Load History Error:", e)
            setError(tMsg('serverError'))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitProposal = async () => {
        setLoading(true)
        try {
            const res = await createNegotiation({
                offer_id: offerId,
                proposed_price: newPrice,
                proposed_currency: currentCurrency,
                proposed_valid_until: validityDate,
                proposed_payment_plan: proposedPlan,
                source,
                notes
            })

            if (res.success) {
                toast.success(tMsg('proposalSaved'))
                setNotes('')
                loadHistory()
            } else {
                toast.error(res.error || tMsg('error'))
            }
        } finally {
            setLoading(false)
        }
    }

    const handleApproveConfirm = async () => {
        if (!negToApprove) return

        setLoading(true)
        try {
            const res = await approveNegotiation(negToApprove.id, Number(approvalDeposit))
            if (res.success) {
                toast.success(tMsg('offerApproved'))
                setIsOpen(false)
                router.refresh()
                setNegToApprove(null)
            } else {
                toast.error(res.error || tMsg('approveError'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-9 px-4 rounded-xl border-blue-100 text-blue-600 font-bold hover:bg-blue-50 transition-all select-none">
                        <MessageSquare className="h-4 w-4" /> {tActions('negotiate')}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl w-full sm:w-[95vw] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] p-0 overflow-hidden border-none shadow-2xl rounded-none sm:rounded-3xl flex flex-col">
                    <DialogHeader className="p-4 sm:p-8 bg-slate-50 border-b border-slate-100 shrink-0">
                        <div className="flex flex-col gap-1">
                            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                {t('negotiationTitle')}
                            </DialogTitle>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-0 sm:ml-13">
                                {customerName} <span className="mx-2 text-slate-200">/</span> {unitInfo}
                            </p>
                        </div>
                    </DialogHeader>

                    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1">
                        {/* New Proposal Form */}
                        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('enterProposal')}</h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('proposedPrice')} ({currentCurrency})</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={newPrice}
                                            onChange={(e) => setNewPrice(Number(e.target.value))}
                                            className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl font-black text-lg px-4"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('validUntil')}</Label>
                                    <Input
                                        type="date"
                                        value={validityDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setValidityDate(e.target.value)}
                                        className="h-12 bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl font-bold"
                                    />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('source')}</Label>
                                    <div className="flex gap-2">
                                        {['Sales', 'Customer'].map((s) => (
                                            <Button
                                                key={s}
                                                type="button"
                                                variant={source === s ? 'default' : 'outline'}
                                                className={`flex-1 h-11 rounded-xl font-bold uppercase text-[11px] tracking-widest ${source === s ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'border-slate-200 text-slate-500'}`}
                                                onClick={() => setSource(s as any)}
                                            >
                                                {s === 'Sales' ? t('salesTeam') : t('customer')}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4 sm:col-span-2 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <ReceiptText className="w-5 h-5" />
                                            <span className="text-sm font-black uppercase tracking-tight">Ödeme Planı Önerisi</span>
                                        </div>
                                        <Dialog open={showPlanInputs} onOpenChange={setShowPlanInputs}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className={`text-[10px] font-black uppercase tracking-widest h-7 px-3 rounded-lg border-blue-200 border ${proposedPlan ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                                >
                                                    {proposedPlan ? 'GÜNCELLE' : 'OLUŞTUR'}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-xl w-full sm:w-[95vw] h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[90dvh] rounded-none sm:rounded-2xl flex flex-col p-0 overflow-hidden bg-white">
                                                <DialogHeader className="p-4 sm:p-6 pb-2 shrink-0 border-b">
                                                    <DialogTitle>Müşteriye Ödeme Planı Öner</DialogTitle>
                                                </DialogHeader>
                                                <PaymentPlanCalculator
                                                    saleId={`negotiation-${offerId}`}
                                                    totalAmount={newPrice}
                                                    initialCurrency={currentCurrency}
                                                    templates={templates}
                                                    onClose={() => setShowPlanInputs(false)}
                                                    confirmButtonText="Planı Onayla ve Ekle"
                                                    onConfirm={(plan, totals, curr) => {
                                                        setProposedPlan({
                                                            payment_items: plan,
                                                            total_amount: totals.grandTotal,
                                                            installment_count: plan.filter(i => i.payment_type === 'Installment').length
                                                        })
                                                        setShowPlanInputs(false)
                                                    }}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    {proposedPlan && (
                                        <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-slate-400 uppercase">Özet:</span>
                                                <span className="text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">PLAN HAZIR ✅</span>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-black text-slate-800">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] text-slate-400 uppercase tracking-tighter">İşlem Tutarı</span>
                                                    <span>{formatCurrency(proposedPlan.total_amount, currentCurrency)}</span>
                                                </div>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[8px] text-slate-400 uppercase tracking-tighter">Vade</span>
                                                    <span>{proposedPlan.installment_count} Taksit</span>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setProposedPlan(null)}
                                                className="w-full mt-3 h-7 text-[9px] font-bold uppercase text-red-500 hover:bg-red-50 hover:text-red-600"
                                            >
                                                Planı Kaldır
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{t('notes')}</Label>
                                    <Textarea
                                        placeholder={t('notesPlaceholder')}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="bg-slate-50 border-slate-200 focus:ring-blue-500 rounded-xl resize-none min-h-[100px] font-medium"
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all select-none mt-2"
                                onClick={handleSubmitProposal}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                        <span>{t.has('savingProposal') ? t('savingProposal') : 'Kaydediliyor...'}</span>
                                    </div>
                                ) : (t.has('saveProposal') ? t('saveProposal') : 'Kaydet')}
                            </Button>
                        </div>

                        {/* History */}
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-400" />
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{t('history')}</h4>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {history.length} {t.has('records') ? t('records') : 'KAYIT'}
                                </span>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5" />
                                    {error}
                                </div>
                            )}

                            {loading && history.length === 0 ? (
                                <div className="p-12 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                                    <Loader2 className="h-8 w-8 text-blue-200 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 font-bold">{t('loading')}</p>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="p-12 text-center bg-slate-50/30 rounded-2xl border border-dashed border-slate-200">
                                    <MessageSquare className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 font-bold">{t('noHistory')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((neg) => (
                                        <div key={neg.id} className={`group relative p-6 rounded-2xl border transition-all ${neg.status === 'Approved' ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-md'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`font-black text-2xl tracking-tighter ${neg.status === 'Approved' ? 'text-emerald-700' : 'text-slate-900'}`}>
                                                        {formatCurrency(neg.proposed_price, neg.proposed_currency)}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <User className="h-3 w-3" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                                            {neg.source === 'Sales' ? `${t('salesTeam')}: ${neg.profiles?.full_name || 'Bilinmiyor'}` : t('customerProposal')}
                                                        </span>
                                                    </div>
                                                    {neg.proposed_payment_plan && (
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Calculator className="h-3 w-3 text-blue-400" />
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                                                                {neg.proposed_payment_plan.installment_count || neg.proposed_payment_plan.payment_items?.filter((i: any) => i.payment_type === 'Installment').length || 0} Taksit Önerisi
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <Badge className={`text-[10px] font-black px-2 py-0.5 rounded-lg border-none uppercase tracking-widest ${neg.status === 'Approved' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' :
                                                        neg.status === 'Rejected' ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-amber-400 text-white shadow-lg shadow-amber-100'
                                                        }`}>
                                                        {neg.status === 'Approved' ? tMsg('statusApproved', { defaultValue: 'Onaylandı' }) :
                                                            neg.status === 'Rejected' ? tMsg('statusRejected', { defaultValue: 'Reddedildi' }) : tMsg('statusPending', { defaultValue: 'Beklemede' })}
                                                    </Badge>
                                                    <div className="flex flex-col items-end gap-1">
                                                        {neg.proposed_valid_until && (
                                                            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(neg.proposed_valid_until).toLocaleDateString(tMsg('locale', { defaultValue: 'tr-TR' }))}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                            {new Date(neg.created_at).toLocaleString(tMsg('locale', { defaultValue: 'tr-TR' }))}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {neg.notes && (
                                                <div className="relative p-4 bg-slate-50/50 rounded-xl border border-slate-100 italic text-slate-600 text-sm font-medium mt-2 group-hover:bg-white transition-colors">
                                                    <p className="relative z-10">"{neg.notes}"</p>
                                                    <MessageSquare className="absolute -bottom-2 -right-2 h-12 w-12 text-slate-100 opacity-20 -rotate-12" />
                                                </div>
                                            )}
                                            {neg.status === 'Pending' && (
                                                <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-100">
                                                    <div className="flex items-center gap-4 justify-between bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('depositOptional')}</Label>
                                                        <div className="relative w-40">
                                                            <Input
                                                                type="number"
                                                                className="h-10 pr-12 text-sm text-right bg-white border-slate-200 rounded-lg font-black"
                                                                value={approvalDeposit}
                                                                onChange={(e) => setApprovalDeposit(e.target.value)}
                                                            />
                                                            <span className="absolute right-3 top-2.5 text-[10px] font-black text-slate-300">TRY</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                                        onClick={() => setNegToApprove(neg)}
                                                        disabled={loading}
                                                    >
                                                        {Number(approvalDeposit) > 0 ? t('approveWithDeposit') : t('approveContract')}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!negToApprove} onOpenChange={(open) => !open && setNegToApprove(null)}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                {t.has('approveConfirmTitle') ? t('approveConfirmTitle') : 'Teklifi Onayla'}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                {t.has('approveConfirm') ? tMsg('approveConfirm') : 'Bu teklifi onaylayarak sözleşme aşamasına geçmek istediğinize emin misiniz?'}
                                {Number(approvalDeposit) > 0 && (
                                    <div className="mt-3 p-3 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100">
                                        {formatCurrency(Number(approvalDeposit), 'TRY')} {t.has('depositAmountInfo') ? t('depositAmountInfo') : 'kapora girişi yapılacaktır.'}
                                    </div>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            {t.has('cancel') ? t('cancel') : 'Vazgeç'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleApproveConfirm}
                            className="w-full sm:w-1/2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-white font-bold active:scale-95 transition-all"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>{t.has('approving') ? t('approving') : 'Onaylanıyor...'}</span>
                                </div>
                            ) : (
                                t.has('approveConfirmAction') ? t('approveConfirmAction') : 'Onayla'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)
