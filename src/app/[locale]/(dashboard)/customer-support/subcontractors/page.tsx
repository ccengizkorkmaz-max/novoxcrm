import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, User, Briefcase } from 'lucide-react'
import { SubcontractorDialog } from '../components/SubcontractorDialog'
import { DeleteSubcontractorButton } from '../components/DeleteSubcontractorButton'
import { getTranslations } from 'next-intl/server'

export default async function SubcontractorsPage() {
    const supabase = await createClient()

    const [{ data: { user } }, t] = await Promise.all([
        supabase.auth.getUser(),
        getTranslations('Subcontractors')
    ])

    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>Tenant profile not found.</div>

    // Fetch subcontractors
    const { data: subcontractors } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('name', { ascending: true })

    const getCategoryLabel = (category: string) => {
        switch (category) {
            case 'Plumbing': return t('categories.Plumbing')
            case 'Electrical': return t('categories.Electrical')
            case 'Paint': return t('categories.Paint')
            case 'Carpentry': return t('categories.Carpentry')
            case 'Zemin': return t('categories.Zemin')
            case 'HVAC': return t('categories.HVAC')
            default: return t('categories.Other')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                    <p className="text-slate-500">{t('subtitle')}</p>
                </div>
                <SubcontractorDialog mode="create" />
            </div>

            <div className="rounded-md border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('name')}</TableHead>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead>{t('contactName')}</TableHead>
                            <TableHead>{t('phone')}</TableHead>
                            <TableHead>{t('email')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subcontractors && subcontractors.length > 0 ? (
                            subcontractors.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell className="font-semibold text-slate-800">
                                        {sub.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/50">
                                            {getCategoryLabel(sub.category)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <User className="h-4 w-4 opacity-70" />
                                            <span>{sub.contact_name || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sub.phone ? (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone className="h-4 w-4 opacity-70" />
                                                <span>{sub.phone}</span>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {sub.email ? (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Mail className="h-4 w-4 opacity-70" />
                                                <span className="truncate max-w-[180px]">{sub.email}</span>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <SubcontractorDialog mode="edit" subcontractor={sub} />
                                            <DeleteSubcontractorButton id={sub.id} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-48 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <Briefcase className="h-10 w-10 opacity-20" />
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
