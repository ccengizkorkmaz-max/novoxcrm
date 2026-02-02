
import { getAdminBrokerFinanceSummary } from '@/app/broker/finance-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    BadgeTurkishLira,
    Download,
    Upload,
    ChevronRight,
    Users,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    Search
} from "lucide-react"
import Link from 'next/link'
import FinanceExcelActions from './components/FinanceExcelActions'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function BrokerFinanceDashboardPage() {
    const { data: summary, error } = await getAdminBrokerFinanceSummary()
    const t = await getTranslations('BrokerFinances')
    const locale = await getLocale()

    if (error) {
        return <div className="p-8 text-center text-red-500">Hata: {error}</div>
    }

    const totalBalance = summary?.reduce((sum, b) => sum + b.balance, 0) || 0
    const totalPaid = summary?.reduce((sum, b) => sum + b.totalPaid, 0) || 0
    const totalEarned = summary?.reduce((sum, b) => sum + b.totalEarned, 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
                <div className="flex gap-2">
                    {/* Pass translator or use hook inside CSR component */}
                    <FinanceExcelActions summaryData={summary || []} />
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-400">{t('stats.totalBalance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Wallet className="h-5 w-5 text-blue-400" />
                            <div className="text-2xl font-bold">{totalBalance.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 border-green-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-green-600">{t('stats.totalPaid')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-green-700">
                            <BadgeTurkishLira className="h-5 w-5" />
                            <div className="text-2xl font-bold">{totalPaid.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600">{t('stats.totalEarned')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-blue-700">
                            <TrendingUp className="h-5 w-5" />
                            <div className="text-2xl font-bold">{totalEarned.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('stats.activeBrokers')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-slate-400" />
                            <div className="text-2xl font-bold">{summary?.length || 0}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Broker List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('table.title')}</CardTitle>
                        <CardDescription>{t('table.desc')}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="px-6">{t('table.brokerInfo')}</TableHead>
                                <TableHead>{t('table.level')}</TableHead>
                                <TableHead className="text-right">{t('table.totalEarned')}</TableHead>
                                <TableHead className="text-right">{t('table.totalPaid')}</TableHead>
                                <TableHead className="text-right">{t('table.balance')}</TableHead>
                                <TableHead className="text-right px-6">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {summary && summary.length > 0 ? (
                                summary.map((broker) => (
                                    <TableRow key={broker.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{broker.name}</span>
                                                <span className="text-xs text-muted-foreground">{broker.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                {broker.level || t('table.status.Standart' as any)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {broker.totalEarned.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                            {broker.totalPaid.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${broker.balance > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                                                {broker.balance.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <Link href={`/admin/broker-finances/${broker.id}`}>
                                                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 font-bold">
                                                    {t('table.details')} <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                        {t('table.empty')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
