'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from 'lucide-react'
import { processBrokerApplication } from '@/app/broker/actions'
import { toast } from 'sonner'
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

export default function BrokerApplicationActions({ applicationId }: { applicationId: string }) {
    const [loading, setLoading] = useState<'Approved' | 'Rejected' | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return (
        <div className="flex gap-2">
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
            <div className="h-8 w-20 bg-slate-100 animate-pulse rounded" />
        </div>
    )

    async function handleAction(status: 'Approved' | 'Rejected') {
        setLoading(status)
        const res = await processBrokerApplication(applicationId, status)

        if (res.error) {
            toast.error(res.error)
            setLoading(null)
        } else {
            toast.success(status === 'Approved' ? 'Başvuru onaylandı' : 'Başvuru reddedildi')
            // revalidatePath will handle refresh
        }
    }

    return (
        <div className="flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        disabled={!!loading}
                    >
                        {loading === 'Rejected' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                        Reddet
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Başvuruyu Reddet</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu başvuruyu reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAction('Rejected')} className="bg-red-600 hover:bg-red-700">
                            Evet, Reddet
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleAction('Approved')}
                disabled={!!loading}
            >
                {loading === 'Approved' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                Onayla
            </Button>
        </div>
    )
}
