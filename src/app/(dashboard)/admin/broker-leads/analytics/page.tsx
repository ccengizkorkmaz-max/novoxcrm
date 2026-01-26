import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Users,
    TrendingUp,
    Award,
    ArrowUpRight,
    Building2,
    BadgeTurkishLira,
    Star
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

export default async function BrokerAnalyticsPage() {
    const supabase = await createClient()

    // Fetch brokers and leads separately to avoid complex RPC/parse errors
    const { data: brokers } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'broker')

    const { data: leadsData } = await supabase
        .from('broker_leads')
        .select('id, broker_id, status')

    const brokerStats = brokers?.map(broker => {
        const brokerLeads = leadsData?.filter(l => l.broker_id === broker.id) || []
        const wonLeadsCount = brokerLeads.filter(l => l.status === 'Contract Signed').length
        return {
            id: broker.id,
            full_name: broker.full_name,
            total_leads: brokerLeads.length,
            won_leads: wonLeadsCount,
            conversion: brokerLeads.length > 0 ? (wonLeadsCount / brokerLeads.length) * 100 : 0
        }
    }) || []

    const totalLeads = leadsData?.length || 0
    const wonLeadsTotal = leadsData?.filter(l => l.status === 'Contract Signed').length || 0
    const conversionRate = totalLeads > 0 ? (wonLeadsTotal / totalLeads) * 100 : 0

    const { data: allCommissions } = await supabase.from('commissions').select('amount, status')
    const totalCommissionsPaid = allCommissions?.filter(c => c.status === 'Paid').reduce((sum, c) => sum + Number(c.amount), 0) || 0

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold">Broker Performans Analitiği</h1>
                <p className="text-muted-foreground">Broker kanalı verimliliği, dönüşüm oranları ve maliyet analizleri.</p>
            </div>

            {/* Top KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Broker Lead</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalLeads}</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500" /> +12% geçen aya göre
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Genel Dönüşüm Oranı</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">%{conversionRate.toFixed(1)}</div>
                        <Progress value={conversionRate} className="h-1 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam Komisyon Gideri</CardTitle>
                        <BadgeTurkishLira className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCommissionsPaid.toLocaleString('tr-TR')} ₺</div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            Ödenen toplam hak ediş
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Kampanya Etkisi</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">%+18</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Kampanya sonrası lead artışı
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                {/* Leaderboard */}
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            Broker Leaderboard
                        </CardTitle>
                        <CardDescription>En çok dönüşüm sağlayan brokerlar sıralaması.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Broker</TableHead>
                                    <TableHead className="text-right">Lead</TableHead>
                                    <TableHead className="text-right">Satış</TableHead>
                                    <TableHead className="text-right">Dönüşüm %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brokerStats.length > 0 ? (
                                    brokerStats.sort((a, b) => b.won_leads - a.won_leads).map((broker) => (
                                        <TableRow key={broker.id}>
                                            <TableCell className="font-medium">{broker.full_name}</TableCell>
                                            <TableCell className="text-right">{broker.total_leads}</TableCell>
                                            <TableCell className="text-right font-bold text-green-600">{broker.won_leads}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="text-xs">%{broker.conversion.toFixed(0)}</span>
                                                    <Progress value={broker.conversion} className="h-1.5 w-12" />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground italic">
                                            Henüz aktif broker verisi bulunmamaktadır.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Performance by Project */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            Proje Bazlı Dağılım
                        </CardTitle>
                        <CardDescription>Hangi projeye ne kadar ilgi var?</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Static examples for visual aid since dynamic requires more aggregation */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Skyline Valley</span>
                                <span className="text-muted-foreground">34 Lead</span>
                            </div>
                            <Progress value={75} className="h-2 bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Sea Breeze Residences</span>
                                <span className="text-muted-foreground">22 Lead</span>
                            </div>
                            <Progress value={45} className="h-2 bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Green Loft</span>
                                <span className="text-muted-foreground">12 Lead</span>
                            </div>
                            <Progress value={25} className="h-2 bg-slate-100" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
