import { createClient } from '@/lib/supabase/server'
import CampaignForm from './components/CampaignForm'

export default async function NewCampaignPage() {
    const supabase = await createClient()

    // Fetch active projects for the selection dropdown
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

    return <CampaignForm projects={projects || []} tenantId={profile?.tenant_id || ''} />
}
