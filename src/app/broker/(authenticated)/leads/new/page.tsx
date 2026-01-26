import { createClient } from '@/lib/supabase/server'
import NewLeadForm from './components/NewLeadForm'

export default async function NewLeadPage() {
    const supabase = await createClient()

    // Fetch active projects for the selection dropdown
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')

    return <NewLeadForm projects={projects || []} />
}
