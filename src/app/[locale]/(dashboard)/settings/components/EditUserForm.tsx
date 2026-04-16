'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from "@/components/ui/dialog"
import { updateUser } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Checkbox } from '@/components/ui/checkbox'

interface EditUserFormProps {
    user: {
        id: string
        full_name: string | null
        role: string
        is_external?: boolean
    }
    onClose: () => void
}

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
    const t = useTranslations('Settings')
    const [isPending, setIsPending] = useState(false)
    const [isExternal, setIsExternal] = useState(user.is_external || false)

    return (
        <form action={async (formData) => {
            setIsPending(true)
            const res = await updateUser(user.id, formData)
            setIsPending(false)

            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(t('users.forms.successUpdate'))
                onClose()
            }
        }}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-name">{t('users.forms.name')}</Label>
                    <Input
                        id="edit-name"
                        name="name"
                        defaultValue={user.full_name || ''}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-role">{t('users.forms.role')}</Label>
                    <select
                        id="edit-role"
                        name="role"
                        defaultValue={user.role}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="user">{t('users.roles.userSales')}</option>
                        <option value="manager">{t('users.roles.manager')}</option>
                        <option value="admin">{t('users.roles.admin')}</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-password">{t('users.forms.newPassword')}</Label>
                    <Input
                        id="edit-password"
                        name="password"
                        type="text"
                        placeholder={t('users.forms.passwordPlaceholder')}
                        minLength={6}
                    />
                </div>

                {/* Dış Kaynak Toggle */}
                <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
                    <Checkbox
                        id="edit-is-external"
                        name="is_external"
                        checked={isExternal}
                        onCheckedChange={(checked) => setIsExternal(checked === true)}
                    />
                    <div className="space-y-0.5 flex-1">
                        <Label htmlFor="edit-is-external" className="text-sm font-medium cursor-pointer">
                            Dış Kaynak
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            İşaretlenirse iç satış ekibine dahil olmaz. Otomatik atamalar, filtreler ve listboxlarda görünmez.
                        </p>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('users.forms.updating') : t('users.forms.update')}
                </Button>
            </DialogFooter>
        </form>
    )
}
