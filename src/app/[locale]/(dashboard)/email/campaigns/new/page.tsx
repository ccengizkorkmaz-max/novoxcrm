import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewCampaignForm } from '../../components/NewCampaignForm'

export default async function NewCampaignPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return <NewCampaignForm />
}
