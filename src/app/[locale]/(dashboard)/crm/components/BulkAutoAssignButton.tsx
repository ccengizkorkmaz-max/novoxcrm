'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { autoAssignAllSales } from '../actions'

export default function BulkAutoAssignButton() {
    const [isAssigning, setIsAssigning] = useState(false)

    const handleConfirm = () => {
        toast('Tüm açık satış kayıtları otomatik atanacak, onaylıyor musunuz?', {
            icon: <Sparkles className="w-4 h-4 text-blue-500" />,
            duration: 8000,
            action: {
                label: 'Evet, Ata',
                onClick: async () => {
                    if (isAssigning) return
                    setIsAssigning(true)
                    try {
                        toast.info('Toplu atama başlatıldı, lütfen bekleyin...')
                        const result = await autoAssignAllSales()
                        
                        if (result.error) {
                            toast.error(result.error)
                        } else {
                            toast.success(`${result.count} adet kayıt başarıyla atandı.`)
                        }
                    } catch (error: any) {
                        toast.error(`Beklenmeyen bir hata oluştu: ${error.message || error}`)
                        console.error("Bulk Assign Error:", error)
                    } finally {
                        setIsAssigning(false)
                    }
                }
            },
            cancel: {
                label: 'İptal',
                onClick: () => {
                    toast.dismiss()
                }
            }
        })
    }

    return (
        <Button onClick={handleConfirm} variant="outline" disabled={isAssigning} className="border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            {isAssigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Otomatik Toplu Atama
        </Button>
    )
}
