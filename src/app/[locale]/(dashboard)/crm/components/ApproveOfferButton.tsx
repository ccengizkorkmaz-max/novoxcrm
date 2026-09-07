'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, FileSignature } from 'lucide-react'
import { approveOfferDirectly } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ApproveOfferButtonProps {
    offerId: string
    customerName: string
    unitInfo: string
    customerId?: string
    unitId?: string
}

export default function ApproveOfferButton({ 
    offerId, 
    customerName, 
    unitInfo,
    customerId,
    unitId
}: ApproveOfferButtonProps) {
    const router = useRouter()
    const t = useTranslations('Offers.dialog')
    const tActions = useTranslations('Offers.actions')
    const tMsg = useTranslations('Offers.messages')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleApprove = async () => {
        setLoading(true)
        try {
            const result = await approveOfferDirectly(offerId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(tMsg('offerApproved'))
                setOpen(false)
                router.refresh()
            }
        } catch (error: any) {
            toast.error(error.message || tMsg('error'))
        } finally {
            setLoading(false)
        }
    }

    const handleApproveAndStartContract = async () => {
        setLoading(true)
        try {
            const result = await approveOfferDirectly(offerId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(tMsg('offerApproved'))
                setOpen(false)
                router.refresh()
                if (customerId && unitId) {
                    router.push(`/contracts/new?offerId=${offerId}&unitId=${unitId}&customerId=${customerId}`)
                }
            }
        } catch (error: any) {
            toast.error(error.message || tMsg('error'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    title={tActions('approve')} 
                    className="gap-1.5 h-9 px-3 rounded-xl bg-emerald-50 border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-100 hover:text-emerald-800 transition-all select-none text-[11px]"
                >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{tActions('approve')}</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        {t('approveTitle')}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 pt-2 text-sm">
                            <div className="rounded-lg border bg-slate-50 p-3 space-y-1.5 text-left">
                                <p className="text-slate-700"><strong>{t('customer')}:</strong> {customerName}</p>
                                <p className="text-slate-700"><strong>{t('customer') === 'Müşteri' ? 'Ünite' : 'Unit'}:</strong> {unitInfo}</p>
                            </div>
                            <p className="text-amber-800 text-xs bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-left">
                                {t('approveWarning')}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
                    <AlertDialogCancel disabled={loading}>{tActions('cancel')}</AlertDialogCancel>
                    {customerId && unitId && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleApproveAndStartContract}
                            disabled={loading}
                            className="gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-semibold"
                        >
                            <FileSignature className="h-4 w-4" />
                            <span>Onayla & Sözleşmeye Git</span>
                        </Button>
                    )}
                    <AlertDialogAction
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                        {loading ? tActions('approving') : tActions('yesApprove')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
