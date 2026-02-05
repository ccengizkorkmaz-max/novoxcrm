'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
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
import { toast } from 'sonner'

interface DeleteAllUnitsButtonProps {
    projectId: string
    onDelete: (projectId: string) => Promise<any>
    isAdmin?: boolean
}

export function DeleteAllUnitsButton({ projectId, onDelete, isAdmin = false }: DeleteAllUnitsButtonProps) {
    const [loading, setLoading] = useState(false)

    if (!isAdmin) return null

    async function handleConfirm() {
        setLoading(true)
        try {
            const result = await onDelete(projectId)
            if (result.success) {
                toast.success('Tüm üniteler başarıyla silindi.')
            } else {
                toast.error(result.error || 'Silme işlemi başarısız oldu.')
            }
        } catch (error) {
            console.error('Delete all error:', error)
            toast.error('Beklenmedik bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yüklemeyi Geri Al / Tümünü Sil
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Tüm Üniteleri Silmek İstediğinize Emin Misiniz?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Bu işlem, bu projeye ait **tüm üniteri** kalıcı olarak silecektir.
                        Sadece 'Satılık' durumundaki üniteler silinebilir. Satılan veya rezerve edilen ünite varsa işlem iptal edilecektir.
                        <br /><br />
                        Bu eylem geri alınamaz.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>İptal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleConfirm()
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={loading}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Evet, Tümünü Sil
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
