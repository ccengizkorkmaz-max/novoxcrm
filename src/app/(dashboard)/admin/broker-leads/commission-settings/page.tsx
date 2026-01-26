import { getCommissionModels } from '@/app/broker/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Settings2,
    Plus,
    Layers,
    Building2,
    BadgeTurkishLira,
    ChevronRight,
    ArrowRight
} from "lucide-react"
import Link from 'next/link'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function CommissionSettingsPage() {
    const models = await getCommissionModels()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Komisyon Ayarları</h1>
                    <p className="text-muted-foreground">Proje bazlı komisyon modellerini ve kademeli (tier) yapıları yönetin.</p>
                </div>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4" />
                    Yeni Model Ekle
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Aktif Komisyon Modelleri</CardTitle>
                    <CardDescription>Sözleşme ve satış süreçlerinde uygulanacak kurallar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model Adı</TableHead>
                                <TableHead>Proje</TableHead>
                                <TableHead>Tür</TableHead>
                                <TableHead>Standart Değer</TableHead>
                                <TableHead>Ödeme Aşaması</TableHead>
                                <TableHead className="text-right">İşlem</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models && models.length > 0 ? (
                                models.map((model) => (
                                    <TableRow key={model.id}>
                                        <TableCell className="font-bold">{model.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3 w-3 text-muted-foreground" />
                                                <span>{model.projects?.name || 'Tüm Projeler'}</span>
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
                                        <TableCell className="text-xs text-muted-foreground">
                                            {model.payable_stage}
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
                                        Henüz bir komisyon modeli tanımlanmadı.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
                            <BadgeTurkishLira className="h-5 w-5 text-blue-600" />
                            Otomatik Hak Ediş
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-blue-800 space-y-3">
                        <p>Satış durumu "Sözleşme İmzalandı" yapıldığında, sistem otomatik olarak brokerın o ana kadarki performansını kontrol eder ve uygun tier üzerinden komisyon kaydını oluşturur.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
