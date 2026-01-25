'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { signContract, payInstallment, cancelContract, transferContract } from '@/app/(dashboard)/contracts/actions'
import { toast } from 'sonner'
import { FileCheck, Loader2, XCircle, ArrowRightLeft } from 'lucide-react'
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

export function ContractStatusActions({ contractId, status }: { contractId: string, status: string }) {
    const [loading, setLoading] = useState(false)

    const handleSign = async () => {
        setLoading(true)
        try {
            const res = await signContract(contractId)
            if (res.error) throw new Error(res.error)
            toast.success('Sözleşme imzalandı olarak işaretlendi')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (status !== 'Draft') return null

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={loading} className="gap-2 bg-green-600 hover:bg-green-700">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                    İmzalandı Olarak İşaretle
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sözleşmeyi imzalandı olarak işaretlemek istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem sonrasında:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Sözleşme durumu "İmzalandı" olarak güncellenecek</li>
                            <li>İlgili ünite "Satıldı" olarak işaretlenecek ve kilitlenecek</li>
                            <li>Tüm satış süreci kayıtları tamamlanacak</li>
                            <li>Aktif teklifler kapatılacak</li>
                        </ul>
                        <p className="mt-2 font-semibold text-destructive">Bu işlem geri alınamaz.</p>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSign} className="bg-green-600 hover:bg-green-700">
                        Onayla ve İmzala
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export function IndividualPaymentAction({ paymentId, contractId, status }: { paymentId: string, contractId: string, status: string }) {
    const [loading, setLoading] = useState(false)

    const handlePay = async () => {
        setLoading(true)
        try {
            const res = await payInstallment(paymentId, contractId)
            if (res.error) throw new Error(res.error)
            toast.success('Ödeme alındı')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (status === 'Paid') return null

    return (
        <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-green-600"
            onClick={handlePay}
            disabled={loading}
        >
            {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Ödeme Al
        </Button>
    )
}

export function ContractLegalActions({ contractId, status }: { contractId: string, status: string }) {
    const [loading, setLoading] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [transferNotes, setTransferNotes] = useState('')

    const handleCancel = async () => {
        setLoading(true)
        try {
            const res = await cancelContract(contractId, cancelReason)
            if (res.error) throw new Error(res.error)
            toast.success('Sözleşme iptal edildi ve ünite serbest bırakıldı')
            setCancelDialogOpen(false)
            setCancelReason('')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleTransfer = async () => {
        setLoading(true)
        try {
            const res = await transferContract(contractId, transferNotes)
            if (res.error) throw new Error(res.error)
            toast.success('Sözleşme devir işlemi başarıyla kaydedildi')
            setTransferDialogOpen(false)
            setTransferNotes('')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    if (['Cancelled', 'Transferred', 'Completed'].includes(status)) return null

    return (
        <div className="space-y-4">
            {/* Cancel Contract Dialog */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={loading}
                        variant="outline"
                        className="w-full justify-start gap-2 h-11 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <XCircle className="h-4 w-4" />
                        Sözleşmeyi İptal Et
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sözleşmeyi iptal etmek istediğinize emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem sonrasında sözleşme iptal edilecek ve ilgili ünite serbest bırakılacaktır.
                            <p className="mt-2 font-semibold text-destructive">Bu işlem geri alınamaz.</p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">İptal Nedeni (Opsiyonel)</label>
                        <textarea
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="İptal nedenini buraya yazabilirsiniz..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            İptal Et
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Transfer Contract Dialog */}
            <AlertDialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <AlertDialogTrigger asChild>
                    <Button
                        disabled={loading}
                        variant="outline"
                        className="w-full justify-start gap-2 h-11 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        <ArrowRightLeft className="h-4 w-4" />
                        Sözleşme Devri
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sözleşme Devri</AlertDialogTitle>
                        <AlertDialogDescription>
                            Sözleşme devir bilgilerini giriniz. Bu işlem sözleşme durumunu "Devredildi" olarak güncelleyecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Devir Bilgileri <span className="text-red-500">*</span></label>
                        <textarea
                            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            placeholder="Kimden, kime devredildiği ve diğer detaylar..."
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                            required
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>İptal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTransfer}
                            className="bg-blue-600 hover:bg-blue-700"
                            disabled={loading || !transferNotes.trim()}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Devret
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
