import { useState, useEffect } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createFinancialAccount } from '../actions'
import { createClient } from '@/lib/supabase/client'

export default function AccountForm() {
    const [loading, setLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])
    const [formData, setFormData] = useState({
        account_name: '',
        account_code: '',
        owner_type: 'Diğer' as any,
        tax_no: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        project_id: '',
        unit_id: '',
        risk_limit: 0
    })

    const supabase = createClient()

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase.from('projects').select('id, name').order('name')
            if (data) setProjects(data)
        }
        fetchProjects()
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

    const projectOptions = projects.map(p => ({ value: p.id, label: p.name }))
    const unitOptions = units.map(u => ({ value: u.id, label: `${u.block} - ${u.unit_number}` }))

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
            window.location.reload()
        } else {
            toast.error(res.error || 'Bir hata oluştu.')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4 max-h-[80vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="owner_type">Cari Tipi</Label>
                    <Select
                        value={formData.owner_type}
                        onValueChange={(val) => setFormData({ ...formData, owner_type: val as any })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Tür seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Customer">Müşteri</SelectItem>
                            <SelectItem value="Tedarikçi">Tedarikçi</SelectItem>
                            <SelectItem value="Personel">Personel</SelectItem>
                            <SelectItem value="Broker">Broker</SelectItem>
                            <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="account_code">Hesap Kodu</Label>
                    <Input
                        id="account_code"
                        placeholder="320.01.001"
                        value={formData.account_code}
                        onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="account_name">Cari Uzun Ünvan / Ad Soyad</Label>
                <Input
                    id="account_name"
                    placeholder="XYZ Gayrimenkul Pazarlama Ltd. Şti."
                    value={formData.account_name}
                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="tax_no">TC / Vergi No</Label>
                    <Input
                        id="tax_no"
                        placeholder="1234567890"
                        value={formData.tax_no}
                        onChange={(e) => setFormData({ ...formData, tax_no: e.target.value })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="risk_limit">Risk Limiti</Label>
                    <Input
                        id="risk_limit"
                        type="number"
                        placeholder="0"
                        value={formData.risk_limit}
                        onChange={(e) => setFormData({ ...formData, risk_limit: Number(e.target.value) })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                        id="phone"
                        placeholder="05..."
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="info@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="address">Adres</Label>
                <Textarea
                    id="address"
                    placeholder="Fatura adresi..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="project">İlgili Proje</Label>
                    <Combobox
                        items={projectOptions}
                        value={formData.project_id}
                        onChange={(val) => setFormData({ ...formData, project_id: val, unit_id: '' })}
                        placeholder="Proje Seç"
                        searchPlaceholder="Proje ara..."
                        emptyText="Proje bulunamadı."
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="unit">İlgili Ünite</Label>
                    <Combobox
                        items={unitOptions}
                        value={formData.unit_id}
                        onChange={(val) => setFormData({ ...formData, unit_id: val })}
                        placeholder="Ünite Seç"
                        searchPlaceholder="Ünite ara..."
                        emptyText="Ünite bulunamadı."
                        disabled={!formData.project_id}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="notes">Notlar</Label>
                <Textarea
                    id="notes"
                    placeholder="Özel notlar..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                />
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Cari Kartı Oluştur'}
            </Button>
        </form>
    )
}
