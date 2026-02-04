'use client'

import { toast } from 'sonner'
import { updateProject } from '@/app/[locale]/(dashboard)/projects/[id]/actions'

interface ProjectEditFormProps {
    children: React.ReactNode
}

export function ProjectEditForm({ children }: ProjectEditFormProps) {
    async function clientAction(formData: FormData) {
        const result = await updateProject(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success("Kayıt güncellendi", {
                position: "bottom-right"
            })
        }
    }

    return (
        <form action={clientAction} id="project-edit-form">
            {children}
        </form>
    )
}
