'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from "@/components/ui/dialog"
import { updateUser } from '../actions'
import { toast } from 'sonner'

interface EditUserFormProps {
    user: {
        id: string
        full_name: string | null
        role: string
    }
    onClose: () => void
}

export default function EditUserForm({ user, onClose }: EditUserFormProps) {
    const [isPending, setIsPending] = useState(false)

    return (
        <form action={async (formData) => {
            setIsPending(true)
            const res = await updateUser(user.id, formData)
            setIsPending(false)

            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Kullanıcı başarıyla güncellendi.')
                onClose()
            }
        }}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-name">Ad Soyad</Label>
                    <Input
                        id="edit-name"
                        name="name"
                        defaultValue={user.full_name || ''}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-role">Rol</Label>
                    <select
                        id="edit-role"
                        name="role"
                        defaultValue={user.role}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="user">Kullanıcı (Satış)</option>
                        <option value="manager">Yönetici</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-password">Yeni Şifre (Opsiyonel)</Label>
                    <Input
                        id="edit-password"
                        name="password"
                        type="text"
                        placeholder="Değiştirmek için doldurun"
                        minLength={6}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                </Button>
            </DialogFooter>
        </form>
    )
}
