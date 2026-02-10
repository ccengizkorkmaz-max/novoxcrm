import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, Download, Upload, Info } from "lucide-react"
import { formatCurrency } from '@/lib/utils'
import { getTranslations } from 'next-intl/server'

export default async function PortalFinancials(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('PortalFinancials')
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id')
        .eq('id', user?.id)
        .single()

    // Get payments across all contracts
    const { data: payments } = await supabase
        .from('payment_items')
        .select(`
            *,
            payment_plans!inner(
                contract_id,
                contracts!inner(
                    sales!inner(
                        customer_id,
                        units!inner(unit_number, projects!inner(name))
                    )
                )
            )
        `)
        .eq('payment_plans.contracts.sales.customer_id', profile?.customer_id)
        .order('due_date', { ascending: true })

    const totalPaid = payments?.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.amount), 0) || 0
    const totalPending = payments?.filter(p => p.status === 'Pending').reduce((sum, p) => sum + Number(p.amount), 0) || 0

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Upload className="h-4 w-4" />
                    {t('uploadReceipt')}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-emerald-50 border-emerald-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-emerald-700 font-medium">{t('totalPaid')}</CardDescription>
                        <CardTitle className="text-3xl text-emerald-900">{formatCurrency(totalPaid)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-none shadow-sm bg-amber-50 border-amber-100">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-700 font-medium">{t('remainingDebt')}</CardDescription>
                        <CardTitle className="text-3xl text-amber-900">{formatCurrency(totalPending)}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Card className="border-none shadow-sm">
                <CardHeader>
                    <CardTitle>{t('paymentPlan')}</CardTitle>
                    <CardDescription>{t('paymentPlanDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('table.projectUnit')}</TableHead>
                                <TableHead>{t('table.dueDate')}</TableHead>
                                <TableHead>{t('table.amount')}</TableHead>
                                <TableHead>{t('table.status')}</TableHead>
                                <TableHead className="text-right">{t('table.action')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">
                                                {item.payment_plans.contracts.sales.units.projects.name}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                No: {item.payment_plans.contracts.sales.units.unit_number}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{new Date(item.due_date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={item.status === 'Paid' ? 'default' : 'outline'}
                                            className={item.status === 'Paid' ? 'bg-emerald-500 hover:bg-emerald-600 border-none' : 'text-amber-600 border-amber-200 bg-amber-50'}
                                        >
                                            {item.status === 'Paid' ? t('status.paid') : t('status.pending')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {item.status === 'Paid' ? (
                                            <Button variant="ghost" size="sm" className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                <Download className="h-4 w-4" />
                                                {t('table.receipt')}
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" className="gap-2 text-slate-400">
                                                <Info className="h-4 w-4" />
                                                {t('table.detail')}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!payments || payments.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
