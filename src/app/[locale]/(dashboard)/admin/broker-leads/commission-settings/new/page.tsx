import { createClient } from '@/lib/supabase/server'
import CommissionModelForm from './components/CommissionModelForm'

export default async function NewCommissionModelPage() {
    const supabase = await createClient()

    // Fetch active projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    return (
        <CommissionModelForm
            projects={projects || []}
            tenantId={profile?.tenant_id || ''}
        />
    )
}
