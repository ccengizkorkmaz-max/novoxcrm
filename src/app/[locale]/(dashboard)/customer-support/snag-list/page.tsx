import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar, AlertTriangle, User, Home, ArrowRight } from 'lucide-react'
import { SnagListDialog } from '../components/SnagListDialog'
import { SnagActions } from '../components/SnagActions'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function SnagListPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const [{ data: { user } }, t] = await Promise.all([
        supabase.auth.getUser(),
        getTranslations('SnagList')
    ])

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Tenant profile not found.</div>

    // Fetch Snag Items
    const { data: snagItems } = await supabase
        .from('snag_items')
        .select(`
            *,
            units(id, unit_number, projects(name)),
            subcontractors(id, name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Fetch Units for Dialog
    const { data: units } = await supabase
        .from('units')
        .select(`
            id,
            unit_number,
            projects(name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('unit_number', { ascending: true })

    // Fetch Subcontractors for Dialog
    const { data: subcontractors } = await supabase
        .from('subcontractors')
        .select('id, name, category')
        .eq('tenant_id', profile.tenant_id)
        .order('name', { ascending: true })

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'Urgent':
                return <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold">{t(`priorities.${priority}`)}</Badge>
            case 'High':
                return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">{t(`priorities.${priority}`)}</Badge>
            case 'Normal':
                return <Badge variant="secondary">{t(`priorities.${priority}`)}</Badge>
            default:
                return <Badge variant="outline">{t(`priorities.${priority}`)}</Badge>
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending':
                return <Badge variant="outline" className="text-slate-500 border-slate-200 bg-slate-50">{t(`statuses.${status}`)}</Badge>
            case 'In Progress':
                return <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50">{t(`statuses.${status}`)}</Badge>
            case 'Repaired':
                return <Badge variant="outline" className="text-amber-600 border-amber-100 bg-amber-50">{t(`statuses.${status}`)}</Badge>
            case 'Verified':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">{t(`statuses.${status}`)}</Badge>
            case 'Cancelled':
                return <Badge variant="outline" className="line-through text-slate-400">{t(`statuses.${status}`)}</Badge>
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
                <SnagListDialog 
                    units={(units || []).map(u => {
                        const proj = Array.isArray(u.projects) ? u.projects[0] : (u.projects as any)
                        return {
                            id: u.id,
                            unit_number: u.unit_number,
                            projects: proj ? { name: proj.name } : null
                        }
                    })} 
                    subcontractors={subcontractors || []} 
                />
            </div>

            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('unit')}</TableHead>
                            <TableHead>{t('defectTitle')}</TableHead>
                            <TableHead>{t('priority')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('subcontractor')}</TableHead>
                            <TableHead className="min-w-[280px]">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {snagItems && snagItems.length > 0 ? (
                            snagItems.map((item) => (
                                <TableRow key={item.id} className={item.status === 'Verified' ? 'opacity-70 bg-slate-50/30' : ''}>
                                    <TableCell className="font-semibold text-slate-800">
                                        <div className="flex flex-col">
                                            <span>{(item.units as any)?.projects?.name}</span>
                                            <span className="text-xs text-muted-foreground font-normal">Daire {(item.units as any)?.unit_number}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col max-w-[320px]">
                                            <span className="font-medium text-slate-900">{item.title}</span>
                                            {item.description && (
                                                <span className="text-xs text-slate-500 truncate mt-0.5">{item.description}</span>
                                            )}
                                            {item.service_request_id && (
                                                <Link 
                                                    href={`/customer-support/${item.service_request_id}`}
                                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 mt-1"
                                                >
                                                    İlişkili Servis Talebi <ArrowRight className="h-2.5 w-2.5" />
                                                </Link>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                            <User className="h-3.5 w-3.5 opacity-60" />
                                            <span>{(item.subcontractors as any)?.name || 'Atanmamış'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <SnagActions
                                            itemId={item.id}
                                            currentStatus={item.status}
                                            currentSubcontractorId={item.subcontractor_id}
                                            subcontractors={subcontractors || []}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <AlertTriangle className="h-10 w-10 opacity-20" />
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
