import { getBrokerPerformanceReport } from '@/app/broker/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, ChevronDown, ChevronRight, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default async function BrokerReportsPage() {
    const reportResponse = await getBrokerPerformanceReport()

    // Check for error or invalid data
    if ('error' in reportResponse || !Array.isArray(reportResponse)) {
        return <div className="p-4 text-red-500">Veriler yüklenirken bir hata oluştu: {(reportResponse as any).error}</div>
    }

    const reportData = reportResponse

    // Key Metrics for Top Cards
    const totalBrokers = reportData.length
    const totalTransactions = reportData.reduce((acc: number, curr: any) => acc + curr.transactionCount, 0)

    // Calculate total payout in TRY (approximate for summary, or just list multi-currency)
    // For simplicity in summary cards, we might just show transaction count for now or list currencies.

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Broker Kazanç Raporları</h1>
                    <p className="text-muted-foreground">Broker bazlı komisyon ve hak edişlerin detaylı analizi.</p>
                </div>
                <Button variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Excel İndir
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Aktif Kazanan Brokerlar</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalBrokers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Toplam İşlem Adedi</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalTransactions}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rapor Durumu</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground mt-2">
                            Veriler anlık olarak `commissions` tablosundan çekilmektedir.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Kazanç Detayları</CardTitle>
                    <CardDescription>Hangi brokerın hangi satıştan/modelden ne kadar kazandığını inceleyin.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {reportData.map((broker: any) => (
                            <AccordionItem key={broker.brokerId} value={broker.brokerId}>
                                <AccordionTrigger className="hover:no-underline hover:bg-slate-50 px-4 rounded-md">
                                    <div className="flex items-center justify-between w-full pr-4">
                                        <div className="text-left">
                                            <div className="font-bold text-base">{broker.brokerName}</div>
                                            <div className="text-xs text-muted-foreground">{broker.email}</div>
                                        </div>
                                        <div className="flex gap-6 text-right">
                                            <div>
                                                <div className="text-xs text-muted-foreground">İşlem</div>
                                                <div className="font-bold">{broker.transactionCount} Adet</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-muted-foreground">Toplam Hak Ediş</div>
                                                <div className="font-bold text-green-700">
                                                    {Object.entries(broker.totalEarnings).map(([curr, amount]: any) => (
                                                        amount > 0 && <div key={curr}>{amount.toLocaleString('tr-TR')} {curr}</div>
                                                    ))}
                                                    {Object.values(broker.totalEarnings).every((v: any) => v === 0) && "0.00 TRY"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pt-4 pb-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>Müşteri / Lead</TableHead>
                                                <TableHead>Proje</TableHead>
                                                <TableHead>Durum</TableHead>
                                                <TableHead className="text-right">Tutar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {broker.transactions.map((tx: any) => (
                                                <TableRow key={tx.id}>
                                                    <TableCell className="text-xs">
                                                        {new Date(tx.date).toLocaleDateString('tr-TR')}
                                                    </TableCell>
                                                    <TableCell>{tx.leadName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal">
                                                            {tx.projectName || 'Genel'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={tx.status === 'Paid' ? 'default' : 'secondary'} className="text-[10px]">
                                                            {tx.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {tx.amount.toLocaleString('tr-TR')} {tx.currency}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
        </div>
    )
}
