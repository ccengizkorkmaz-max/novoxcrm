'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createValuablePaper } from '../actions'
import { createClient } from '@/lib/supabase/client'

export default function ValuablePaperForm() {
    const [loading, setLoading] = useState(false)
    const [customers, setCustomers] = useState<any[]>([])
    const [formData, setFormData] = useState({
        customer_id: '',
        paper_type: 'Check' as 'Check' | 'PromissoryNote',
        amount: 0,
        currency: 'TRY',
        due_date: '',
        issue_number: '',
        bank_name: '',
        description: ''
    })

    useEffect(() => {
        const fetchCustomers = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('customers').select('id, full_name').order('full_name')
            if (data) setCustomers(data)
        }
        fetchCustomers()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.customer_id || !formData.amount || !formData.due_date) {
            toast.error('Lütfen zorunlu alanları doldurunuz.')
            return
        }

        setLoading(true)
        const res = await createValuablePaper(formData)
        setLoading(false)

        if (res.success) {
            toast.success('Evrak başarıyla kaydedildi.')
            window.location.reload()
        } else {
            toast.error(res.error || 'Bir hata oluştu.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="paper_type">Evrak Türü</Label>
                    <Select
                        value={formData.paper_type}
                        onValueChange={(val) => setFormData({ ...formData, paper_type: val as any })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tür seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Check">Çek</SelectItem>
                            <SelectItem value="PromissoryNote">Senet</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="issue_number">Evrak No</Label>
                    <Input
                        id="issue_number"
                        placeholder="Örn: 123456"
                        value={formData.issue_number}
                        onChange={(e) => setFormData({ ...formData, issue_number: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="customer">Müşteri</Label>
                <Select
                    value={formData.customer_id}
                    onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Müşteri seçiniz" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                        {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="amount">Tutar</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="0"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        required
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="currency">Döviz</Label>
                    <Select
                        value={formData.currency}
                        onValueChange={(val) => setFormData({ ...formData, currency: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Döviz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="TRY">TRY</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="due_date">Vade Tarihi</Label>
                <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="bank_name">Banka Adı / Şube</Label>
                <Input
                    id="bank_name"
                    placeholder="Örn: Garanti BBVA - Beşiktaş"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                    id="description"
                    placeholder="Ek notlar..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Evrak Girişi Yap'}
            </Button>
        </form>
    )
}
