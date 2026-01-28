import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Clock,
    UserPlus,
    Building2,
    Calendar,
    Mail,
    Phone,
    Users,
    CheckCircle2,
    Award,
    ExternalLink
} from "lucide-react"
import BrokerApplicationActions from './components/BrokerApplicationActions'
import BrokerManagementActions from './components/BrokerManagementActions'
import BrokerReminderButton from './components/BrokerReminderButton'

export default async function AdminBrokerApplicationsPage() {
    const supabase = await createClient()

    // Fetch broker applications
    const { data: applications } = await supabase
        .from('broker_applications')
        .select('*')
        .order('created_at', { ascending: false })

    const pendingApps = applications?.filter(app => app.status === 'Pending') || []
    const processedApps = applications?.filter(app => app.status !== 'Pending') || []

    // Fetch Approved Brokers (Profiles)
    const { data: brokers } = await supabase
        .from('profiles')
        .select(`
            *,
            broker_levels (
                id,
                name,
                color,
                icon
            )
        `)
        .eq('role', 'broker')
        .order('created_at', { ascending: false })

    // Fetch all levels for management actions
    const { data: levels } = await supabase
        .from('broker_levels')
        .select('*')
        .order('min_sales_count', { ascending: true })

    // Identify Approved Applications that are NOT yet in brokers list (Profiles)
    const approvedApps = applications?.filter(app => app.status === 'Approved') || []
    const registeredBrokerEmails = new Set(brokers?.map(b => b.email) || [])

    const unregisteredApprovedBrokers = approvedApps.filter(app => !registeredBrokerEmails.has(app.email))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Broker Yönetimi</h1>
                    <p className="text-muted-foreground">Broker başvurularını ve onaylı partner listesini yönetin.</p>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-600">Bekleyen Başvurular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <div className="text-2xl font-bold text-blue-700">{pendingApps.length}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-600">Aktif Brokerlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-500" />
                            <div className="text-2xl font-bold text-green-700">{brokers?.filter(b => b.is_active !== false).length || 0}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Başvuru</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{applications?.length || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="applications" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="applications">Gelen Başvurular</TabsTrigger>
                    <TabsTrigger value="brokers">Onaylı Brokerlar</TabsTrigger>
                </TabsList>

                {/* --- TAB: APPLICATIONS --- */}
                <TabsContent value="applications" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gelen Başvurular</CardTitle>
                            <CardDescription>Yeni iş ortaklığı taleplerini inceleyin ve onaylayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Broker Bilgileri</TableHead>
                                        <TableHead>İletişim</TableHead>
                                        <TableHead>Firma</TableHead>
                                        <TableHead>Tarih</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {applications && applications.length > 0 ? (
                                        applications.map((app) => (
                                            <TableRow key={app.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{app.full_name}</span>
                                                        {app.notes && (
                                                            <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">
                                                                "{app.notes}"
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Mail className="h-3 w-3 opacity-50" />
                                                            {app.email}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <Phone className="h-3 w-3 opacity-50" />
                                                            {app.phone}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{app.company_name || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm" suppressHydrationWarning>
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(app.created_at).toLocaleDateString('tr-TR')}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${app.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                        app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {app.status === 'Pending' ? 'Bekliyor' :
                                                            app.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {app.status === 'Pending' ? (
                                                        <BrokerApplicationActions applicationId={app.id} />
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic" suppressHydrationWarning>
                                                            {new Date(app.processed_at).toLocaleDateString('tr-TR')} tarihinde işlendi
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                Henüz başvuru bulunmamaktadır.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- TAB: APPROVED BROKERS --- */}
                <TabsContent value="brokers" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onaylı Broker Listesi</CardTitle>
                            <CardDescription>Sistemdeki yetkili broker kullanıcıları.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ad Soyad</TableHead>
                                        <TableHead>Seviye (Partner)</TableHead>
                                        <TableHead>Durum</TableHead>
                                        <TableHead>İletişim</TableHead>
                                        <TableHead>Kayıt Tarihi</TableHead>
                                        <TableHead className="text-right">İşlemler</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* 1. Unregistered (Pending Signup) Brokers */}
                                    {unregisteredApprovedBrokers.map(app => (
                                        <TableRow key={app.id} className="bg-orange-50/50">
                                            <TableCell>
                                                <div className="font-bold">{app.full_name}</div>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">
                                                        Hesap Oluşturulmadı
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground">-</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-orange-700">
                                                    Kayıt Bekleniyor
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Mail className="h-3 w-3 opacity-50" />
                                                        {app.email}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs">
                                                        <Phone className="h-3 w-3 opacity-50" />
                                                        {app.phone}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                    {new Date(app.created_at).toLocaleDateString('tr-TR')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs text-muted-foreground italic">
                                                        Kullanıcı kaydı bekleniyor
                                                    </span>
                                                    <BrokerReminderButton applicationId={app.id} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* 2. Registered Brokers */}
                                    {brokers && brokers.length > 0 ? (
                                        brokers.map((broker) => {
                                            // Ensure broker_levels is treated correctly based on previous findings
                                            const level = Array.isArray(broker.broker_levels) ? broker.broker_levels[0] : broker.broker_levels
                                            const isActive = broker.is_active !== false // Default true if null

                                            return (
                                                <TableRow key={broker.id} className={!isActive ? 'bg-slate-50 opacity-60' : ''}>
                                                    <TableCell>
                                                        <div className="font-bold text-sm">{broker.full_name}</div>
                                                        {broker.broker_slug ? (
                                                            <a
                                                                href={`/p/${broker.broker_slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 mt-1 transition-colors"
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                novoxcrm.com/p/{broker.broker_slug}
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-muted-foreground mt-1 inline-block italic">Slug belirlenmemiş</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {level ? (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                                                style={{
                                                                    backgroundColor: (level.color || '#000') + '10',
                                                                    color: level.color || '#000',
                                                                    borderColor: (level.color || '#000') + '30'
                                                                }}
                                                            >
                                                                <Award className="h-3 w-3" />
                                                                {level.name}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isActive ? 'Aktif' : 'Pasif'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1 text-xs">
                                                                <Mail className="h-3 w-3 opacity-50" />
                                                                {broker.email}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                                                            {new Date(broker.created_at).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <BrokerManagementActions
                                                            brokerId={broker.id}
                                                            isActive={isActive}
                                                            currentLevelId={level?.id}
                                                            levels={levels || []}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    ) : (
                                        (unregisteredApprovedBrokers.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                                                    Henüz onaylı broker bulunmamaktadır.
                                                </TableCell>
                                            </TableRow>
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
