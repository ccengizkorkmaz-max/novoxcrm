'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Undo2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkRevertDqSalesToQualification } from '../../lead-qualification/actions'
import { useRouter } from 'next/navigation'

export default function BulkRevertDqButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleRevertConfirm = async () => {
        if (loading) return
        setLoading(true)
        const toastId = toast.loading('İşlem yapılıyor, lütfen bekleyin...')

        try {
            const res = await bulkRevertDqSalesToQualification()
            
            if (res.error) {
                toast.error('Hata: ' + res.error, { id: toastId })
            } else if (res.count && res.count > 0) {
                toast.success(`${res.count} adet DQ kayıt ön değerlendirmeye geri gönderildi.`, { id: toastId })
                router.refresh()
            } else {
                toast.info('Geri gönderilecek DQ kayıt bulunamadı.', { id: toastId })
            }
        } catch (error: any) {
            toast.error('Beklenmeyen bir hata oluştu: ' + (error.message || error), { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    const handleRevertClick = () => {
        toast('DQ olarak işaretlenen tüm satış kayıtları ön değerlendirmeye geri gönderilsin mi?', {
            action: {
                label: 'Evet, Gönder',
                onClick: handleRevertConfirm
            },
            cancel: {
                label: 'İptal',
                onClick: () => {}
            },
            duration: 10000
        })
    }

    return (
        <Button 
            onClick={handleRevertClick} 
            variant="outline" 
            disabled={loading} 
            size="icon"
            className="h-9 w-9 shrink-0 border-orange-200 text-orange-600 hover:text-orange-700 hover:bg-orange-50 transition-all shadow-sm"
            title={loading ? 'İşleniyor...' : 'DQ Kayıtları Ön Değerlendirmeye Geri Gönder'}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Undo2 className="h-4 w-4" />
            )}
        </Button>
    )
}
