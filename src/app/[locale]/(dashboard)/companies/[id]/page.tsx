import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CompanyForm from '../components/CompanyForm'

interface CompanyPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function CompanyPage({ params }: CompanyPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // CRM mode control: only advance mode has companies page
    const { data: tenant } = await supabase
        .from('tenants')
        .select('crm_mode')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.crm_mode !== 'advance') {
        redirect('/crm')
    }

    let company = null

    if (id !== 'new') {
        const { data: dbCompany, error } = await supabase
            .from('companies')
            .select('*, addresses:customer_addresses(*)')
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)
            .maybeSingle()

        if (error || !dbCompany) {
            notFound()
        }
        company = dbCompany
    }

    return (
        <div className="p-4 sm:p-6 bg-slate-50/30 min-h-screen">
            <CompanyForm company={company} />
        </div>
    )
}
