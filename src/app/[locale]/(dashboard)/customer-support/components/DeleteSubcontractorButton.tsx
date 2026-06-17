'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteSubcontractor } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface DeleteSubcontractorButtonProps {
    id: string
}

export function DeleteSubcontractorButton({ id }: DeleteSubcontractorButtonProps) {
    const t = useTranslations('Subcontractors')
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Bu taşeronu silmek istediğinize emin misiniz?')) return

        setLoading(true)
        try {
            const res = await deleteSubcontractor(id)
            if (res.success) {
                toast.success(t('dialog.successDelete'))
            } else {
                toast.error(res.error || 'Silme işlemi başarısız.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
            onClick={handleDelete}
            disabled={loading}
            title={t('deleteBtn')}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    )
}
