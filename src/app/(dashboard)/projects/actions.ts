'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    // getUser also validates the session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        redirect('/login')
    }

    // Get the profile to find tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    console.log('User:', user.email, 'Profile:', profile)

    if (!profile?.tenant_id) {
        console.error('No tenant_id found for user', user.id)
        return { error: 'No tenant associated with user.' }
    }

    const name = formData.get('name') as string
    const city = formData.get('city') as string

    const { error } = await supabase
        .from('projects')
        .insert({
            name,
            city,
            tenant_id: profile.tenant_id
        })

    if (error) {
        console.error('Insert Project Error:', error)
        return { error: 'Failed to create project' }
    }

    revalidatePath('/projects')
    return { success: true }
}
