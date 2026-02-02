'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from "@/components/ui/dialog"
import { addUser } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

export default function AddUserForm({ onClose }: { onClose: () => void }) {
    const t = useTranslations('Settings')
    const [isPending, setIsPending] = useState(false)

    return (
        <form action={async (formData) => {
            setIsPending(true)
            const res = await addUser(formData)
            setIsPending(false)

            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success(t('users.forms.successCreate'))
                onClose()
            }
        }}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="add-name">{t('users.forms.name')}</Label>
                    <Input id="add-name" name="name" placeholder="Ahmet Yılmaz" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-email">{t('users.forms.email')}</Label>
                    <Input id="add-email" name="email" type="email" placeholder="ahmet@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-password">{t('users.forms.password')}</Label>
                    <Input id="add-password" name="password" type="password" placeholder="******" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-role">{t('users.forms.role')}</Label>
                    <select
                        id="add-role"
                        name="role"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="user">{t('users.roles.user')}</option>
                        <option value="manager">{t('users.roles.manager')}</option>
                        <option value="admin">{t('users.roles.admin')}</option>
                    </select>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? t('users.forms.creating') : t('users.forms.create')}
                </Button>
            </DialogFooter>
        </form>
    )
}
