import { createClient } from '@/lib/supabase/server'
import CampaignEditForm from './components/CampaignEditForm'
import { getIncentiveCampaign } from '@/app/broker/actions'
import { notFound } from 'next/navigation'

export default async function EditCampaignPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params
    const supabase = await createClient()

    // Fetch active projects for the selection dropdown
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')

    const campaign = await getIncentiveCampaign(params.id)

    if (!campaign) {
        notFound()
    }

    return <CampaignEditForm projects={projects || []} campaign={campaign} />
}
