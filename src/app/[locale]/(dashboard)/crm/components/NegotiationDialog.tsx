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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, CheckCircle2, XCircle, History, User, Calendar } from 'lucide-react'
import { createNegotiation, approveNegotiation, getNegotiationHistory } from '../actions'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'


interface NegotiationDialogProps {
    offerId: string
    currentPrice: number
    currentCurrency: string
    customerName: string
    unitInfo: string
}

import { useTranslations } from 'next-intl'

export default function NegotiationDialog({ offerId, currentPrice, currentCurrency, customerName, unitInfo }: NegotiationDialogProps) {
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
    const [approvalDeposit, setApprovalDeposit] = useState<number>(0)
    const router = useRouter()


    useEffect(() => {
        if (isOpen) {
            loadHistory()
            // Set default validity to 7 days from now
            const d = new Date()
            d.setDate(d.getDate() + 7)
            setValidityDate(d.toISOString().split('T')[0])
        }
    }, [offerId, isOpen])

    const loadHistory = async () => {
        setLoading(true)
        setError(null)
        try {
            console.log("Loading history for offerId:", offerId)
            const data = await getNegotiationHistory(offerId)
            console.log("History data received:", data)
            if (data) {
                setHistory(data)
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
        const res = await createNegotiation({
            offer_id: offerId,
            proposed_price: newPrice,
            proposed_currency: currentCurrency,
            proposed_valid_until: validityDate,
            proposed_payment_plan: null, // For now, focus on price and notes
            source,
            notes
        })

        setLoading(false)


        if (res.success) {
            toast.success(tMsg('proposalSaved'))
            setNotes('')
            loadHistory()
        } else {
            toast.error(res.error || tMsg('error'))
        }
    }

    const handleApprove = async (negId: string) => {
        if (!confirm(tMsg('approveConfirm'))) return

        setLoading(true)
        const res = await approveNegotiation(negId, approvalDeposit)
        setLoading(false)

        if (res.success) {
            toast.success(tMsg('offerApproved'))
            setIsOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || tMsg('approveError'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> {tActions('negotiate')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{customerName} - {unitInfo} {t('negotiationTitle')}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* New Proposal Form */}
                    <div className="space-y-4 border p-4 rounded-md bg-muted/20">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> {t('enterProposal')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('proposedPrice')} ({currentCurrency})</Label>
                                <Input
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('validUntil')}</Label>
                                <Input
                                    type="date"
                                    value={validityDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setValidityDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('source')}</Label>

                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value as any)}
                                >
                                    <option value="Sales">{t('salesTeam')}</option>
                                    <option value="Customer">{t('customer')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>{t('notes')}</Label>
                            <Textarea
                                placeholder={t('notesPlaceholder')}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleSubmitProposal}
                            disabled={loading}
                        >
                            {t('saveProposal')}
                        </Button>
                    </div>

                    <div className="h-px bg-border w-full" />


                    {/* History */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <History className="h-4 w-4" /> {t('history')}
                        </h3>
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-md">
                                {error}
                            </div>
                        )}
                        {loading && history.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('loading')}</p>
                        ) : history.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('noHistory')}</p>
                        ) : (

                            <div className="space-y-3">
                                {history.map((neg) => (
                                    <div key={neg.id} className={`p-3 rounded-md border text-sm ${neg.status === 'Approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-card'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-base">
                                                    {formatCurrency(neg.proposed_price, neg.proposed_currency)}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {neg.source === 'Sales' ? `${t('salesTeam')}: ${neg.profiles?.full_name || 'Bilinmiyor'}` : t('customerProposal')}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${neg.status === 'Approved' ? 'bg-emerald-200 text-emerald-800' :
                                                    neg.status === 'Rejected' ? 'bg-red-200 text-red-800' : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                    {neg.status === 'Approved' ? tMsg('statusApproved', { defaultValue: 'Onaylandı' }) :
                                                        neg.status === 'Rejected' ? tMsg('statusRejected', { defaultValue: 'Reddedildi' }) : tMsg('statusPending', { defaultValue: 'Beklemede' })}
                                                </span>
                                                {neg.proposed_valid_until && (
                                                    <span className="text-[10px] font-medium text-orange-600 mt-1">
                                                        {t('validUntil')}: {new Date(neg.proposed_valid_until).toLocaleDateString(tMsg('locale', { defaultValue: 'tr-TR' }))}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(neg.created_at).toLocaleString(tMsg('locale', { defaultValue: 'tr-TR' }))}
                                                </span>

                                            </div>
                                        </div>
                                        {neg.notes && (
                                            <p className="text-muted-foreground italic mt-2 border-t pt-2">
                                                "{neg.notes}"
                                            </p>
                                        )}
                                        {neg.status === 'Pending' && (
                                            <div className="flex flex-col gap-3 mt-3 border-t pt-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tabular-nums">{t('depositOptional')}</Label>
                                                    <div className="relative w-32">
                                                        <Input
                                                            type="number"
                                                            size={1}
                                                            className="h-8 pr-10 text-xs text-right"
                                                            value={approvalDeposit}
                                                            onChange={(e) => setApprovalDeposit(Number(e.target.value))}
                                                        />
                                                        <span className="absolute right-2 top-2 text-[10px] font-bold text-muted-foreground">TRY</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                                        onClick={() => handleApprove(neg.id)}
                                                        disabled={loading}
                                                    >
                                                        {approvalDeposit > 0 ? t('approveWithDeposit') : t('approveContract')}
                                                    </Button>
                                                </div>
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
    )
}
