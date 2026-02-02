'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

async function getProfile() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
    return profile
}

export async function createTeam(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const region = formData.get('region') as string
    const office_name = formData.get('office_name') as string

    const { data: team, error } = await supabase
        .from('sales_teams')
        .insert({
            name,
            description,
            region,
            office_name,
            tenant_id: profile.tenant_id
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/teams')
    return { success: true, team }
}

export async function updateTeam(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const region = formData.get('region') as string
    const office_name = formData.get('office_name') as string

    const { error } = await supabase
        .from('sales_teams')
        .update({ name, description, region, office_name })
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }

    revalidatePath('/teams')
    return { success: true }
}

export async function deleteTeam(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const id = formData.get('id') as string

    const { error } = await supabase
        .from('sales_teams')
        .delete()
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { error: error.message }

    revalidatePath('/teams')
    return { success: true }
}

export async function addMemberToTeam(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const team_id = formData.get('team_id') as string
    const profile_id = formData.get('profile_id') as string
    const role = formData.get('role') as string || 'member'

    const { error } = await supabase
        .from('team_members')
        .insert({ team_id, profile_id, role })

    if (error) return { error: error.message }

    revalidatePath('/teams')
    return { success: true }
}

export async function removeMemberFromTeam(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const team_id = formData.get('team_id') as string
    const profile_id = formData.get('profile_id') as string

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team_id)
        .eq('profile_id', profile_id)

    if (error) return { error: error.message }

    revalidatePath('/teams')
    return { success: true }
}

export async function assignTeamToProject(formData: FormData) {
    const supabase = await createClient()
    const profile = await getProfile()
    if (!profile?.tenant_id) return { error: 'Unauthorized' }

    const team_id = formData.get('team_id') as string
    const project_id = formData.get('project_id') as string

    const { error } = await supabase
        .from('team_project_assignments')
        .insert({ team_id, project_id })

    if (error) return { error: error.message }

    revalidatePath('/teams')
    revalidatePath(`/projects/${project_id}`)
    return { success: true }
}
