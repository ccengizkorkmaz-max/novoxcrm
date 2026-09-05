'use client'

import { useState, useMemo } from 'react'
import {
    Building2, MapPin, Plus, Edit2, Trash2, CheckCircle2,
    XCircle, Phone, Navigation, Coffee, Hotel, ShieldCheck,
    Search, Filter, ExternalLink, Info, Store, Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
    SalesOfficeLocation,
    saveSalesOffice,
    deleteSalesOffice,
    toggleSalesOfficeActive
} from '../sales-offices-actions'

const LOCATION_TYPES: Record<string, { label: string; icon: any; color: string; badge: string }> = {
    office: { label: 'Satış Ofisi', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800' },
    hq: { label: 'Genel Merkez', icon: Store, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
    lounge: { label: 'VIP Lounge / Kafe', icon: Coffee, color: 'text-amber-600 bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-800' },
    restaurant: { label: 'Restoran / Buluşma Mekanı', icon: Coffee, color: 'text-orange-600 bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800' },
    hotel: { label: 'Otel / Toplantı Salonu', icon: Hotel, color: 'text-purple-600 bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-800' },
    site: { label: 'Şantiye / Tanıtım Çadırı', icon: MapPin, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
    other: { label: 'Diğer', icon: Navigation, color: 'text-slate-600 bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-800' }
}

interface SalesOfficesTabProps {
    initialOffices: SalesOfficeLocation[]
    projects: any[]
}

export function SalesOfficesTab({ initialOffices, projects }: SalesOfficesTabProps) {
    const [offices, setOffices] = useState<SalesOfficeLocation[]>(initialOffices || [])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingOffice, setEditingOffice] = useState<SalesOfficeLocation | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form Field States
    const [formName, setFormName] = useState('')
    const [formType, setFormType] = useState<SalesOfficeLocation['type']>('office')
    const [formProjectId, setFormProjectId] = useState<string>('')
    const [formAddress, setFormAddress] = useState('')
    const [formDistrict, setFormDistrict] = useState('')
    const [formCity, setFormCity] = useState('')
    const [formLat, setFormLat] = useState('')
    const [formLng, setFormLng] = useState('')
    const [formMapsUrl, setFormMapsUrl] = useState('')
    const [formPhone, setFormPhone] = useState('')
    const [formNotes, setFormNotes] = useState('')
    const [formIsActive, setFormIsActive] = useState(true)

    // Smart parser for Google Maps URL, share link, or pasted coordinates
    const handleMapsInput = (inputVal: string) => {
        setFormMapsUrl(inputVal)
        const trimmed = inputVal.trim()
        if (!trimmed) {
            setFormLat('')
            setFormLng('')
            return
        }

        // 1. Pure coordinates: "41.1068, 28.9892" or "41.1068 28.9892"
        const coordMatch = trimmed.match(/^([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)$/)
        if (coordMatch) {
            setFormLat(coordMatch[1])
            setFormLng(coordMatch[2])
            setFormMapsUrl(`https://maps.google.com/?q=${coordMatch[1]},${coordMatch[2]}`)
            return
        }

        // 2. Google Maps URL with @lat,lng
        const atCoordMatch = trimmed.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/)
        if (atCoordMatch) {
            setFormLat(atCoordMatch[1])
            setFormLng(atCoordMatch[2])
            return
        }

        // 3. Google Maps URL with ?q=lat,lng
        const queryCoordMatch = trimmed.match(/[?&](?:q|ll|query)=([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/)
        if (queryCoordMatch) {
            setFormLat(queryCoordMatch[1])
            setFormLng(queryCoordMatch[2])
            return
        }
    }

    const openCreateModal = () => {
        setEditingOffice(null)
        setFormName('')
        setFormType('office')
        setFormProjectId('')
        setFormAddress('')
        setFormDistrict('')
        setFormCity('')
        setFormLat('')
        setFormLng('')
        setFormMapsUrl('')
        setFormPhone('')
        setFormNotes('')
        setFormIsActive(true)
        setIsModalOpen(true)
    }

    const openEditModal = (office: SalesOfficeLocation) => {
        setEditingOffice(office)
        setFormName(office.name || '')
        setFormType(office.type || 'office')
        setFormProjectId(office.projectId || '')
        setFormAddress(office.address || '')
        setFormDistrict(office.district || '')
        setFormCity(office.city || '')
        setFormLat(office.latitude ? office.latitude.toString() : '')
        setFormLng(office.longitude ? office.longitude.toString() : '')
        setFormMapsUrl(office.mapsUrl || '')
        setFormPhone(office.phone || '')
        setFormNotes(office.notes || '')
        setFormIsActive(office.isActive ?? true)
        setIsModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formName.trim()) {
            toast.error('Lütfen lokasyon adını giriniz.')
            return
        }

        setIsSaving(true)
        const selectedProject = projects?.find(p => p.id === formProjectId)

        // Final effective mapsUrl
        let effectiveMapsUrl = formMapsUrl.trim()
        if (!effectiveMapsUrl) {
            if (formLat && formLng) {
                effectiveMapsUrl = `https://maps.google.com/?q=${formLat},${formLng}`
            } else {
                const searchQ = [formName, formAddress, formDistrict, formCity].filter(Boolean).join(' ')
                if (searchQ) {
                    effectiveMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQ)}`
                }
            }
        }

        const payload: Partial<SalesOfficeLocation> & { name: string } = {
            id: editingOffice?.id,
            name: formName.trim(),
            type: formType,
            projectId: formProjectId || null,
            projectName: selectedProject?.name || null,
            address: formAddress.trim(),
            district: formDistrict.trim(),
            city: formCity.trim(),
            latitude: formLat ? parseFloat(formLat) : null,
            longitude: formLng ? parseFloat(formLng) : null,
            mapsUrl: effectiveMapsUrl || undefined,
            phone: formPhone.trim(),
            notes: formNotes.trim(),
            isActive: formIsActive
        }

        const res = await saveSalesOffice(payload)
        setIsSaving(false)

        if (res.success && res.office) {
            toast.success(editingOffice ? 'Lokasyon güncellendi' : 'Yeni lokasyon oluşturuldu')
            if (editingOffice) {
                setOffices(prev => prev.map(o => o.id === editingOffice.id ? res.office! : o))
            } else {
                setOffices(prev => [res.office!, ...prev])
            }
            setIsModalOpen(false)
        } else {
            toast.error(res.error || 'Kaydedilirken bir hata oluştu')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`"${name}" lokasyonunu silmek istediğinize emin misiniz?`)) return
        const res = await deleteSalesOffice(id)
        if (res.success) {
            toast.success('Lokasyon silindi')
            setOffices(prev => prev.filter(o => o.id !== id))
        } else {
            toast.error(res.error || 'Silme işlemi başarısız')
        }
    }

    const handleToggleActive = async (id: string, current: boolean) => {
        const next = !current
        setOffices(prev => prev.map(o => o.id === id ? { ...o, isActive: next } : o))
        const res = await toggleSalesOfficeActive(id, next)
        if (!res.success) {
            setOffices(prev => prev.map(o => o.id === id ? { ...o, isActive: current } : o))
            toast.error(res.error || 'Durum değiştirilemedi')
        } else {
            toast.success(next ? 'Lokasyon aktifleştirildi' : 'Lokasyon pasife alındı')
        }
    }

    // Auto calculate Maps Preview URL in form
    const previewMapsUrl = useMemo(() => {
        if (formMapsUrl) return formMapsUrl
        if (formLat && formLng) return `https://maps.google.com/?q=${formLat},${formLng}`
        if (formName || formAddress) {
            const query = [formName, formAddress, formDistrict, formCity].filter(Boolean).join(' ')
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
        }
        return null
    }, [formMapsUrl, formLat, formLng, formName, formAddress, formDistrict, formCity])

    // Filtered offices
    const filteredOffices = useMemo(() => {
        return offices.filter(o => {
            const matchesQuery = (
                o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.projectName?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            const matchesType = selectedTypeFilter === 'all' || o.type === selectedTypeFilter
            return matchesQuery && matchesType
        })
    }, [offices, searchQuery, selectedTypeFilter])

    const activeCount = offices.filter(o => o.isActive).length

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-emerald-400" />
                        <h2 className="text-xl font-bold tracking-tight">Satış Ofisleri & Görüşme Noktaları</h2>
                    </div>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
                        Müşterilerinizle randevulaştığınız satış ofislerini, merkez ofisi, VIP lounge&apos;ları ve restoran gibi özel buluşma noktalarını tanımlayın. 
                        Bu lokasyonlar randevu oluşturma ekranlarında listelenir ve müşteriye WhatsApp ile harita linkiyle otomatik iletilir.
                    </p>
                </div>
                <Button onClick={openCreateModal} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 shrink-0 shadow-md">
                    <Plus className="h-4 w-4" /> Yeni Lokasyon Ekle
                </Button>
            </div>

            {/* Quick KPI Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Toplam Nokta</p>
                            <p className="text-2xl font-bold mt-0.5">{offices.length}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40">
                            <Building2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Aktif Lokasyonlar</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{activeCount}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">VIP Lounge / Restoran</p>
                            <p className="text-2xl font-bold text-amber-600 mt-0.5">
                                {offices.filter(o => ['lounge', 'restaurant', 'hotel'].includes(o.type)).length}
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40">
                            <Coffee className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Proje Satış Ofisi</p>
                            <p className="text-2xl font-bold text-indigo-600 mt-0.5">
                                {offices.filter(o => o.type === 'office' || o.type === 'site').length}
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                            <MapPin className="h-5 w-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Lokasyon, adres veya proje ara..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 text-sm rounded-lg"
                    />
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
                    <Button
                        size="sm"
                        variant={selectedTypeFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setSelectedTypeFilter('all')}
                        className="text-xs h-8 rounded-lg"
                    >
                        Tümü ({offices.length})
                    </Button>
                    {Object.entries(LOCATION_TYPES).map(([typeKey, cfg]) => {
                        const count = offices.filter(o => o.type === typeKey).length
                        if (count === 0 && selectedTypeFilter !== typeKey) return null
                        return (
                            <Button
                                key={typeKey}
                                size="sm"
                                variant={selectedTypeFilter === typeKey ? 'default' : 'outline'}
                                onClick={() => setSelectedTypeFilter(typeKey)}
                                className="text-xs h-8 rounded-lg whitespace-nowrap"
                            >
                                {cfg.label} ({count})
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* Locations Grid */}
            {filteredOffices.length === 0 ? (
                <Card className="rounded-2xl border border-dashed p-10 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-200">Kayıtlı Lokasyon Bulunamadı</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                            Henüz bir satış ofisi veya buluşma mekanı tanımlanmamış. &ldquo;Yeni Lokasyon Ekle&rdquo; butonunu kullanarak ilk noktanızı oluşturabilirsiniz.
                        </p>
                    </div>
                    <Button onClick={openCreateModal} variant="outline" size="sm" className="gap-1.5 font-bold">
                        <Plus className="h-4 w-4" /> İlk Lokasyonu Tanımla
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOffices.map(office => {
                        const typeInfo = LOCATION_TYPES[office.type] || LOCATION_TYPES.office
                        const TypeIcon = typeInfo.icon

                        return (
                            <Card
                                key={office.id}
                                className={`rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                                    office.isActive ? 'bg-card' : 'bg-slate-50/70 dark:bg-slate-900/40 opacity-75 border-dashed'
                                }`}
                            >
                                <CardHeader className="p-4 pb-2 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`p-2 rounded-lg shrink-0 border ${typeInfo.color}`}>
                                                <TypeIcon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={office.name}>
                                                    {office.name}
                                                </h3>
                                                <span className="text-[11px] text-muted-foreground font-medium">
                                                    {typeInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        <Switch
                                            checked={office.isActive}
                                            onCheckedChange={() => handleToggleActive(office.id, office.isActive)}
                                            title={office.isActive ? 'Aktif Lokasyon' : 'Pasif Lokasyon'}
                                        />
                                    </div>

                                    {office.projectName && (
                                        <Badge variant="secondary" className="text-[10px] font-semibold w-fit bg-purple-50 text-purple-700 dark:bg-purple-950/40 border border-purple-200">
                                            📁 {office.projectName}
                                        </Badge>
                                    )}
                                </CardHeader>

                                <CardContent className="p-4 pt-2 space-y-3 text-xs flex-1 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        {/* Address */}
                                        <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                                            <span className="line-clamp-2">
                                                {[office.address, office.district, office.city].filter(Boolean).join(', ') || 'Açık adres belirtilmemiş'}
                                            </span>
                                        </div>

                                        {/* Phone */}
                                        {office.phone && (
                                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                                                <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <a href={`tel:${office.phone}`} className="hover:underline font-medium text-blue-600">
                                                    {office.phone}
                                                </a>
                                            </div>
                                        )}

                                        {/* Welcoming notes */}
                                        {office.notes && (
                                            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-slate-800">
                                                ℹ️ &ldquo;{office.notes}&rdquo;
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                                        {office.mapsUrl ? (
                                            <a
                                                href={office.mapsUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                                            >
                                                📍 Haritada Aç <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-[11px] text-slate-400">Harita linki yok</span>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditModal(office)}
                                                className="h-7 w-7 p-0 text-slate-600 hover:text-blue-600"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(office.id, office.name)}
                                                className="h-7 w-7 p-0 text-slate-600 hover:text-red-600"
                                                title="Sil"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-emerald-600" />
                            {editingOffice ? 'Lokasyon Bilgilerini Düzenle' : 'Yeni Satış Ofisi / Görüşme Noktası Ekle'}
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Randevu planlamalarında satış danışmanlarının seçebileceği ve müşteriye otomatik gidecek lokasyon detaylarını belirleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSave} className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-1.5 sm:col-span-2">
                                <Label htmlFor="formName" className="font-bold">Lokasyon / Mekan Adı *</Label>
                                <Input
                                    id="formName"
                                    placeholder="Örn: Vadistanbul Merkez Satış Ofisi, Swissôtel VIP Lounge"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="formType" className="font-bold">Mekan Türü</Label>
                                <select
                                    id="formType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formType}
                                    onChange={e => setFormType(e.target.value as any)}
                                >
                                    {Object.entries(LOCATION_TYPES).map(([key, cfg]) => (
                                        <option key={key} value={key}>{cfg.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="formProjectId" className="font-bold">Bağlı Proje (Opsiyonel)</Label>
                                <select
                                    id="formProjectId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={formProjectId}
                                    onChange={e => setFormProjectId(e.target.value)}
                                >
                                    <option value="">Tüm Projeler İçin Genel</option>
                                    {projects?.map((p: any) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="formAddress" className="font-bold">Açık Adres</Label>
                            <Input
                                id="formAddress"
                                placeholder="Örn: Ayazağa Mah. Cendere Cad. No:109/B"
                                value={formAddress}
                                onChange={e => setFormAddress(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="formDistrict">İlçe</Label>
                                <Input
                                    id="formDistrict"
                                    placeholder="Örn: Sarıyer, Çankaya"
                                    value={formDistrict}
                                    onChange={e => setFormDistrict(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="formCity">Şehir</Label>
                                <Input
                                    id="formCity"
                                    placeholder="Örn: İstanbul, Ankara"
                                    value={formCity}
                                    onChange={e => setFormCity(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Google Maps Link / Location Pasting Area */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="formMapsUrl" className="font-bold flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                    Google Maps Konum / Harita Bağlantısı
                                </Label>
                                {(formAddress || formName) && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([formName, formAddress, formDistrict, formCity].filter(Boolean).join(' '))}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline inline-flex items-center gap-1"
                                    >
                                        🔍 Maps&apos;te Ara ↗
                                    </a>
                                )}
                            </div>
                            <Input
                                id="formMapsUrl"
                                placeholder="Google Maps'ten kopyaladığınız linki yapıştırın (Örn: https://maps.app.goo.gl/...)"
                                value={formMapsUrl}
                                onChange={e => handleMapsInput(e.target.value)}
                                className="bg-white dark:bg-slate-950 text-xs"
                            />
                            <p className="text-[11px] text-muted-foreground">
                                💡 Google Maps üzerinden <strong>Paylaş &gt; Bağlantıyı Kopyala</strong> yaparak linki buraya yapıştırabilirsiniz ya da boş bırakırsanız adres üzerinden otomatik harita linki üretilir.
                            </p>

                            {previewMapsUrl && (
                                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {formMapsUrl ? 'Özel Harita Linki Tanımlı' : 'Adresten Otomatik Konum Üretildi'}
                                    </span>
                                    <a
                                        href={previewMapsUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline"
                                    >
                                        📍 Konumu Haritada Test Et ↗
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="formPhone">İletişim / Danışma Telefonu</Label>
                            <Input
                                id="formPhone"
                                placeholder="Örn: 0212 999 88 77"
                                value={formPhone}
                                onChange={e => setFormPhone(e.target.value)}
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="formNotes" className="font-bold">Karşılama / Danışma Yönlendirme Notu</Label>
                            <Textarea
                                id="formNotes"
                                placeholder="Örn: Kapalı otopark ve vale hizmetimiz bulunmaktadır. Girişte NovoCRM adına randevunuz olduğunu belirtiniz."
                                value={formNotes}
                                onChange={e => setFormNotes(e.target.value)}
                                rows={2}
                            />
                            <p className="text-[11px] text-muted-foreground">
                                Bu not randevu teyidinde müşteriye iletilen WhatsApp mesajının altına karşılama bilgisi olarak eklenir.
                            </p>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 border-t">
                            <Switch
                                id="formIsActive"
                                checked={formIsActive}
                                onCheckedChange={setFormIsActive}
                            />
                            <Label htmlFor="formIsActive" className="text-sm font-medium cursor-pointer">
                                Bu lokasyonu randevu ekranlarında aktif olarak göster
                            </Label>
                        </div>

                        <DialogFooter className="pt-3 gap-2">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                İptal
                            </Button>
                            <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5">
                                {isSaving ? 'Kaydediliyor...' : editingOffice ? 'Güncellemeyi Kaydet' : 'Lokasyonu Oluştur'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
