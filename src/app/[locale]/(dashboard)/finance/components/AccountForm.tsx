'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { createFinancialAccount } from '../actions'

export default function AccountForm() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        account_name: '',
        account_code: '',
        owner_type: 'Diğer' as any
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.account_name) {
            toast.error('Lütfen hesap adını giriniz.')
            return
        }

        setLoading(true)
        const res = await createFinancialAccount(formData)
        setLoading(false)

        if (res.success) {
            toast.success('Hesap başarıyla oluşturuldu.')
            // Reset form or close dialog (handled by parent usually)
            window.location.reload() // Simple way to refresh for now
        } else {
            toast.error(res.error || 'Bir hata oluştu.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label htmlFor="account_name">Hesap Adı</Label>
                <Input
                    id="account_name"
                    placeholder="Örn: ABC Tedarik A.Ş."
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="account_code">Hesap Kodu (Opsiyonel)</Label>
                <Input
                    id="account_code"
                    placeholder="Örn: 320.01.001"
                    value={formData.account_code}
                    onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="owner_type">Hesap Türü</Label>
                <Select
                    value={formData.owner_type}
                    onValueChange={(val) => setFormData({ ...formData, owner_type: val as any })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Tür seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Tedarikçi">Tedarikçi</SelectItem>
                        <SelectItem value="Employee">Personel</SelectItem>
                        <SelectItem value="Broker">Broker</SelectItem>
                        <SelectItem value="Customer">Müşteri</SelectItem>
                        <SelectItem value="Diğer">Diğer</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Hesabı Oluştur'}
            </Button>
        </form>
    )
}
