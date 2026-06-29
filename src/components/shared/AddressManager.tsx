'use client'

import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import {
    MapPin, Plus, Pencil, Trash2, Loader2, Star
} from 'lucide-react'
import { createAddress, updateAddress, deleteAddress } from './address-actions'

interface Address {
    id: string
    address_type: string
    is_primary: boolean
    label: string | null
    address_line1: string
    address_line2: string | null
    district: string | null
    city: string
    state: string | null
    postal_code: string | null
    country: string | null
}

interface AddressManagerProps {
    addresses: Address[]
    ownerId: string
    ownerType: 'customer' | 'company'
}

const ADDRESS_TYPES: Record<string, string> = {
    home: 'Ev',
    work: 'İş',
    billing: 'Fatura',
    shipping: 'Teslimat',
    other: 'Diğer',
}

const emptyForm = {
    address_type: 'home',
    is_primary: false,
    label: '',
    address_line1: '',
    address_line2: '',
    district: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Türkiye',
}

export default function AddressManager({ addresses, ownerId, ownerType }: AddressManagerProps) {
    const [localAddresses, setLocalAddresses] = useState<Address[]>(addresses || [])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editAddress, setEditAddress] = useState<Address | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [isPending, startTransition] = useTransition()

    const refreshAddresses = async () => {
        const { getAddresses: fetchAddresses } = await import('./address-actions')
        const data = await fetchAddresses(ownerId, ownerType)
        setLocalAddresses(data as any)
    }

    useEffect(() => {
        if (addresses) {
            const localIds = localAddresses.map(a => a.id).sort().join(',')
            const propIds = addresses.map(a => a.id).sort().join(',')
            if (localIds !== propIds) {
                setLocalAddresses(addresses)
            }
        }
    }, [addresses])

    useEffect(() => {
        if (ownerId) {
            refreshAddresses()
        }
    }, [ownerId, ownerType])

    const openNew = () => {
        setForm({ ...emptyForm, is_primary: localAddresses.length === 0 })
        setEditAddress(null)
        setDialogOpen(true)
    }

    const openEdit = (addr: Address) => {
        setForm({
            address_type: addr.address_type,
            is_primary: addr.is_primary,
            label: addr.label || '',
            address_line1: addr.address_line1,
            address_line2: addr.address_line2 || '',
            district: addr.district || '',
            city: addr.city,
            state: addr.state || '',
            postal_code: addr.postal_code || '',
            country: addr.country || 'Türkiye',
        })
        setEditAddress(addr)
        setDialogOpen(true)
    }

    const handleSave = () => {
        if (!form.address_line1.trim() || !form.city.trim()) return
        startTransition(async () => {
            if (editAddress) {
                await updateAddress(editAddress.id, {
                    address_type: form.address_type,
                    is_primary: form.is_primary,
                    label: form.label || undefined,
                    address_line1: form.address_line1,
                    address_line2: form.address_line2 || null,
                    district: form.district || null,
                    city: form.city,
                    state: form.state || null,
                    postal_code: form.postal_code || null,
                    country: form.country,
                })
            } else {
                await createAddress({
                    ...(ownerType === 'customer' ? { customer_id: ownerId } : { company_id: ownerId }),
                    address_type: form.address_type,
                    is_primary: form.is_primary,
                    label: form.label || undefined,
                    address_line1: form.address_line1,
                    address_line2: form.address_line2 || undefined,
                    district: form.district || undefined,
                    city: form.city,
                    state: form.state || undefined,
                    postal_code: form.postal_code || undefined,
                    country: form.country || undefined,
                })
            }
            await refreshAddresses()
            setDialogOpen(false)
        })
    }

    const handleDelete = (addr: Address) => {
        if (!confirm('Bu adresi silmek istediğinize emin misiniz?')) return
        startTransition(async () => {
            await deleteAddress(addr.id)
            await refreshAddresses()
        })
    }

    const f = (key: keyof typeof form) => ({
        value: form[key] as string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }))
    })

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    Adresler
                </h3>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={openNew}>
                    <Plus className="h-3 w-3" /> Adres Ekle
                </Button>
            </div>

            {localAddresses.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">Henüz adres eklenmemiş</p>
            ) : (
                <div className="space-y-2">
                    {localAddresses.map(addr => (
                        <div key={addr.id} className="flex items-start justify-between p-3 border rounded-lg bg-white hover:bg-muted/20 transition-colors">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] py-0">
                                        {ADDRESS_TYPES[addr.address_type] || addr.address_type}
                                    </Badge>
                                    {addr.is_primary && (
                                        <Badge className="text-[10px] py-0 bg-amber-100 text-amber-700 border-amber-200">
                                            <Star className="h-2.5 w-2.5 mr-0.5" /> Birincil
                                        </Badge>
                                    )}
                                    {addr.label && (
                                        <span className="text-xs text-muted-foreground">{addr.label}</span>
                                    )}
                                </div>
                                <p className="text-sm">{addr.address_line1}</p>
                                {addr.address_line2 && <p className="text-xs text-muted-foreground">{addr.address_line2}</p>}
                                <p className="text-xs text-muted-foreground">
                                    {[addr.district, addr.city, addr.postal_code].filter(Boolean).join(', ')}
                                    {addr.country && addr.country !== 'Türkiye' && ` — ${addr.country}`}
                                </p>
                            </div>
                            <div className="flex gap-1 ml-2 flex-shrink-0">
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(addr)}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDelete(addr)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Address Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editAddress ? 'Adres Düzenle' : 'Yeni Adres'}</DialogTitle>
                        <DialogDescription>Adres bilgilerini girin.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Adres Tipi</Label>
                                <Select value={form.address_type} onValueChange={v => setForm(f => ({ ...f, address_type: v }))}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ADDRESS_TYPES).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Etiket (Opsiyonel)</Label>
                                <Input className="h-9" placeholder="Merkez Ofis" {...f('label')} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">Adres Satırı 1 *</Label>
                            <Input className="h-9" placeholder="Mahalle, Sokak, No" {...f('address_line1')} />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Adres Satırı 2</Label>
                            <Input className="h-9" placeholder="Apartman, Kat, Daire" {...f('address_line2')} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">İlçe</Label>
                                <Input className="h-9" {...f('district')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">İl *</Label>
                                <Input className="h-9" {...f('city')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Posta Kodu</Label>
                                <Input className="h-9" {...f('postal_code')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Ülke</Label>
                                <Input className="h-9" {...f('country')} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <Checkbox
                                id="primaryAddr"
                                checked={form.is_primary}
                                onCheckedChange={(v) => setForm(f => ({ ...f, is_primary: !!v }))}
                            />
                            <Label htmlFor="primaryAddr" className="text-xs cursor-pointer">
                                Birincil adres olarak ayarla
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Vazgeç</Button>
                        <Button size="sm" onClick={handleSave} disabled={isPending || !form.address_line1.trim() || !form.city.trim()}>
                            {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Kaydediliyor...</> : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
