'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from "@/components/ui/dialog"
import { addUser } from '../actions'
import { toast } from 'sonner'

export default function AddUserForm({ onClose }: { onClose: () => void }) {
    const [isPending, setIsPending] = useState(false)

    return (
        <form action={async (formData) => {
            setIsPending(true)
            const res = await addUser(formData)
            setIsPending(false)

            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Kullanıcı başarıyla oluşturuldu.')
                onClose()
            }
        }}>
            <div className="grid gap-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="add-name">Ad Soyad</Label>
                    <Input id="add-name" name="name" placeholder="Ahmet Yılmaz" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-email">E-posta</Label>
                    <Input id="add-email" name="email" type="email" placeholder="ahmet@example.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-password">Şifre</Label>
                    <Input id="add-password" name="password" type="password" placeholder="******" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="add-role">Rol</Label>
                    <select
                        id="add-role"
                        name="role"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="user">Kullanıcı</option>
                        <option value="manager">Yönetici</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur'}
                </Button>
            </DialogFooter>
        </form>
    )
}
