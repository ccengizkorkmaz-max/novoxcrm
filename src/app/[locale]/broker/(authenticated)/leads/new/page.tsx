import { createClient } from '@/lib/supabase/server'
import NewLeadForm from './components/NewLeadForm'

export default async function NewLeadPage({
    searchParams
}: {
    searchParams: Promise<{ project_id?: string, unit_id?: string }>
}) {
    const { project_id, unit_id } = await searchParams
    const supabase = await createClient()

    // Fetch active projects for the selection dropdown
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')

    // Fetch unit details if unit_id is provided
    let unit = null
    if (unit_id) {
        const { data } = await supabase
            .from('units')
            .select('id, unit_number, block, floor, type, area_gross, price, currency')
            .eq('id', unit_id)
            .single()
        unit = data
    }

    return (
        <NewLeadForm
            projects={projects || []}
            initialProjectId={project_id}
            initialUnit={unit}
        />
    )
}
