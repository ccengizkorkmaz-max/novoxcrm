'use client'

import { useState } from 'react'
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
import { CheckCircle2 } from 'lucide-react'
import { approveOfferDirectly } from '../actions'
import { toast } from 'sonner'

import { useTranslations } from 'next-intl'

interface ApproveOfferButtonProps {
    offerId: string
    customerName: string
    unitInfo: string
}

export default function ApproveOfferButton({ offerId, customerName, unitInfo }: ApproveOfferButtonProps) {
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
                <Button variant="ghost" size="icon" title={tActions('approve')} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <CheckCircle2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('approveTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="space-y-2">
                            <p><strong>{t('customer')}:</strong> {customerName}</p>
                            <p><strong>{t('customer') === 'Müşteri' ? 'Ünite' : 'Unit'}:</strong> {unitInfo}</p>
                            <p className="mt-4 text-amber-600">
                                {t('approveWarning')}
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{tActions('cancel')}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? tActions('approving') : tActions('yesApprove')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
