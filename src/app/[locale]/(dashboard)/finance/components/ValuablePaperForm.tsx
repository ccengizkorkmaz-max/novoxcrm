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
    const [projects, setProjects] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [formData, setFormData] = useState({
        customer_id: '',
        paper_type: 'Check' as 'Check' | 'PromissoryNote',
        direction: 'Alınan' as 'Alınan' | 'Verilen',
        amount: 0,
        currency: 'TRY',
        due_date: '',
        issue_number: '',
        issuer: '',
        bank_name: '',
        description: '',
        project_id: '',
        unit_id: ''
    })

    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: custData } = await supabase.from('customers').select('id, full_name').order('full_name')
            if (custData) setCustomers(custData)

            const { data: projData } = await supabase.from('projects').select('id, name').order('name')
            if (projData) setProjects(projData)
        }
        fetchData()
    }, [supabase])

    useEffect(() => {
        const fetchUnits = async () => {
            if (!formData.project_id) {
                setUnits([])
                return
            }
            const { data } = await supabase
                .from('units')
                .select('id, unit_number, block')
                .eq('project_id', formData.project_id)
                .order('unit_number')
            if (data) setUnits(data)
        }
        fetchUnits()
    }, [formData.project_id, supabase])

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
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[85vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Evrak Türü & Yönü</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Select
                            value={formData.paper_type}
                            onValueChange={(val) => setFormData({ ...formData, paper_type: val as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Tür" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Check">Çek</SelectItem>
                                <SelectItem value="PromissoryNote">Senet</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={formData.direction}
                            onValueChange={(val) => setFormData({ ...formData, direction: val as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Yön" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Alınan">Alınan</SelectItem>
                                <SelectItem value="Verilen">Verilen</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="issue_number">Evrak / Seri No</Label>
                    <Input
                        id="issue_number"
                        placeholder="123456"
                        value={formData.issue_number}
                        onChange={(e) => setFormData({ ...formData, issue_number: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="customer">Bağlı Cari (Müşteri/Firma)</Label>
                    <Select
                        value={formData.customer_id}
                        onValueChange={(val) => setFormData({ ...formData, customer_id: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Cari seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {customers.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="issuer">Keşideci / Borçlu</Label>
                    <Input
                        id="issuer"
                        placeholder="Evrakta yazan asıl borçlu"
                        value={formData.issuer}
                        onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    />
                </div>
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

            <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="bank_name">Banka / Şube</Label>
                    <Input
                        id="bank_name"
                        placeholder="Garanti - Beşiktaş"
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="project">İlgili Proje</Label>
                    <Select
                        value={formData.project_id}
                        onValueChange={(val) => setFormData({ ...formData, project_id: val, unit_id: '' })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Proje Seç" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="unit">İlgili Ünite</Label>
                    <Select
                        value={formData.unit_id}
                        onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
                        disabled={!formData.project_id}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Ünite Seç" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                            {units.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.block} - {u.unit_number}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                    id="description"
                    placeholder="Ek notlar..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kıymetli Evrak Girişi Yap'}
            </Button>
        </form>
    )
}
