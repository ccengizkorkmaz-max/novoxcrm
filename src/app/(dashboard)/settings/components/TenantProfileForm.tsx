'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormImageUpload } from '@/components/ui/form-image-upload'
import { updateTenantProfile } from '../actions'
import { toast } from 'sonner'

interface TenantProfileFormProps {
    tenant: {
        id: string
        name: string
        logo_url: string | null
    }
}

export default function TenantProfileForm({ tenant }: TenantProfileFormProps) {
    const [isPending, setIsPending] = useState(false)

    return (
        <form
            action={async (formData) => {
                setIsPending(true)
                try {
                    const res = await updateTenantProfile(formData)
                    if (res?.error) {
                        toast.error(res.error)
                    } else {
                        toast.success('Firma bilgileri güncellendi.')
                    }
                } catch (e: any) {
                    toast.error('Beklenmedik bir hata oluştu: ' + e.message)
                } finally {
                    setIsPending(false)
                }
            }}
            className="space-y-6"
        >
            <div className="space-y-2">
                <Label htmlFor="name">Firma Adı</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={tenant.name}
                    placeholder="Örn: ABC Gayrimenkul"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label>Firma Logosu</Label>
                <FormImageUpload
                    name="logo_url"
                    defaultValue={tenant.logo_url || ''}
                />
                <p className="text-xs text-muted-foreground">
                    Logo, raporlarda ve teklif belgelerinde görünecektir.
                </p>
            </div>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                {isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
        </form>
    )
}
