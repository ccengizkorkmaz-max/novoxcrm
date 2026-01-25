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

interface ApproveOfferButtonProps {
    offerId: string
    customerName: string
    unitInfo: string
}

export default function ApproveOfferButton({ offerId, customerName, unitInfo }: ApproveOfferButtonProps) {
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleApprove = async () => {
        setLoading(true)
        try {
            const result = await approveOfferDirectly(offerId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Teklif onaylandı!')
                setOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || 'Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Teklifi Onayla" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <CheckCircle2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Teklifi Onaylamak İstediğinize Emin Misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        <div className="space-y-2">
                            <p><strong>Müşteri:</strong> {customerName}</p>
                            <p><strong>Ünite:</strong> {unitInfo}</p>
                            <p className="mt-4 text-amber-600">
                                Bu işlem teklifi doğrudan "Kabul Edildi" durumuna getirecektir.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? 'Onaylanıyor...' : 'Evet, Onayla'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
