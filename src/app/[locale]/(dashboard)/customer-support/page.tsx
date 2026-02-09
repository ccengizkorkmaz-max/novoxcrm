import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Clock, User, Building2 } from "lucide-react"
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function TenantSupportListing(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('ServiceRequests')
    const { data: { user } } = await supabase.auth.getUser()

    // Get staff profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    // Get all requests for this tenant
    const { data: requests } = await supabase
        .from('service_requests')
        .select('*, customers(full_name)')
        .eq('tenant_id', profile?.tenant_id)
        .order('created_at', { ascending: false })

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'Open': return t('status.open')
            case 'In Progress': return t('status.inProgress')
            case 'Resolved': return t('status.resolved')
            case 'Closed': return t('status.closed')
            default: return status
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                <p className="text-slate-500">{t('subtitle')}</p>
            </div>

            <div className="grid gap-4">
                {requests?.map((req) => (
                    <Link key={req.id} href={`/customer-support/${req.id}`}>
                        <Card className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer group">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                                            {req.title}
                                        </CardTitle>
                                        <Badge variant={req.status === 'Resolved' ? 'default' : 'outline'} className={req.status === 'Resolved' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-blue-600 border-blue-100 bg-blue-50'}>
                                            {getStatusLabel(req.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {req.customers?.full_name || t('detail.unknownCustomer')}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(req.created_at).toLocaleDateString('tr-TR')}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <MessageSquare className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                    {req.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {(!requests || requests.length === 0) && (
                    <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed text-slate-400">
                        <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                        <p>{t('empty.title')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
