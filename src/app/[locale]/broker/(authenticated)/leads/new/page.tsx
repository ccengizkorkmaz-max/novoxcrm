import { createClient } from '@/lib/supabase/server'
import NewLeadForm from './components/NewLeadForm'

export default async function NewLeadPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ project_id?: string, unit_id?: string }>
}) {
    const { locale } = await props.params
    const { project_id, unit_id } = await props.searchParams
    const supabase = await createClient()

    // Fetch active projects for the selection dropdown
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('status', 'Active')

    // Fetch all available units
    const { data: units } = await supabase
        .from('units')
        .select('id, project_id, unit_number, block, floor, type, area_gross, price, currency')
        .in('status', ['For Sale', 'Available'])

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
            allUnits={units || []}
            initialProjectId={project_id}
            initialUnit={unit}
        />
    )
}
