import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Phone, CheckCircle, Home } from 'lucide-react'
import { ScheduleDeliveryDialog } from '../components/ScheduleDeliveryDialog'
import { CompleteDeliveryDialog } from '../components/CompleteDeliveryDialog'
import { getTranslations } from 'next-intl/server'

export default async function DeliveriesPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const [{ data: { user } }, t] = await Promise.all([
        supabase.auth.getUser(),
        getTranslations('Deliveries')
    ])

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Tenant profile not found.</div>

    // Fetch delivery appointments
    const { data: appointments } = await supabase
        .from('delivery_appointments')
        .select(`
            *,
            units(id, unit_number, projects(name)),
            customers(id, full_name, phone)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('appointment_date', { ascending: false })

    // Fetch sold units (ready for handover)
    // We select units that have sales with status 'Sold' or 'ContractSigned'
    const { data: readyUnits } = await supabase
        .from('units')
        .select(`
            id,
            unit_number,
            projects(name),
            sales(
                id,
                status,
                customers(id, full_name)
            )
        `)
        .eq('tenant_id', profile.tenant_id)

    // Filter units that have at least one sale which is Sold or ContractSigned
    const soldUnits = (readyUnits || [])
        .filter(u => u.sales && u.sales.some(s => s.status === 'Sold' || s.status === 'ContractSigned'))
        .map(u => {
            const proj = Array.isArray(u.projects) ? u.projects[0] : (u.projects as any)
            const saleList = (u.sales || []).map(s => {
                const cust = Array.isArray(s.customers) ? s.customers[0] : (s.customers as any)
                return {
                    customers: cust ? { id: cust.id, full_name: cust.full_name } : null
                }
            })
            return {
                id: u.id,
                unit_number: u.unit_number,
                projects: proj ? { name: proj.name } : null,
                sales: saleList
            }
        })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Scheduled':
                return <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50">{t(`statuses.${status}`)}</Badge>
            case 'Completed':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">{t(`statuses.${status}`)}</Badge>
            case 'Cancelled':
                return <Badge variant="outline" className="text-red-600 border-red-100 bg-red-50">{t(`statuses.${status}`)}</Badge>
            case 'No Show':
                return <Badge variant="outline" className="text-amber-600 border-amber-100 bg-amber-50">{t(`statuses.${status}`)}</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
                <ScheduleDeliveryDialog units={soldUnits} />
            </div>

            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('unit')}</TableHead>
                            <TableHead>Müşteri</TableHead>
                            <TableHead>{t('appointmentDate')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('notes')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments && appointments.length > 0 ? (
                            appointments.map((app) => (
                                <TableRow key={app.id}>
                                    <TableCell className="font-semibold text-slate-800">
                                        <div className="flex flex-col">
                                            <span>{(app.units as any)?.projects?.name}</span>
                                            <span className="text-xs text-muted-foreground font-normal">Daire {(app.units as any)?.unit_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{(app.customers as any)?.full_name}</span>
                                            {(app.customers as any)?.phone && (
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Phone className="h-3 w-3" /> {(app.customers as any)?.phone}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                            <Calendar className="h-4 w-4 opacity-70" />
                                            <span>
                                                {new Date(app.appointment_date).toLocaleString(locale === 'tr' ? 'tr-TR' : 'en-US', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-slate-600">
                                        {app.notes || '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <CompleteDeliveryDialog appointment={app as any} />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <CheckCircle className="h-10 w-10 opacity-20" />
                                        <p>{t('empty')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
