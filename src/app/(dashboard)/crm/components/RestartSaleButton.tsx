'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from "@/components/ui/button"
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
import { restartSale } from '../actions'

interface RestartSaleButtonProps {
    saleId: string
}

export function RestartSaleButton({ saleId }: RestartSaleButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleRestart = async () => {
        setLoading(true)
        try {
            const res = await restartSale(saleId)
            if (res.success) {
                toast.success('Yeni süreç başlatıldı')
            } else {
                toast.error('Hata: ' + res.error)
            }
        } catch (error) {
            toast.error('Bir hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10"
                    disabled={loading}
                >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Yeniden Başlat
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Satış Sürecini Yeniden Başlat</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu müşteri için yeni bir satış süreci başlatmak üzeresiniz.
                        <br /><br />
                        Mevcut kayıp (Lost) kaydı korunacak ve aynı müşteri/ünite bilgileriyle yeni bir <b>Fırsat</b> (Prospect) kaydı oluşturulacaktır.
                        <br /><br />
                        Devam etmek istiyor musunuz?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRestart}>
                        Evet, Başlat
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
