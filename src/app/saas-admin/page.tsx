'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Building2, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react"
import { getAllTenants, updateTenantLimits, updateTenantStatus } from './actions'
import { useEffect } from 'react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function SaasAdminPage() {
    const [tenants, setTenants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Edit State
    const [selectedTenant, setSelectedTenant] = useState<any>(null)
    const [limit, setLimit] = useState(5)
    const [endDate, setEndDate] = useState('')
    const [status, setStatus] = useState('Active')
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const res = await getAllTenants()
        if (res.tenants) {
            setTenants(res.tenants)
        }
        setLoading(false)
    }

    async function handleSaveLimits() {
        if (!selectedTenant) return
        await updateTenantLimits(selectedTenant.id, limit, endDate)
        setDialogOpen(false)
        loadData()
    }

    async function handleStatusChange(id: string, newStatus: string) {
        if (confirm(`Bu firmanın durumunu ${newStatus} olarak değiştirmek istediğinize emin misiniz?`)) {
            await updateTenantStatus(id, newStatus)
            loadData()
        }
    }

    // New Tenant State
    const [newTenantOpen, setNewTenantOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    async function handleCreateTenant(formData: FormData) {
        setSaving(true)
        const { provisionTenant } = await import('./actions') // Dynamic import to avoid hydration matches
        const res = await provisionTenant(formData)
        setSaving(false)

        if (res.error) {
            alert(res.error)
        } else {
            setNewTenantOpen(false)
            loadData()
            alert('Firma ve yönetici hesabı başarıyla oluşturuldu.')
        }
    }

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.id.includes(search)
    )

    const totalUsers = tenants.reduce((sum, t) => sum + t.user_count, 0)
    const activeTenants = tenants.filter(t => t.subscription_status === 'Active').length

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Genel Bakış</h1>
                <Dialog open={newTenantOpen} onOpenChange={setNewTenantOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Building2 className="mr-2 h-4 w-4" /> Yeni Firma Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Manuel Firma Kurulumu</DialogTitle>
                            <DialogDescription>
                                Yeni bir müşteri için firma ve yönetici hesabı oluşturun.
                            </DialogDescription>
                        </DialogHeader>
                        <form action={handleCreateTenant} className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Firma Adı</Label>
                                <Input id="name" name="name" placeholder="ABC Lojistik" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adminName">Yönetici Adı</Label>
                                    <Input id="adminName" name="adminName" placeholder="Ahmet Yılmaz" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Yönetici Email</Label>
                                    <Input id="adminEmail" name="adminEmail" type="email" placeholder="ahmet@abc.com" required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="adminPassword">Geçici Şifre</Label>
                                <Input id="adminPassword" name="adminPassword" type="text" placeholder="123456" required minLength={6} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="plan">Paket</Label>
                                    <Select name="plan" defaultValue="Pro">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seçiniz" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Free">Free (Ücretsiz)</SelectItem>
                                            <SelectItem value="Pro">Pro</SelectItem>
                                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="userLimit">Kullanıcı Limiti</Label>
                                    <Input id="userLimit" name="userLimit" type="number" defaultValue="5" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="duration">Lisans Süresi (Ay)</Label>
                                <Select name="duration" defaultValue="12">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1 Ay</SelectItem>
                                        <SelectItem value="6">6 Ay</SelectItem>
                                        <SelectItem value="12">1 Yıl</SelectItem>
                                        <SelectItem value="24">2 Yıl</SelectItem>
                                        <SelectItem value="999">Süresiz</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving ? 'Oluşturuluyor...' : 'Firma Oluştur'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Building2 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Toplam Firma</p>
                            <h3 className="text-2xl font-bold">{tenants.length}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Aktif Abonelik</p>
                            <h3 className="text-2xl font-bold">{activeTenants}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Toplam Kullanıcı</p>
                            <h3 className="text-2xl font-bold">{totalUsers}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm">
                <div className="p-6 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Firma Listesi</h2>
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Firma adı veya ID ara..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Firma Adı</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead>Kullanıcılar</TableHead>
                            <TableHead>Paket</TableHead>
                            <TableHead>Bitiş Tarihi</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Yükleniyor...</TableCell>
                            </TableRow>
                        ) : filteredTenants.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Kayıt bulunamadı.</TableCell>
                            </TableRow>
                        ) : (
                            filteredTenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium">
                                        {tenant.name}
                                        <div className="text-xs text-muted-foreground font-mono">{tenant.id}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tenant.subscription_status === 'Active' ? 'default' : 'destructive'}>
                                            {tenant.subscription_status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{tenant.user_count}</span>
                                            <span className="text-muted-foreground">/ {tenant.user_limit}</span>
                                            {tenant.user_count >= tenant.user_limit && (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{tenant.plan_type}</TableCell>
                                    <TableCell>
                                        {tenant.subscription_end_date ? (
                                            format(new Date(tenant.subscription_end_date), 'dd MMM yyyy', { locale: tr })
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {tenant.subscription_status === 'Active' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleStatusChange(tenant.id, 'Suspended')}
                                                >
                                                    Askıya Al
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleStatusChange(tenant.id, 'Active')}
                                                >
                                                    Aktifleştir
                                                </Button>
                                            )}

                                            <Dialog open={dialogOpen && selectedTenant?.id === tenant.id} onOpenChange={(open) => {
                                                if (open) {
                                                    setSelectedTenant(tenant)
                                                    setLimit(tenant.user_limit)
                                                    setEndDate(tenant.subscription_end_date ? new Date(tenant.subscription_end_date).toISOString().split('T')[0] : '')
                                                    setDialogOpen(true)
                                                } else {
                                                    setDialogOpen(false)
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">Düzenle</Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Abonelik Düzenle: {tenant.name}</DialogTitle>
                                                        <DialogDescription>
                                                            Kullanıcı limitini ve lisans süresini güncelleyin.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">Kullanıcı Limiti</Label>
                                                            <Input
                                                                type="number"
                                                                value={limit}
                                                                onChange={(e) => setLimit(Number(e.target.value))}
                                                                className="col-span-3"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-4 items-center gap-4">
                                                            <Label className="text-right">Bitiş Tarihi</Label>
                                                            <Input
                                                                type="date"
                                                                value={endDate}
                                                                onChange={(e) => setEndDate(e.target.value)}
                                                                className="col-span-3"
                                                            />
                                                        </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button onClick={handleSaveLimits}>Kaydet</Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
