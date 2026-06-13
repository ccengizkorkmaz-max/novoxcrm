'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogFooter } from "@/components/ui/dialog"
import { addUser } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Phone } from 'lucide-react'

export default function AddUserForm({ onClose }: { onClose: () => void }) {
    const t = useTranslations('Settings')
    const [isPending, setIsPending] = useState(false)
    const [role, setRole] = useState('user')
    const [isExternal, setIsExternal] = useState(false)

    // Automatically set and lock isExternal if role is broker
    const isBroker = role === 'broker'
    const actualIsExternal = isBroker ? true : isExternal

    return (
        <form action={async (formData) => {
            setIsPending(true)
            // Inject the calculated external state just in case it's disabled
            if (actualIsExternal) formData.set('is_external', 'on')
            
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
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="user">{t('users.roles.user')}</option>
                        <option value="sales">Satış Temsilcisi (Sales)</option>
                        <option value="manager">{t('users.roles.manager')}</option>
                        <option value="crm_manager">CRM Manager</option>
                        <option value="admin">{t('users.roles.admin')}</option>
                        <option value="broker">Dış Broker</option>
                    </select>
                </div>

                {/* Telefon Numarası */}
                <div className="space-y-2">
                    <Label htmlFor="add-phone" className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        WhatsApp Telefon Numarası
                    </Label>
                    <Input
                        id="add-phone"
                        name="phone"
                        type="tel"
                        placeholder="905XXXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground">
                        Hot Lead Manager bildirimleri için gerekli. Sonradan da eklenebilir.
                    </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <input
                        type="checkbox"
                        id="add-is-external"
                        name="is_external"
                        checked={actualIsExternal}
                        onChange={(e) => !isBroker && setIsExternal(e.target.checked)}
                        disabled={isBroker}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                    />
                    <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="add-is-external" className={`text-sm font-medium leading-none cursor-pointer ${isBroker ? 'opacity-50' : ''}`}>
                            Dış Kaynak
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            İç ekibe dahil edilmez, atamalarda görünmez.
                        </p>
                    </div>
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
