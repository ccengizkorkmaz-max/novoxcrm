import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Home, CreditCard, Calendar, Clock, ChevronRight, FileText } from "lucide-react"
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function PortalDashboard(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const t = await getTranslations('CustomerPortal.dashboard')
    // const locale = await getLocale() // No longer needed as we get it from params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get customer profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('customer_id, full_name')
        .eq('id', user?.id)
        .single()

    // Get contracts for this customer via contract_customers link
    const { data: contracts } = await supabase
        .from('contracts')
        .select(`
            *,
            contract_customers!inner(customer_id),
            unit: units(
                *,
                projects(*)
            )
        `)
        .eq('contract_customers.customer_id', profile?.customer_id)

    // Calculate totals for next payment
    // 1. Get payment plans for these contracts
    const { data: plans } = await supabase
        .from('payment_plans')
        .select('id')
        .in('contract_id', contracts?.map(c => c.id) || [])

    // 2. Get next pending payment item for these plans
    const { data: payments } = await supabase
        .from('payment_items')
        .select('*')
        .in('payment_plan_id', plans?.map(p => p.id) || [])
        .eq('status', 'Pending')
        .order('due_date', { ascending: true })
        .limit(1)

    const nextPayment = payments?.[0]

    const translateDeliveryStatus = (status: string) => {
        const map: Record<string, string> = {
            'Pending': t('recentPayments.status.pending'),
            'In Progress': t('recentPayments.status.pending'), // Reusing pending or add new key if needed
            'Ready': t('recentPayments.status.paid'), // Example mapping
            'Delivered': t('projectStatus.completed')
        }
        // Use more specific keys if created, currently mapping to available ones or hardcoded fallback if missing
        // Better to use dedicated keys for delivery status
        return map[status] || status
    }

    const getDeliveryProgress = (status: string) => {
        const map: Record<string, number> = {
            'Pending': 25,
            'In Progress': 50,
            'Ready': 90,
            'Delivered': 100
        }
        return map[status] || 0
    }

    const translateTitleDeedStatus = (status: string) => {
        // Mock translation using existing keys or raw values for now if specific keys missing
        return status
    }

    const getTitleDeedProgress = (status: string) => {
        const map: Record<string, number> = {
            'Pending': 20,
            'In Progress': 60,
            'Ready': 90,
            'Handed Over': 100
        }
        return map[status] || 0
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}, {profile?.full_name}</h1>
                <p className="text-slate-500">{t('overview')}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-none shadow-sm bg-blue-600 text-white">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-blue-100">{t('cards.nextPayment')}</CardDescription>
                        <CardTitle className="text-3xl">
                            {nextPayment ? formatCurrency(nextPayment.amount) : '0 ₺'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-blue-100">
                            <Calendar className="h-4 w-4" />
                            {nextPayment
                                ? new Date(nextPayment.due_date).toLocaleDateString(locale)
                                : '-'}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('cards.activePropertyCount')}</CardDescription>
                        <CardTitle className="text-3xl text-slate-900">{contracts?.length || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Building2 className="h-4 w-4" />
                            {t('cards.guaranteedByNovoCrm')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('cards.delivery')}</CardDescription>
                        <CardTitle className="text-3xl text-slate-900">
                            {contracts?.[0]?.delivery_status || '-'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{t('cards.progress')}</span>
                                <span>{getDeliveryProgress(contracts?.[0]?.delivery_status)}%</span>
                            </div>
                            <Progress value={getDeliveryProgress(contracts?.[0]?.delivery_status)} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm overflow-hidden border-l-4 border-emerald-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription className="text-emerald-700 font-medium">{t('cards.requests')}</CardDescription>
                            <FileText className="h-4 w-4 text-emerald-500" />
                        </div>
                        <CardTitle className="text-2xl text-slate-900">
                            {contracts?.[0]?.title_deed_status || '-'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500">{t('overview')}</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100">
                                    {contracts?.[0]?.title_deed_status === 'Handed Over' ? t('projectStatus.completed') : '...'}
                                </Badge>
                            </div>
                            <Progress value={getTitleDeedProgress(contracts?.[0]?.title_deed_status)} className="h-2 bg-slate-100 [&>div]:bg-emerald-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>{t('cards.progress')}</CardDescription>
                        <CardTitle className="text-2xl text-slate-900">{t('overview')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{t('projectStatus.title')}</span>
                                <span>%85</span>
                            </div>
                            <Progress value={85} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('myProperties')}</CardTitle>
                            <CardDescription>{t('ownedUnitsDesc')}</CardDescription>
                        </div>
                        <Home className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {contracts?.map((contract) => (
                            <div key={contract.id} className="flex items-center justify-between p-4 rounded-xl border group hover:border-blue-200 hover:bg-blue-50/50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="bg-slate-100 p-2.5 rounded-lg group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">{contract.unit?.projects?.name}</p>
                                        <p className="text-xs text-slate-500">No: {contract.unit?.unit_number} | {contract.unit?.type}</p>
                                    </div>
                                </div>
                                <Link href="/customerservices/tracking" className="p-2 rounded-full hover:bg-blue-100 text-slate-400 hover:text-blue-600">
                                    <ChevronRight className="h-5 w-5" />
                                </Link>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{t('recentPayments.title')}</CardTitle>
                            <CardDescription>{t('overview')}</CardDescription>
                        </div>
                        <Clock className="h-5 w-5 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                <div>
                                    <p className="text-sm font-medium">{t('recentPayments.contractRevised')}</p>
                                    <p className="text-xs text-slate-500">{t('recentPayments.daysAgo', { days: 2 })}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="mt-1 h-2 w-2 rounded-full bg-slate-300" />
                                <div>
                                    <p className="text-sm font-medium">{t('recentPayments.paymentApproved')}: 50.000 TL</p>
                                    <p className="text-xs text-slate-500">{t('recentPayments.daysAgo', { days: 5 })}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
