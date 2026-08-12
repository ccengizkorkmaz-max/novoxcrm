import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RepTrackingTab from '../components/RepTrackingTab'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RepTrackingPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect(`/${locale}/login`)

    const { data: userProfile } = await supabase
        .from('profiles')
        .select('role, tenant_id')
        .eq('id', user.id)
        .single()

    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'owner'
    const userTenantId = userProfile?.tenant_id

    // Only Basic CRM admins can access
    const { data: tenantData } = userTenantId
        ? await supabase.from('tenants').select('crm_mode, tenant_type').eq('id', userTenantId).single()
        : { data: null }

    const isAdvanceMode = (tenantData as any)?.crm_mode === 'advance'
    const isBroker = (tenantData as any)?.tenant_type === 'broker'

    if (!isAdmin || isAdvanceMode || isBroker) {
        redirect(`/${locale}/crm`)
    }

    // Fetch all profiles (internal only) and all assigned sales
    const [profilesRes, salesRes, projectsRes] = await Promise.all([
        supabase.from('profiles')
            .select('id, full_name, is_external')
            .eq('tenant_id', userTenantId)
            .not('full_name', 'is', null)
            .neq('full_name', '')
            .neq('full_name', '1')
            .eq('is_active', true)
            .or('is_external.is.null,is_external.eq.false')
            .in('role', ['admin', 'owner', 'manager', 'sales'])
            .order('full_name'),
        supabase.from('sales')
            .select('*, customers!inner(id, full_name, phone, customer_number), units(projects(name)), projects(name), profiles(full_name, is_external)')
            .neq('status', 'Inbox')
            .order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(2000),
        supabase.from('projects').select('id, name').order('name'),
    ])

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center px-1 py-2 gap-3">
                <h1 className="text-xl font-bold tracking-tight">Temsilci Takip</h1>
                <a
                    href={`/${locale}/crm`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                    ← Satış Listesine Dön
                </a>
            </div>
            <RepTrackingTab
                sales={salesRes.data || []}
                profiles={profilesRes.data || []}
                projects={projectsRes.data || []}
            />
        </div>
    )
}
