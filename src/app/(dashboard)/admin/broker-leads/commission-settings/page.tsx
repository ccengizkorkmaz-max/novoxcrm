

import { getCommissionModels } from '@/app/broker/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Settings2,
    Plus,
    Layers,
    Building2,
    BadgeTurkishLira,
    ChevronRight,
    Calendar,
    Archive
} from "lucide-react"
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default async function CommissionSettingsPage() {
    const models = await getCommissionModels()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const activeModels = models.filter((m: any) => {
        if (m.status === 'Archived') return false
        if (m.end_date) {
            const end = new Date(m.end_date)
            if (end < today) return false
        }
        return true
    })

    const archivedModels = models.filter((m: any) => !activeModels.includes(m))

    function ModelsTable({ data, readonly = false }: { data: any[], readonly?: boolean }) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Model Adı</TableHead>
                        <TableHead>Proje</TableHead>
                        <TableHead>Geçerlilik</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Standart Değer</TableHead>
                        <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data && data.length > 0 ? (
                        data.map((model) => (
                            <TableRow key={model.id} className={readonly ? "opacity-75 bg-slate-50" : ""}>
                                <TableCell className="font-bold">
                                    {model.name}
                                    {readonly && <Badge variant="secondary" className="ml-2 text-[10px]">Pasif</Badge>}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-3 w-3 text-muted-foreground" />
                                        <span>{model.projects?.name || 'Tüm Projeler'}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-xs text-muted-foreground">
                                        {model.start_date && <span>Başlangıç: {new Date(model.start_date).toLocaleDateString('tr-TR')}</span>}
                                        {model.end_date ? (
                                            <span className={new Date(model.end_date) < today ? "text-red-500 font-bold" : ""}>
                                                Bitiş: {new Date(model.end_date).toLocaleDateString('tr-TR')}
                                            </span>
                                        ) : (
                                            <span>Süresiz</span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${model.type === 'Tiered' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {model.type === 'Tiered' ? 'Kademeli (Tiered)' : model.type}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {model.value.toLocaleString('tr-TR')} {model.currency}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/admin/broker-leads/commission-settings/${model.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
                                            Detaylar <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-10" />
                                Bu kategoride model bulunamadı.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Komisyon Ayarları</h1>
                    <p className="text-muted-foreground">Proje bazlı komisyon modellerini ve kademeli (tier) yapıları yönetin.</p>
                </div>
                <Link href="/admin/broker-leads/commission-settings/new">
                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4" />
                        Yeni Model Ekle
                    </Button>
                </Link>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-4">
                    <TabsTrigger value="active">Aktif Modeller</TabsTrigger>
                    <TabsTrigger value="archived">Süresi Bitenler / Pasif</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings2 className="h-5 w-5 text-green-600" />
                                Aktif Komisyon Modelleri
                            </CardTitle>
                            <CardDescription>Şu anda geçerli olan ve satışlarda uygulanan modeller.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ModelsTable data={activeModels} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="archived">
                    <Card className="bg-slate-50 border-dashed">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-slate-500">
                                <Archive className="h-5 w-5" />
                                Arşivlenmiş Modeller
                            </CardTitle>
                            <CardDescription>Süresi dolmuş veya manuel olarak kapatılmış modeller.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ModelsTable data={archivedModels} readonly={true} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Layers className="h-5 w-5 text-purple-600" />
                            Kademeli (Tier) Mantığı Nedir?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 space-y-3">
                        <p>Brokerların yaptığı toplam satış adedine göre değişen komisyon oranları belirleyebilirsiniz.</p>
                        <ul className="list-disc pl-4 space-y-1">
                            <li>10 satışa kadar: %3</li>
                            <li>11-20 satış arası: %4</li>
                            <li>21 ve üzeri: %5</li>
                        </ul>
                        <p className="text-xs italic text-slate-400 mt-2">Bu yapı, brokerları daha fazla satış yapmaya teşvik eder.</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-md flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Geçerlilik Tarihleri
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 space-y-3">
                        <p>Komisyon modelleriniz için başlangıç ve bitiş tarihleri belirleyebilirsiniz. Bitiş tarihi geçen modeller otomatik olarak "Pasif" duruma geçer ve yeni satışlarda hesaplamaya katılmaz.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
