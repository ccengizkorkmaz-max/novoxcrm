'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Archive, Loader2 } from 'lucide-react'
import { archiveCommissionModel, deleteCommissionModel } from '@/app/broker/actions'
import { useRouter } from 'next/navigation'
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

export default function ModelActionsButton({ modelId, modelName }: { modelId: string, modelName: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleArchive() {
        setLoading(true)
        const result = await archiveCommissionModel(modelId)
        if (result.success) {
            toast.success('Model başarıyla arşivlendi.')
            router.push('/admin/broker-leads/commission-settings')
        } else {
            toast.error(result.error || 'Arşivlenemedi.')
            setLoading(false)
        }
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteCommissionModel(modelId)
        if (result.success) {
            toast.success('Model kalıcı olarak silindi.')
            router.push('/admin/broker-leads/commission-settings')
        } else {
            toast.error(result.error) // "Kullanımda olabilir" mesajını gösterecek
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2">
                        <Archive className="h-4 w-4" />
                        Arşivle / Pasife Al
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Modeli Arşivle?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{modelName}" isimli model pasife alınacak ve "Süresi Bitenler" listesine taşınacaktır. Yeni satışlarda kullanılmayacak ancak geçmiş veriler korunacaktır.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-orange-600 hover:bg-orange-700">Arşivle</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Sil
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Kalıcı Olarak Sil?</AlertDialogTitle>
                        <AlertDialogDescription className="text-red-600 font-medium">
                            DİKKAT: Bu işlem geri alınamaz!
                            Eğer bu model geçmişte herhangi bir satışta kullanıldıysa silme işlemi reddedilecektir. Bu durumda "Arşivle" seçeneğini kullanmalısınız.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
