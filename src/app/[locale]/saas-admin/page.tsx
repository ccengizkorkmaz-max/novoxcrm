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
import { Progress } from "@/components/ui/progress"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Building2, AlertTriangle, CheckCircle, XCircle, Search, Mail, Phone, Trash2, CreditCard } from "lucide-react"
import { getAllTenants, updateTenantSubscription, updateTenantStatus, provisionTenant, getSaasLeads, deleteSaasLead, resetTenantPassword, updateTenantAdminInfo, getGlobalStats } from './actions'
import { useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { toast } from 'sonner'

export default function SaasAdminPage() {
    const [tenants, setTenants] = useState<any[]>([])
    const [leads, setLeads] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [leadsLoading, setLeadsLoading] = useState(false)
    const [search, setSearch] = useState('')

    // Edit State
    const [selectedTenant, setSelectedTenant] = useState<any>(null)
    const [limit, setLimit] = useState(5)
    const [endDate, setEndDate] = useState('')
    const [status, setStatus] = useState('Active')
    const [plan, setPlan] = useState('Pro')
    const [newPass, setNewPass] = useState('')
    const [adminName, setAdminName] = useState('')
    const [adminEmail, setAdminEmail] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [globalStats, setGlobalStats] = useState<any>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        const [tenantsRes, leadsRes, statsRes] = await Promise.all([
            getAllTenants(),
            getSaasLeads(),
            getGlobalStats()
        ])

        if (tenantsRes.tenants) setTenants(tenantsRes.tenants)
        if (leadsRes.leads) setLeads(leadsRes.leads)
        if (statsRes && !statsRes.error) setGlobalStats(statsRes)
        setLoading(false)
    }

    async function handleDeleteLead(id: string) {
        if (!confirm('Bu talebi silmek istediğinize emin misiniz?')) return
        const res = await deleteSaasLead(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Talep silindi')
            loadData()
        }
    }

    async function handleSaveLimits() {
        if (!selectedTenant) return

        // 1. Update subscription data
        const subRes = await updateTenantSubscription(selectedTenant.id, {
            user_limit: limit,
            subscription_end_date: endDate,
            plan_type: plan,
            subscription_status: status
        })

        if (subRes.error) {
            toast.error(subRes.error)
            return
        }

        // 2. Update admin info
        const adminRes = await updateTenantAdminInfo(selectedTenant.id, adminName, adminEmail)
        if (adminRes.error) {
            toast.error('Abonelik güncellendi fakat yetkili bilgileri hata verdi: ' + adminRes.error)
        }

        // 3. Update password if provided
        if (newPass) {
            const passRes = await resetTenantPassword(selectedTenant.id, newPass)
            if (passRes.error) {
                toast.error('Abonelik güncellendi fakat şifre hata verdi: ' + passRes.error)
            } else {
                toast.success('Şifre güncellendi ve kullanıcıya mail gönderildi.')
            }
        }

        toast.success('Firma bilgileri güncellendi.')
        setDialogOpen(false)
        setNewPass('')
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
    const [prefillData, setPrefillData] = useState<any>(null)

    function handleProvisionLead(lead: any) {
        setPrefillData({
            name: lead.company_name || '',
            adminName: lead.full_name || '',
            adminEmail: lead.email || '',
            leadId: lead.id
        })
        setNewTenantOpen(true)
    }

    async function handleCreateTenant(formData: FormData) {
        setSaving(true)
        const res = await provisionTenant(formData)

        if (res.error) {
            setSaving(false)
            alert(res.error)
        } else {
            // If it was from a lead, delete the lead
            if (prefillData?.leadId) {
                await deleteSaasLead(prefillData.leadId)
            }

            setSaving(false)
            setNewTenantOpen(false)
            setPrefillData(null)
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
                                <Input id="name" name="name" placeholder="ABC Lojistik" required defaultValue={prefillData?.name || ''} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adminName">Yönetici Adı</Label>
                                    <Input id="adminName" name="adminName" placeholder="Ahmet Yılmaz" required defaultValue={prefillData?.adminName || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">Yönetici Email</Label>
                                    <Input id="adminEmail" name="adminEmail" type="email" placeholder="ahmet@abc.com" required defaultValue={prefillData?.adminEmail || ''} />
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

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">SaaS Süper Admin</h1>
                    <p className="text-muted-foreground">Tüm platformu ve bayileri buradan yönetebilirsiniz.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={loadData} variant="outline">
                        <Search className="h-4 w-4 mr-2" /> Yenile
                    </Button>
                </div>
            </div>

            {globalStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800">Toplam Satış Hacmi</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-900">
                                {formatCurrency(globalStats.totalSalesVolume)}
                            </div>
                            <p className="text-[10px] text-blue-600 font-medium mt-1">SaaS Geneli Toplam Ciro</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Kayıtlı Firmalar</CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{globalStats.tenantCount}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Aktif & Bekleyen Firmalar</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{globalStats.userCount}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Platformdaki Toplam Hesap</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Bekleyen Talepler</CardTitle>
                            <Mail className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{globalStats.leadCount}</div>
                            <p className="text-[10px] text-muted-foreground mt-1">Henüz Firma Olmamış Talepler</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="tenants" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="tenants">Kayıtlı Firmalar</TabsTrigger>
                    <TabsTrigger value="leads" className="relative">
                        Gelen Talepler
                        {leads.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                {leads.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tenants" className="mt-6">
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
                                    <TableHead className="text-center">Proje</TableHead>
                                    <TableHead className="text-center">Müşteri</TableHead>
                                    <TableHead>Paket</TableHead>
                                    <TableHead>Bitiş Tarihi</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">Yükleniyor...</TableCell>
                                    </TableRow>
                                ) : filteredTenants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-24 text-center">Kayıt bulunamadı.</TableCell>
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
                                                <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-bold">{tenant.user_count} / {tenant.user_limit}</span>
                                                        <span className="text-muted-foreground">%{Math.round((tenant.user_count / tenant.user_limit) * 100)}</span>
                                                    </div>
                                                    <Progress
                                                        value={(tenant.user_count / tenant.user_limit) * 100}
                                                        className={`h-1.5 ${tenant.user_count >= tenant.user_limit ? 'bg-red-100' : ''}`}
                                                    />
                                                    {tenant.user_count >= tenant.user_limit && (
                                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                                                            <AlertTriangle className="h-3 w-3" /> Dolu
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-semibold text-blue-600">{tenant.project_count}</TableCell>
                                            <TableCell className="text-center font-semibold text-emerald-600">{tenant.customer_count}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium bg-slate-50">
                                                    {tenant.plan_type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
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
                                                            setPlan(tenant.plan_type)
                                                            setStatus(tenant.subscription_status)
                                                            setAdminName(tenant.owner_name)
                                                            setAdminEmail(tenant.owner_email)
                                                            setNewPass('')
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
                                                            <div className="space-y-4 py-4">
                                                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-4 mb-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="font-semibold text-slate-700 flex items-center gap-2">
                                                                            <Users className="h-4 w-4" /> Yetkili Ad Soyad
                                                                        </Label>
                                                                        <Input
                                                                            value={adminName}
                                                                            onChange={(e) => setAdminName(e.target.value)}
                                                                            placeholder="Yetkili Adı"
                                                                            className="bg-white"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="font-semibold text-slate-700 flex items-center gap-2">
                                                                            <Mail className="h-4 w-4" /> Kayıtlı Email
                                                                        </Label>
                                                                        <Input
                                                                            type="email"
                                                                            value={adminEmail}
                                                                            onChange={(e) => setAdminEmail(e.target.value)}
                                                                            placeholder="admin@firma.com"
                                                                            className="bg-white"
                                                                        />
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 italic">
                                                                        Sistem Rolü: {selectedTenant?.debug_role}
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Paket</Label>
                                                                        <Select value={plan} onValueChange={setPlan}>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Free">Free</SelectItem>
                                                                                <SelectItem value="Pro">Pro</SelectItem>
                                                                                <SelectItem value="Enterprise">Enterprise</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Durum</Label>
                                                                        <Select value={status} onValueChange={setStatus}>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Active">Active (Aktif)</SelectItem>
                                                                                <SelectItem value="Suspended">Suspended (Askıda)</SelectItem>
                                                                                <SelectItem value="Trial">Trial (Deneme)</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label>Kullanıcı Limiti</Label>
                                                                        <Input
                                                                            type="number"
                                                                            value={limit}
                                                                            onChange={(e) => setLimit(Number(e.target.value))}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>Bitiş Tarihi</Label>
                                                                        <Input
                                                                            type="date"
                                                                            value={endDate}
                                                                            onChange={(e) => setEndDate(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="border-t pt-4 space-y-2">
                                                                    <Label className="font-semibold text-blue-600">Yeni Şifre</Label>
                                                                    <Input
                                                                        type="text"
                                                                        placeholder="Şifreyi değiştirmek için yazın"
                                                                        value={newPass}
                                                                        onChange={(e) => setNewPass(e.target.value)}
                                                                        className="border-blue-200 focus:border-blue-500"
                                                                    />
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        Şifre değiştiğinde kullanıcıya otomatik bilgilendirme maili gider.
                                                                    </p>
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
                </TabsContent>

                <TabsContent value="leads" className="mt-6">
                    <div className="rounded-xl border bg-card shadow-sm">
                        <div className="p-6 border-b">
                            <h2 className="text-lg font-semibold">Gelen Talepler</h2>
                            <p className="text-sm text-muted-foreground">Kayıt formu üzerinden gelen yeni hizmet/hesap talepleri.</p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Müşteri Bilgileri</TableHead>
                                    <TableHead>İletişim</TableHead>
                                    <TableHead>Firma Adı</TableHead>
                                    <TableHead>Kaynak</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="text-right">İşlemler</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leadsLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Yükleniyor...</TableCell>
                                    </TableRow>
                                ) : leads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Henüz talep bulunmamaktadır.</TableCell>
                                    </TableRow>
                                ) : (
                                    leads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.full_name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {lead.email}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs">
                                                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {lead.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{lead.company_name || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {lead.notes?.replace('Marketing Resource: ', '') || 'Genel Kayıt'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {format(new Date(lead.created_at), 'dd MMM yyyy HH:mm', { locale: tr })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => handleProvisionLead(lead)}
                                                    >
                                                        Firma Kur
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteLead(lead.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

        </div>
    )
}
