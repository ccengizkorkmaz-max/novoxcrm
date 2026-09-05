'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
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
import { Button } from "@/components/ui/button"
import { deleteUnit } from '@/app/[locale]/(dashboard)/inventory/[id]/actions'

interface DeleteUnitButtonProps {
    unitId: string
    projectId: string
    disabled?: boolean
}

export function DeleteUnitButton({ unitId, projectId, disabled = false }: DeleteUnitButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleDelete() {
        setLoading(true)
        const result = await deleteUnit(unitId, projectId)

        if (result?.error) {
            toast.error(result.error)
            setLoading(false)
            return
        }

        toast.success("Ünite başarıyla silindi")
        router.push(`/projects/${projectId}?tab=units`)
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={loading || disabled}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {loading ? 'Siliniyor...' : 'Sil'}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Üniteyi silmek istediğinize emin misiniz?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem geri alınamaz. Bu üniteyi ve ilgili tüm verileri kalıcı olarak siler.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Evet, Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
