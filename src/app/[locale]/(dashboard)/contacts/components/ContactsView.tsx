'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createContact } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Users, Plus, Search, Home, UserCheck, ShoppingCart,
    Key, Phone, Mail, MapPin, Filter, Building2
} from 'lucide-react'

const CONTACT_TYPES = [
    { value: 'all', label: 'Tümü', icon: Users, color: 'text-slate-600', bg: 'bg-slate-100' },
    { value: 'seller', label: 'Ev Sahipleri', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'buyer', label: 'Alıcılar', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { value: 'tenant', label: 'Kiracılar', icon: Key, color: 'text-violet-600', bg: 'bg-violet-50' },
]

const SOURCE_OPTIONS = [
    { value: 'office', label: 'Ofis' },
    { value: 'referral', label: 'Referans' },
    { value: 'website', label: 'Web Sitesi' },
    { value: 'portal', label: 'İlan Portalı' },
    { value: 'social', label: 'Sosyal Medya' },
    { value: 'cold_call', label: 'Soğuk Arama' },
    { value: 'walk_in', label: 'Ofise Gelen' },
]

interface Props {
    contacts: any[]
}

export function ContactsView({ contacts }: Props) {
    const router = useRouter()
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [showNew, setShowNew] = useState(false)
    const [saving, setSaving] = useState(false)
    const [newType, setNewType] = useState('buyer')

    const filtered = contacts.filter(c => {
        const matchType = filter === 'all' || c.contact_type === filter ||
            (filter === 'seller' && (c.contact_type === 'seller' || c.contact_type === 'landlord'))
        const matchSearch = !search || 
            c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search) ||
            c.email?.toLowerCase().includes(search.toLowerCase())
        return matchType && matchSearch
    })

    const counts = {
        all: contacts.length,
        seller: contacts.filter(c => c.contact_type === 'seller' || c.contact_type === 'landlord').length,
        buyer: contacts.filter(c => c.contact_type === 'buyer').length,
        tenant: contacts.filter(c => c.contact_type === 'tenant').length,
    }

    async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        try {
            const fd = new FormData(e.currentTarget)
            await createContact(fd)
            toast.success('Kişi eklendi!')
            setShowNew(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally { setSaving(false) }
    }

    const getTypeBadge = (type: string) => {
        switch(type) {
            case 'seller': return <Badge className="text-[9px] bg-blue-100 text-blue-700 border-none">Ev Sahibi</Badge>
            case 'landlord': return <Badge className="text-[9px] bg-blue-100 text-blue-700 border-none">Ev Sahibi</Badge>
            case 'buyer': return <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-none">Alıcı</Badge>
            case 'tenant': return <Badge className="text-[9px] bg-violet-100 text-violet-700 border-none">Kiracı</Badge>
            default: return <Badge variant="outline" className="text-[9px]">{type}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Type Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {CONTACT_TYPES.map(t => {
                    const Icon = t.icon
                    return (
                        <button key={t.value} onClick={() => setFilter(t.value)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                filter === t.value 
                                    ? "bg-slate-900 text-white border-slate-900" 
                                    : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                            )}>
                            <Icon className="h-3.5 w-3.5" />
                            {t.label}
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full",
                                filter === t.value ? "bg-white/20" : "bg-slate-100"
                            )}>{counts[t.value as keyof typeof counts] || 0}</span>
                        </button>
                    )
                })}
                <div className="flex-1" />
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="İsim, telefon, e-posta..." value={search} onChange={e => setSearch(e.target.value)}
                        className="pl-9 h-9 w-64 text-xs" />
                </div>
                <Button onClick={() => setShowNew(true)} className="text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" /> Kişi Ekle
                </Button>
            </div>

            {/* Contacts List */}
            <div className="space-y-2">
                {filtered.length > 0 ? filtered.map(contact => (
                    <Card key={contact.id} className="border shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => router.push(`/customers/${contact.id}`)}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-sm font-black",
                                    contact.contact_type === 'seller' || contact.contact_type === 'landlord'
                                        ? "bg-blue-100 text-blue-600"
                                        : contact.contact_type === 'tenant'
                                        ? "bg-violet-100 text-violet-600"
                                        : "bg-emerald-100 text-emerald-600"
                                )}>
                                    {contact.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h3 className="text-sm font-bold truncate">{contact.full_name}</h3>
                                        {getTypeBadge(contact.contact_type || 'buyer')}
                                        {contact.source && <Badge variant="outline" className="text-[9px]">{contact.source}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                        {contact.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {contact.phone}</span>}
                                        {contact.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {contact.email}</span>}
                                        {(contact.city || contact.district) && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {[contact.district, contact.city].filter(Boolean).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right text-[10px] text-muted-foreground">
                                    {contact.budget_max && <p className="font-bold text-emerald-600">₺{Number(contact.budget_max).toLocaleString('tr-TR')}</p>}
                                    <p>{new Date(contact.created_at).toLocaleDateString('tr-TR')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">Henüz kişi kaydı yok</p>
                        <p className="text-sm mt-1">Ev sahipleri, alıcılar ve kiracılarınızı ekleyin.</p>
                    </div>
                )}
            </div>

            {/* New Contact Dialog */}
            <Dialog open={showNew} onOpenChange={setShowNew}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-600" /> Yeni Kişi Ekle
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            {/* Contact Type Selector */}
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Kişi Türü *</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'seller', label: '🏠 Ev Sahibi', desc: 'Portföy veren' },
                                        { value: 'buyer', label: '🛒 Alıcı', desc: 'Gayrimenkul arayan' },
                                        { value: 'tenant', label: '🔑 Kiracı', desc: 'Kiralık arayan' },
                                    ].map(t => (
                                        <label key={t.value}
                                            className={cn("p-3 rounded-xl border cursor-pointer transition-all text-center",
                                                newType === t.value
                                                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100"
                                                    : "bg-white hover:bg-slate-50 border-slate-200"
                                            )}>
                                            <input type="radio" name="contact_type" value={t.value}
                                                checked={newType === t.value} onChange={() => setNewType(t.value)} className="sr-only" />
                                            <p className="text-sm font-bold">{t.label}</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Ad Soyad *</Label>
                                    <Input name="full_name" required placeholder="Ad Soyad" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Telefon</Label>
                                    <Input name="phone" placeholder="+90 5XX XXX XX XX" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">E-posta</Label>
                                    <Input name="email" type="email" placeholder="email@ornek.com" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">Kaynak</Label>
                                    <select name="source" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                        {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">İl</Label>
                                    <Input name="city" placeholder="Kocaeli" />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-bold">İlçe</Label>
                                    <Input name="district" placeholder="Başiskele" />
                                </div>
                            </div>

                            {/* Buyer/Tenant specific fields */}
                            {(newType === 'buyer' || newType === 'tenant') && (
                                <>
                                    <div className="border-t pt-3">
                                        <p className="text-xs font-bold text-violet-600 mb-2">🔍 Arama Kriterleri</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold">Min Bütçe (₺)</Label>
                                            <Input name="budget_min" type="number" placeholder="1.000.000" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold">Max Bütçe (₺)</Label>
                                            <Input name="budget_max" type="number" placeholder="3.000.000" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold">Oda Sayısı</Label>
                                            <Input name="desired_rooms" placeholder="3+1" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold">Min m²</Label>
                                            <Input name="desired_area_min" type="number" placeholder="100" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-[10px] font-bold">Tercih Edilen Bölgeler</Label>
                                            <Input name="desired_districts" placeholder="Başiskele, İzmit" />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Notlar</Label>
                                <textarea name="notes" rows={2} placeholder="Ek notlar..."
                                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>İptal</Button>
                            <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                                {saving ? 'Kaydediliyor...' : 'Kişiyi Kaydet'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
