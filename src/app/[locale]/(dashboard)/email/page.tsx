import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { EmailDashboard } from './components/EmailDashboard'

export default async function EmailPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    const isManager = ['manager', 'owner', 'admin'].includes(profile.role || '')
    if (!isManager) redirect('/')

    return <EmailDashboard tenantId={profile.tenant_id} />
}
