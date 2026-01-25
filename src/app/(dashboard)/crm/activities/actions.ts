'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createActivity(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const customer_id = formData.get('customer_id') as string
    const topic = formData.get('topic') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const description = formData.get('description') as string
    const due_date = formData.get('due_date') as string
    const notes = formData.get('notes') as string
    const owner_id = formData.get('owner_id') as string || user.id
    const project_id = formData.get('project_id') as string
    const unit_id = formData.get('unit_id') as string

    const { error } = await supabase
        .from('activities')
        .insert({
            tenant_id: profile?.tenant_id,
            customer_id,
            user_id: user.id, // Creator
            owner_id: owner_id, // Assignee/Owner
            assigned_by_id: user.id,
            topic: topic || 'General',
            type,
            summary,
            description,
            due_date: due_date ? new Date(due_date).toISOString() : null,
            notes,
            project_id: project_id || null,
            unit_id: unit_id || null,
            status: 'Planned'
        })

    if (error) {
        console.error('Create Activity Error:', error)
        return { error: 'Failed to create activity' }
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function updateActivity(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { error } = await supabase
        .from('activities')
        .update({
            summary: formData.get('summary') as string,
            description: formData.get('description') as string,
            due_date: formData.get('due_date') ? new Date(formData.get('due_date') as string).toISOString() : null,
            type: formData.get('type') as string,
            topic: formData.get('topic') as string,
            notes: formData.get('notes') as string,
            owner_id: formData.get('owner_id') as string
        })
        .eq('id', id)

    if (error) return { error: 'Failed to update activity' }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function outcomeActivity(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    const id = formData.get('id') as string
    const outcome = formData.get('outcome') as string
    const notes = formData.get('notes') as string

    // Complete the current activity
    const { error: updateError } = await supabase
        .from('activities')
        .update({
            status: 'Completed',
            outcome,
            completed_at: new Date().toISOString(),
            done_at: new Date().toISOString(),
            notes: notes // Append or overwrite? Using overwrite for MVP simpler form
        })
        .eq('id', id)

    if (updateError) return { error: 'Failed to complete activity' }

    // Check for next action
    const next_action_type = formData.get('next_action_type') as string
    const next_action_date = formData.get('next_action_date') as string
    const next_action_summary = formData.get('next_action_summary') as string

    if (next_action_type && next_action_date) {
        // Fetch context from original activity
        const { data: original } = await supabase.from('activities').select('customer_id, project_id, unit_id, owner_id').eq('id', id).single()

        if (original) {
            await supabase.from('activities').insert({
                tenant_id: profile?.tenant_id,
                customer_id: original.customer_id,
                user_id: user?.id,
                owner_id: original.owner_id, // Keep same owner
                assigned_by_id: user?.id,
                type: next_action_type,
                summary: next_action_summary || `Follow up: ${next_action_type}`,
                due_date: new Date(next_action_date).toISOString(),
                project_id: original.project_id,
                unit_id: original.unit_id,
                previous_activity_id: id, // Link to original
                status: 'Planned'
            })
        }
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function deleteActivity(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('activities').delete().eq('id', id)

    if (error) return { error: 'Failed to delete' }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function completeActivity(formData: FormData) {
    // Backward compatibility wrapper or simple completion
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { error } = await supabase
        .from('activities')
        .update({
            status: 'Completed',
            completed_at: new Date().toISOString(),
            done_at: new Date().toISOString(),
            outcome: 'Success' // Default outcome
        })
        .eq('id', id)

    if (error) return { error: 'Failed to complete activity' }
    revalidatePath('/crm')
    revalidatePath('/activities')
    return { success: true }
}
