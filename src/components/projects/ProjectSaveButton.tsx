'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2, Save } from 'lucide-react'

export function ProjectSaveButton() {
    const { pending } = useFormStatus()

    return (
        <Button
            type="submit"
            form="project-edit-form"
            disabled={pending}
            className="gap-2 active:scale-95 transition-all duration-200"
        >
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kaydediliyor...
                </>
            ) : (
                <>
                    <Save className="h-4 w-4" />
                    Değişiklikleri Kaydet
                </>
            )}
        </Button>
    )
}
