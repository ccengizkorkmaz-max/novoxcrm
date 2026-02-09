
import { getBrokerFinanceDetail } from '@/app/broker/finance-actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    ChevronLeft,
    HandCoins,
    Clock,
    CheckCircle2,
    TrendingUp,
    ArrowUpRight,
    BadgeTurkishLira,
    PlusCircle,
    Building2,
    Calendar,
    Zap
} from "lucide-react"
import Link from 'next/link'
import RecordPaymentDialog from '../components/RecordPaymentDialog'
import { createClient } from '@/lib/supabase/server'
import { BackButton } from '@/components/back-button'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function BrokerFinanceDetailPage(props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    const finance = await getBrokerFinanceDetail(id)
    const t = await getTranslations('BrokerFinances')
    const locale = await getLocale()

    // Get broker name for header
    const supabase = await createClient()
    const { data: broker } = await supabase.from('profiles').select('full_name, email').eq('id', id).single()

    const totalCommissions = finance.commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalIncentives = finance.incentives.reduce((sum, i) => sum + Number(i.amount), 0)
    const totalEarned = totalCommissions + totalIncentives
    const totalPaid = finance.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balance = totalEarned - totalPaid

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <BackButton className="h-8 w-8 p-0 rounded-full border border-slate-200" label="" />
                    <div>
                        <h1 className="text-xl font-bold">{broker?.full_name}</h1>
                        <p className="text-xs text-muted-foreground">{broker?.email}</p>
                    </div>
                </div>
                <RecordPaymentDialog
                    brokerId={id}
                    unpaidItems={[
                        ...finance.commissions.filter(c => c.status !== 'Paid').map(c => ({ id: c.id, type: 'commission' as const, label: `${c.broker_leads.full_name} Satışı`, amount: Number(c.amount) })),
                        ...finance.incentives.filter(i => i.status !== 'Paid').map(i => ({ id: i.id, type: 'incentive' as const, label: i.campaign_id?.name || t('details.incentive'), amount: Number(i.amount) }))
                    ]}
                />
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('stats.totalEarned')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{totalEarned.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        <p className="text-[10px] text-slate-400 mt-1">{t('details.commissions')}: {totalCommissions.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-green-600">{t('table.totalPaid')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-green-700">{totalPaid.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        <p className="text-[10px] text-green-600/60 mt-1">{t('stats.countPaymentRecords', { count: finance.payments.length })}</p>
                    </CardContent>
                </Card>
                <Card className="bg-blue-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-blue-200">{t('table.balance')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{balance.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} ₺</div>
                        <p className="text-[10px] text-blue-200/60 mt-1">{t('stats.toPay')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('stats.activeProcesses')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{t('stats.activeCount', { count: finance.commissions.filter(c => c.status !== 'Paid').length })}</div>
                        <p className="text-[10px] text-slate-400 mt-1">{t('stats.salesAndIncentives')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Tables Column (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Commissions Table */}
                    <Card>
                        <CardHeader className="px-6 py-4 border-b border-slate-50">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <HandCoins className="h-4 w-4 text-blue-500" />
                                {t('details.commissions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <FinanceTable items={finance.commissions} type="commission" t={t} locale={locale} />
                        </CardContent>
                    </Card>

                    {/* Incentives Table */}
                    <Card>
                        <CardHeader className="px-6 py-4 border-b border-slate-50">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Zap className="h-4 w-4 text-orange-500" />
                                {t('details.incentives')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <FinanceTable items={finance.incentives} type="incentive" t={t} locale={locale} />
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Payment History) */}
                <Card className="h-fit">
                    <CardHeader className="px-6 py-4 border-b border-slate-50">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <BadgeTurkishLira className="h-4 w-4 text-green-600" />
                            {t('details.paymentHistory')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {finance.payments.length > 0 ? (
                            finance.payments.map((payment) => (
                                <div key={payment.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 group hover:border-slate-200 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-slate-900">{payment.amount.toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} {payment.currency}</p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(payment.payment_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                                            </p>
                                        </div>
                                        <span className="text-[9px] font-black uppercase text-slate-400 border px-1.5 py-0.5 rounded">
                                            {payment.payment_method}
                                        </span>
                                    </div>
                                    {payment.reference_no && (
                                        <p className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100 truncate">
                                            Ref: {payment.reference_no}
                                        </p>
                                    )}
                                    {payment.notes && (
                                        <p className="text-[10px] text-slate-400 italic mt-2 line-clamp-2">
                                            "{payment.notes}"
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-slate-400 border border-dashed rounded-xl">
                                <p className="text-xs italic">{t('details.noPayments')}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function FinanceTable({ items, type, t, locale }: { items: any[], type: 'commission' | 'incentive', t: any, locale: string }) {
    return (
        <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/50">
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 px-6">{t('table.headers.detail')}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">{t('table.headers.date')}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">{t('table.headers.amount')}</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">{t('table.headers.status')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length > 0 ? (
                    items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-slate-700">
                                        {type === 'commission' ? item.broker_leads?.full_name : item.campaign_id?.name || t('details.earnedIncentive')}
                                    </span>
                                    {item.description && <span className="text-[10px] text-muted-foreground">{item.description}</span>}
                                </div>
                            </TableCell>
                            <TableCell className="text-[11px] text-slate-500">
                                {new Date(item.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs">
                                {Number(item.amount).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US')} {item.currency}
                            </TableCell>
                            <TableCell className="text-right">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${item.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                    item.status === 'Approved' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {item.status === 'Paid' ? t('table.status.Paid') : item.status === 'Eligible' ? t('table.status.Eligible') : item.status === 'Approved' ? t('table.status.Approved') : item.status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-slate-300 italic text-xs">
                            {t('table.noRecords')}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}
