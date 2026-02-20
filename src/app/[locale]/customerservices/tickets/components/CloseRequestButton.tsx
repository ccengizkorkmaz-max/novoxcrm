'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { updateServiceRequestStatus } from '../actions'
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
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CloseRequestButton({ requestId }: { requestId: string }) {
    const router = useRouter()
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleCloseConfirm() {
        setIsPending(true)
        try {
            const res = await updateServiceRequestStatus(requestId, 'Resolved')
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success('Talep başarıyla çözüldü olarak işaretlendi.')
                router.refresh()
                setIsConfirmOpen(false)
            }
        } catch (error) {
            toast.error('İşlem sırasında bir hata oluştu.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(true)}
                disabled={isPending}
                className="h-10 px-6 rounded-xl text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all font-bold gap-2 active:scale-95 select-none"
            >
                <CheckCircle2 className="h-4 w-4" />
                {isPending ? 'Güncelleniyor...' : 'Talebi Çözüldü Olarak İşaretle'}
            </Button>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden sm:max-w-[400px]">
                    <div className="p-8 space-y-4 text-center">
                        <div className="h-16 w-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <AlertDialogHeader className="space-y-2">
                            <AlertDialogTitle className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
                                Talebi Kapat
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium leading-relaxed">
                                Talebi çözüldü olarak işaretlemek istediğinize emin misiniz? Bu işlem talebin durumunu güncelleyecektir.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-6 bg-slate-50 flex flex-col sm:flex-row gap-2 border-t border-slate-100">
                        <AlertDialogCancel className="w-full sm:w-1/2 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white active:scale-95 transition-all outline-none">
                            Vazgeç
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCloseConfirm}
                            className="w-full sm:w-1/2 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-white font-bold active:scale-95 transition-all"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <div className="flex items-center gap-2">
                                    <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                                    <span>Güncelleniyor...</span>
                                </div>
                            ) : (
                                'Evet, İşaretle'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
