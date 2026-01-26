import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import TeamList from './components/TeamList'

export default async function TeamsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Unauthorized</div>

    // Get profile to find tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return <div>No tenant associated with user.</div>

    // Get all teams in tenant
    const { data: teams, error: teamsError } = await supabase
        .from('sales_teams')
        .select(`
            *,
            team_members(
                id,
                role,
                profiles(id, full_name, role)
            ),
            team_project_assignments(
                id,
                projects(id, name)
            )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (teamsError) {
        console.error('Teams fetch error:', teamsError)
    }

    // Get all profiles for member assignment
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('tenant_id', profile.tenant_id)

    // Get all projects for assignment
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)

    // Get all sales to calculate performance
    const { data: allSales } = await supabase
        .from('sales')
        .select('id, assigned_to, status')
        .eq('tenant_id', profile.tenant_id)

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Satış Ekipleri</h1>
                <p className="text-muted-foreground">Ekiplerinizi, bölgelerinizi ve proje atamalarını yönetin.</p>
            </div>

            <TeamList
                teams={teams || []}
                profiles={profiles || []}
                projects={projects || []}
                sales={allSales || []}
            />
        </div>
    )
}
