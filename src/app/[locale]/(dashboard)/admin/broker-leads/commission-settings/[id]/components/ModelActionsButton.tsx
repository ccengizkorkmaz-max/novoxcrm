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
import { useTranslations } from 'next-intl'

export default function ModelActionsButton({ modelId, modelName }: { modelId: string, modelName: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const t = useTranslations('CommissionSettings')

    async function handleArchive() {
        setLoading(true)
        const result = await archiveCommissionModel(modelId)
        if (result.success) {
            toast.success(t('actions.archiveSuccess'))
            router.push('/admin/broker-leads/commission-settings')
        } else {
            toast.error(result.error || t('actions.archiveError'))
            setLoading(false)
        }
    }

    async function handleDelete() {
        setLoading(true)
        const result = await deleteCommissionModel(modelId)
        if (result.success) {
            toast.success(t('actions.deleteSuccess'))
            router.push('/admin/broker-leads/commission-settings')
        } else {
            toast.error(result.error) // Server returns localized error or tech error
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-orange-600 border-orange-200 hover:bg-orange-50 gap-2">
                        <Archive className="h-4 w-4" />
                        {t('actions.archiveButton')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('actions.archiveTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('actions.archiveDesc', { name: modelName })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-orange-600 hover:bg-orange-700">{t('actions.archive')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {t('actions.delete')}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('actions.deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription className="text-red-600 font-medium space-y-2">
                            <p>{t('actions.deleteDesc')}</p>
                            <p className="text-sm text-muted-foreground font-normal">
                                {t('actions.deleteWarning')}
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('actions.delete')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
