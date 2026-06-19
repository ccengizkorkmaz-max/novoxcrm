import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CampaignDetail } from '../../components/CampaignDetail'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()
    const { data: campaign } = await adminSupabase
        .from('email_campaigns')
        .select('*, email_templates(name), outreach_segments(name)')
        .eq('id', id)
        .single()

    if (!campaign) redirect('/email')

    return <CampaignDetail campaign={campaign} />
}
