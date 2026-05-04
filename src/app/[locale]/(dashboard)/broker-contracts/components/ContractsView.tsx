'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    FileText, Plus, Search, Shield, Home, Key, Banknote,
    Calendar, User, Building2, CheckCircle, Clock, AlertTriangle
} from 'lucide-react'

const CONTRACT_TYPES = [
    { value: 'all', label: 'Tümü', icon: FileText, color: 'text-slate-600' },
    { value: 'authorization', label: 'Yetkilendirme', icon: Shield, color: 'text-blue-600', desc: 'Ev sahibi ile acente arası' },
    { value: 'sale', label: 'Satış', icon: Home, color: 'text-emerald-600', desc: 'Alıcı ile ev sahibi arası' },
    { value: 'rental', label: 'Kiralama', icon: Key, color: 'text-violet-600', desc: 'Kiracı ile ev sahibi arası' },
    { value: 'commission', label: 'Komisyon', icon: Banknote, color: 'text-amber-600', desc: 'Acente komisyon anlaşması' },
]

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
    draft: { label: 'Taslak', color: 'bg-slate-100 text-slate-600', icon: FileText },
    pending: { label: 'Onay Bekliyor', color: 'bg-amber-100 text-amber-600', icon: Clock },
    active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-600', icon: CheckCircle },
    expired: { label: 'Süresi Dolmuş', color: 'bg-red-100 text-red-600', icon: AlertTriangle },
    cancelled: { label: 'İptal', color: 'bg-slate-100 text-slate-400', icon: AlertTriangle },
}

interface Props {
    contracts: any[]
    customers: any[]
    portfolios: any[]
}

export function ContractsView({ contracts, customers, portfolios }: Props) {
    const router = useRouter()
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [saving, setSaving] = useState(false)

    const filtered = contracts.filter(c => {
        const matchType = filter === 'all' || c.contract_type === filter
        const matchSearch = !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.customer?.full_name?.toLowerCase().includes(search.toLowerCase())
        return matchType && matchSearch
    })

    const getTypeInfo = (type: string) => CONTRACT_TYPES.find(t => t.value === type) || CONTRACT_TYPES[0]

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            const fd = new FormData(e.currentTarget)
            // For now, create via API
            const res = await fetch('/api/broker-contracts', {
                method: 'POST',
                body: fd
            })
            if (!res.ok) throw new Error('Sözleşme oluşturulamadı')
            toast.success('Sözleşme oluşturuldu!')
            setShowNew(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Hata oluştu')
        } finally { setSaving(false) }
    }

    return (
        <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-3">
                {CONTRACT_TYPES.slice(1).map(t => {
                    const Icon = t.icon
                    const count = contracts.filter(c => c.contract_type === t.value).length
                    const active = contracts.filter(c => c.contract_type === t.value && c.status === 'active').length
                    return (
                        <Card key={t.value} className="border shadow-sm cursor-pointer hover:shadow-md transition-all"
                            onClick={() => setFilter(t.value)}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center",
                                        t.value === 'authorization' ? 'bg-blue-50' :
                                        t.value === 'sale' ? 'bg-emerald-50' :
                                        t.value === 'rental' ? 'bg-violet-50' : 'bg-amber-50'
                                    )}>
                                        <Icon className={cn("h-4 w-4", t.color)} />
                                    </div>
                                </div>
                                <p className="text-2xl font-black">{count}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{t.label}</p>
                                {active > 0 && <p className="text-[10px] text-emerald-600 font-bold mt-0.5">{active} aktif</p>}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Filter + Search */}
            <div className="flex items-center gap-2">
                {CONTRACT_TYPES.map(t => (
                    <button key={t.value} onClick={() => setFilter(t.value)}
                        className={cn("px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                            filter === t.value ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}>
                        {t.label}
                    </button>
                ))}
                <div className="flex-1" />
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Sözleşme ara..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9 w-56 text-xs" />
                </div>
                <Button onClick={() => setShowNew(true)} className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Yeni Sözleşme
                </Button>
            </div>

            {/* Contracts List */}
            <div className="space-y-2">
                {filtered.length > 0 ? filtered.map(contract => {
                    const typeInfo = getTypeInfo(contract.contract_type)
                    const TypeIcon = typeInfo.icon
                    const status = STATUS_MAP[contract.status] || STATUS_MAP.draft
                    return (
                        <Card key={contract.id} className="border shadow-sm hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/broker-contracts/${contract.id}`)}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center",
                                        contract.contract_type === 'authorization' ? 'bg-blue-100' :
                                        contract.contract_type === 'sale' ? 'bg-emerald-100' :
                                        contract.contract_type === 'rental' ? 'bg-violet-100' : 'bg-amber-100'
                                    )}>
                                        <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h3 className="text-sm font-bold truncate">{contract.title}</h3>
                                            <Badge className={cn("text-[9px] border-none font-bold", status.color)}>{status.label}</Badge>
                                            <Badge variant="outline" className="text-[9px]">{typeInfo.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                            {contract.customer && <span className="flex items-center gap-1"><User className="h-3 w-3" /> {contract.customer.full_name}</span>}
                                            {contract.portfolio && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {contract.portfolio.title}</span>}
                                            {contract.start_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(contract.start_date).toLocaleDateString('tr-TR')}</span>}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {contract.amount && <p className="text-sm font-black text-emerald-600">₺{Number(contract.amount).toLocaleString('tr-TR')}</p>}
                                        {contract.commission_rate && <p className="text-[10px] text-amber-600 font-bold">%{contract.commission_rate} komisyon</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                }) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">Henüz sözleşme yok</p>
                        <p className="text-sm mt-1">Yetkilendirme, satış veya kiralama sözleşmesi oluşturun.</p>
                    </div>
                )}
            </div>

            {/* New Contract Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" /> Yeni Sözleşme
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Sözleşme Türü *</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {CONTRACT_TYPES.slice(1).map(t => {
                                        const Icon = t.icon
                                        return (
                                            <label key={t.value} className="flex items-center gap-2 p-3 rounded-xl border cursor-pointer hover:bg-slate-50 transition-all has-[:checked]:bg-blue-50 has-[:checked]:border-blue-300">
                                                <input type="radio" name="contract_type" value={t.value} defaultChecked={t.value === 'authorization'} className="accent-blue-600" />
                                                <Icon className={cn("h-4 w-4", t.color)} />
                                                <div>
                                                    <p className="text-xs font-bold">{t.label}</p>
                                                    <p className="text-[9px] text-muted-foreground">{t.desc}</p>
                                                </div>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Sözleşme Başlığı *</Label>
                                <Input name="title" required placeholder="Örn: Başiskele Portföy Yetkilendirme" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Kişi</Label>
                                    <select name="customer_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="">Seçiniz</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Portföy</Label>
                                    <select name="portfolio_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="">Seçiniz</option>
                                        {portfolios.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Başlangıç</Label>
                                    <Input name="start_date" type="date" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Bitiş</Label>
                                    <Input name="end_date" type="date" />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Tutar</Label>
                                    <Input name="amount" type="number" placeholder="3.500.000" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Komisyon %</Label>
                                    <Input name="commission_rate" type="number" step="0.1" placeholder="3" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Para Birimi</Label>
                                    <select name="currency" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        <option value="TRY">₺ TRY</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Notlar</Label>
                                <textarea name="notes" rows={2} className="w-full px-3 py-2 rounded-lg border text-sm resize-none" placeholder="Ek notlar..." />
                            </div>

                            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                                <p className="text-[10px] text-amber-700 font-medium">
                                    💡 Sözleşmeyi oluşturduktan sonra <strong>Unlayer Document Builder</strong> ile görsel tasarım yapabilirsiniz.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>İptal</Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                {saving ? 'Oluşturuluyor...' : 'Sözleşme Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
