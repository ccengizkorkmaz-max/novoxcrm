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
import { Switch } from "@/components/ui/switch"
import { Users, Building2, AlertTriangle, CheckCircle, XCircle, Search, Mail, Phone, Trash2, CreditCard, HardDrive, Download, Upload, RefreshCw, Clock, FileText, Shield, AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { getAllTenants, updateTenantSubscription, updateTenantStatus, provisionTenant, getSaasLeads, deleteSaasLead, resetTenantPassword, updateTenantAdminInfo, getGlobalStats, getBackupHistory } from './actions'
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
    const [hasBroker, setHasBroker] = useState(false)
    const [hasOutreach, setHasOutreach] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [globalStats, setGlobalStats] = useState<any>(null)

    // Backup State
    const [backupLoading, setBackupLoading] = useState(false)
    const [backupProgress, setBackupProgress] = useState('')
    const [backupHistory, setBackupHistory] = useState<any[]>([])
    const [restoreFile, setRestoreFile] = useState<File | null>(null)
    const [restorePreview, setRestorePreview] = useState<any>(null)
    const [restoreLoading, setRestoreLoading] = useState(false)
    const [restoreConfirm, setRestoreConfirm] = useState(false)
    const [restoreConfirmText, setRestoreConfirmText] = useState('')
    const [backupScope, setBackupScope] = useState<'all' | 'tenant'>('all')
    const [backupTenantId, setBackupTenantId] = useState<string>('')

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

    const loadBackupHistory = async () => {
        const res = await getBackupHistory()
        if (res.history) setBackupHistory(res.history)
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

        const subRes = await updateTenantSubscription(selectedTenant.id, {
            user_limit: limit,
            subscription_end_date: endDate,
            plan_type: plan,
            subscription_status: status,
            has_broker_module: hasBroker,
            has_outreach_module: hasOutreach
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
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="tenants">Kayıtlı Firmalar</TabsTrigger>
                    <TabsTrigger value="leads" className="relative">
                        Gelen Talepler
                        {leads.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                                {leads.length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="gap-1.5">
                        <HardDrive className="h-4 w-4" />
                        Yedekleme
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
                                                            setHasBroker(tenant.has_broker_module || false)
                                                            setHasOutreach(tenant.has_outreach_module || false)
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

                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <div className="space-y-0.5">
                                                                            <Label className="text-sm font-semibold">B2B Broker Modülü</Label>
                                                                            <p className="text-[10px] text-muted-foreground">Müteahhitin alt acenteleri yönetebileceği ekstra lisanslı modül.</p>
                                                                        </div>
                                                                        <Switch checked={hasBroker} onCheckedChange={setHasBroker} />
                                                                    </div>
                                                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                                        <div className="space-y-0.5">
                                                                            <Label className="text-sm font-semibold">AI Outreach Modülü</Label>
                                                                            <p className="text-[10px] text-muted-foreground">Vapi.ai ile otomatik arama ve akıllı takip sistemi.</p>
                                                                        </div>
                                                                        <Switch checked={hasOutreach} onCheckedChange={setHasOutreach} />
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

                {/* ─── BACKUP TAB ─── */}
                <TabsContent value="backup" className="mt-6 space-y-6">
                    {/* Quick Backup Section */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50/30">
                            <div className="flex flex-col gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <HardDrive className="h-5 w-5 text-blue-600" />
                                        Veritabanı Yedekleme
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Tüm platformun veya belirli bir firmanın tam JSON yedeğini alın.
                                    </p>
                                </div>

                                {/* Scope Selection */}
                                <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 p-3">
                                    <span className="text-sm font-medium text-slate-600 whitespace-nowrap">Yedek Kapsamı:</span>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={backupScope === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => { setBackupScope('all'); setBackupTenantId('') }}
                                            className="gap-1.5"
                                        >
                                            <Building2 className="h-3.5 w-3.5" />
                                            Tüm Platform
                                        </Button>
                                        <Button
                                            variant={backupScope === 'tenant' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setBackupScope('tenant')}
                                            className="gap-1.5"
                                        >
                                            <Users className="h-3.5 w-3.5" />
                                            Firma Bazlı
                                        </Button>
                                    </div>

                                    {backupScope === 'tenant' && (
                                        <Select value={backupTenantId} onValueChange={setBackupTenantId}>
                                            <SelectTrigger className="w-[260px]">
                                                <SelectValue placeholder="Firma seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {tenants.map((t) => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Button
                                        size="default"
                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md ml-auto"
                                        disabled={backupLoading || (backupScope === 'tenant' && !backupTenantId)}
                                        onClick={async () => {
                                            setBackupLoading(true)
                                            setBackupProgress('Yedek hazırlanıyor...')
                                            try {
                                                const payload: any = { mode: backupScope }
                                                if (backupScope === 'tenant' && backupTenantId) {
                                                    payload.tenant_id = backupTenantId
                                                }
                                                const res = await fetch('/api/backup/export', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(payload),
                                                })
                                                if (!res.ok) {
                                                    const err = await res.json()
                                                    throw new Error(err.error || 'Yedekleme başarısız')
                                                }

                                                const tableCount = res.headers.get('X-Table-Count') || '?'
                                                const recordCount = res.headers.get('X-Record-Count') || '?'
                                                const durationMs = res.headers.get('X-Duration-Ms') || '?'
                                                const scope = res.headers.get('X-Backup-Scope') || backupScope

                                                const scopeText = scope === 'all' ? 'Tüm platform' : 'Firma'
                                                setBackupProgress(`${scopeText}: ${tableCount} tablo, ${recordCount} kayıt yedeklendi (${(Number(durationMs) / 1000).toFixed(1)}sn)`)

                                                const blob = await res.blob()
                                                const url = URL.createObjectURL(blob)
                                                const a = document.createElement('a')
                                                a.href = url
                                                const disposition = res.headers.get('Content-Disposition')
                                                const fileName = disposition?.match(/filename="(.+)"/)?.[1] || `novocrm_backup.json`
                                                a.download = fileName
                                                document.body.appendChild(a)
                                                a.click()
                                                a.remove()
                                                URL.revokeObjectURL(url)

                                                toast.success(`Yedek başarıyla indirildi: ${tableCount} tablo, ${recordCount} kayıt`)
                                                loadBackupHistory()
                                            } catch (err: any) {
                                                setBackupProgress('')
                                                toast.error(err.message || 'Yedekleme hatası')
                                            } finally {
                                                setBackupLoading(false)
                                            }
                                        }}
                                    >
                                        {backupLoading ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Yedekleniyor...</>
                                        ) : (
                                            <><Download className="h-4 w-4" /> Yedek Al</>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {/* Loading State — Prominent */}
                            {backupLoading && (
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5 animate-pulse">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-blue-900 text-base">Yedek Alınıyor...</p>
                                            <p className="text-sm text-blue-600">
                                                Tüm tablolar sorgulanıyor ve JSON dosyası hazırlanıyor. Bu işlem veritabanı boyutuna göre 10-60 saniye sürebilir.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                                        <div className="bg-blue-600 h-2 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '40%', animation: 'indeterminate 1.5s ease-in-out infinite' }} />
                                    </div>
                                    <style>{`
                                        @keyframes indeterminate {
                                            0% { margin-left: 0%; width: 20%; }
                                            50% { margin-left: 30%; width: 40%; }
                                            100% { margin-left: 80%; width: 20%; }
                                        }
                                    `}</style>
                                </div>
                            )}

                            {/* Success State */}
                            {!backupLoading && backupProgress && (
                                <div className="mt-4 flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-emerald-800">Yedek Başarıyla İndirildi</p>
                                        <p className="text-emerald-600">{backupProgress}</p>
                                    </div>
                                </div>
                            )}
                        </CardHeader>
                    </Card>

                    {/* Backup History */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Clock className="h-4 w-4 text-slate-500" />
                                    Yedek Geçmişi
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={loadBackupHistory} className="gap-1.5">
                                    <RefreshCw className="h-3 w-3" /> Yenile
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50">
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Tür</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>Tablolar</TableHead>
                                        <TableHead>Kayıtlar</TableHead>
                                        <TableHead>Boyut</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {backupHistory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                                                <HardDrive className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                                Henüz yedek kaydı yok
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        backupHistory.map((b) => (
                                            <TableRow key={b.id}>
                                                <TableCell className="text-sm">
                                                    {b.created_at ? format(new Date(b.created_at), 'dd MMM yyyy HH:mm', { locale: tr }) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={b.backup_type === 'restore' ? 'border-amber-200 text-amber-700 bg-amber-50' : 'border-blue-200 text-blue-700 bg-blue-50'}>
                                                        {b.backup_type === 'manual' ? 'Manuel' : b.backup_type === 'auto' ? 'Otomatik' : 'Geri Yükleme'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={b.status === 'completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : b.status === 'failed' ? 'border-red-200 text-red-700 bg-red-50' : 'border-slate-200 text-slate-500'}>
                                                        {b.status === 'completed' ? 'Tamamlandı' : b.status === 'failed' ? 'Başarısız' : 'Devam Ediyor'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">{b.table_count || '-'}</TableCell>
                                                <TableCell className="font-mono text-sm">{b.record_count?.toLocaleString('tr-TR') || '-'}</TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {b.file_size_bytes ? `${(b.file_size_bytes / 1024 / 1024).toFixed(2)} MB` : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Restore Section */}
                    <Card className="border-amber-200 shadow-sm bg-gradient-to-br from-amber-50/30 to-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Upload className="h-5 w-5 text-amber-600" />
                                Yedekten Geri Yükleme
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Daha önce alınmış bir JSON yedek dosyasını yükleyerek veritabanını geri yükleyebilirsiniz.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* File Upload */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Input
                                        type="file"
                                        accept=".json"
                                        className="cursor-pointer"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setRestoreFile(file)
                                            setRestoreConfirm(false)
                                            setRestoreConfirmText('')
                                            
                                            try {
                                                const text = await file.text()
                                                const json = JSON.parse(text)
                                                if (!json._meta || !json.data) {
                                                    toast.error('Geçersiz yedek dosyası formatı')
                                                    setRestorePreview(null)
                                                    return
                                                }
                                                setRestorePreview(json._meta)
                                            } catch {
                                                toast.error('JSON dosyası okunamadı')
                                                setRestorePreview(null)
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            {restorePreview && (
                                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        Yedek Dosyası Önizleme
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-slate-900">{restorePreview.table_count || '?'}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Tablo</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                                            <p className="text-2xl font-bold text-slate-900">{restorePreview.total_records?.toLocaleString('tr-TR') || '?'}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Kayıt</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                                            <p className="text-sm font-bold text-slate-900">{restorePreview.created_at ? format(new Date(restorePreview.created_at), 'dd MMM yyyy HH:mm', { locale: tr }) : '?'}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Yedek Tarihi</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-3 text-center">
                                            <p className="text-sm font-bold text-slate-900">{restorePreview.created_by || '?'}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">Oluşturan</p>
                                        </div>
                                    </div>

                                    {/* Table list */}
                                    {restorePreview.tables && (
                                        <div className="bg-slate-50 rounded-lg p-3">
                                            <p className="text-xs font-semibold text-slate-500 mb-2">Tablolar:</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(restorePreview.tables).map(([name, count]: [string, any]) => (
                                                    <Badge key={name} variant="outline" className="text-[10px] bg-white">
                                                        {name}: {count}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Double Confirmation */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-bold text-red-800">Dikkat: Bu işlem mevcut verilerin üzerine yazacak!</p>
                                                <p className="text-xs text-red-600 mt-1">
                                                    Geri yükleme, yedekteki tablolardaki mevcut kayıtları günceller ve yeni kayıtları ekler.
                                                    İşlemi onaylamak için aşağıya <strong>GERI YUKLE</strong> yazın.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                placeholder='Onaylamak için "GERI YUKLE" yazın'
                                                value={restoreConfirmText}
                                                onChange={(e) => {
                                                    setRestoreConfirmText(e.target.value)
                                                    setRestoreConfirm(e.target.value === 'GERI YUKLE')
                                                }}
                                                className="bg-white border-red-200 max-w-xs"
                                            />
                                            <Button
                                                variant="destructive"
                                                disabled={!restoreConfirm || restoreLoading || !restoreFile}
                                                className="gap-2"
                                                onClick={async () => {
                                                    if (!restoreFile || !restoreConfirm) return
                                                    setRestoreLoading(true)
                                                    try {
                                                        const text = await restoreFile.text()
                                                        const json = JSON.parse(text)
                                                        
                                                        const res = await fetch('/api/backup/restore', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(json),
                                                        })
                                                        
                                                        const result = await res.json()
                                                        
                                                        if (!res.ok) {
                                                            throw new Error(result.error || 'Geri yükleme başarısız')
                                                        }
                                                        
                                                        toast.success(`Geri yükleme tamamlandı: ${result.summary?.tables_restored} tablo, ${result.summary?.total_records} kayıt`)
                                                        setRestoreFile(null)
                                                        setRestorePreview(null)
                                                        setRestoreConfirmText('')
                                                        setRestoreConfirm(false)
                                                        loadBackupHistory()
                                                    } catch (err: any) {
                                                        toast.error(err.message || 'Geri yükleme hatası')
                                                    } finally {
                                                        setRestoreLoading(false)
                                                    }
                                                }}
                                            >
                                                {restoreLoading ? (
                                                    <><Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...</>
                                                ) : (
                                                    <><Shield className="h-4 w-4" /> Geri Yükle</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    )
}
