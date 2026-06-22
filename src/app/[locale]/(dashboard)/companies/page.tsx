import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CompaniesPageClient from './companies-client'

export default async function CompaniesPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // CRM mod kontrolü — sadece advance modda
    const { data: tenant } = await supabase
        .from('tenants')
        .select('crm_mode')
        .eq('id', profile.tenant_id)
        .single()

    if (tenant?.crm_mode !== 'advance') {
        redirect('/crm')
    }

    const { data: companies } = await supabase
        .from('companies')
        .select('*, customers(count)')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(200)

    return (
        <CompaniesPageClient
            companies={companies || []}
            userRole={profile.role || 'user'}
        />
    )
}
