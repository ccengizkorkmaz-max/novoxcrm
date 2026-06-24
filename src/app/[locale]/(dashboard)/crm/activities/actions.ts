'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createNotification } from '@/lib/notifications/create'

export async function createActivity(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id, full_name').eq('id', user.id).single()

    const customer_id_raw = (formData.get('customer_id') as string) || (formData.get('customer_id_select') as string)
    const customer_id = customer_id_raw && customer_id_raw.trim() !== '' ? customer_id_raw : null
    const lead_id_raw = formData.get('lead_id') as string
    const lead_id = lead_id_raw && lead_id_raw.trim() !== '' ? lead_id_raw : null
    const topic = formData.get('topic') as string
    const type = formData.get('type') as string
    const summary = formData.get('summary') as string
    const description = formData.get('description') as string
    const due_date = formData.get('due_date') as string
    const notes = formData.get('notes') as string
    const owner_id = formData.get('owner_id') as string || user.id
    const project_id = formData.get('project_id') as string
    const unit_id = formData.get('unit_id') as string
    const priority = formData.get('priority') as string || 'Medium'
    const reminder_at = formData.get('reminder_at') as string

    // Check if due_date is "now" (within last 5 minutes or next 5 minutes)
    let isAutoCompleted = false
    if (due_date) {
        const actDate = new Date(due_date)
        const now = new Date()
        const diffInMinutes = (actDate.getTime() - now.getTime()) / 1000 / 60
        // If the date is in the past or very near future (e.g. within 5 mins)
        if (Math.abs(diffInMinutes) <= 5 || diffInMinutes < 0) {
            isAutoCompleted = true
        }
    }

    const explicitStatus = formData.get('status') as string
    const status = explicitStatus || (isAutoCompleted ? 'Completed' : 'Planned')

    const explicitOutcome = formData.get('outcome') as string
    const outcome = explicitOutcome || (status === 'Completed' ? (isAutoCompleted ? 'Success' : null) : null)

    const next_action_type = formData.get('next_action_type') as string
    const next_action_date = formData.get('next_action_date') as string

    const { data: newAct, error } = await supabase
        .from('activities')
        .insert({
            tenant_id: profile?.tenant_id,
            customer_id,
            lead_id,
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
            priority,
            reminder_at: reminder_at ? new Date(reminder_at).toISOString() : null,
            status,
            completed_at: status === 'Completed' ? new Date().toISOString() : null,
            done_at: status === 'Completed' ? new Date().toISOString() : null,
            outcome,
            next_action_type: next_action_type || null,
            next_action_date: next_action_date ? new Date(next_action_date).toISOString() : null
        })
        .select('id')
        .single()

    if (error) {
        console.error('Create Activity Error:', error)
        return { error: `Geri bildirim: ${error.message} (Kod: ${error.code})` }
    }

    // Auto-create next action if status is Completed
    if (newAct && status === 'Completed') {
        const next_action_summary = formData.get('next_action_summary') as string

        if (next_action_type && next_action_date) {
            const { error: nextActionError } = await supabase
                .from('activities')
                .insert({
                    tenant_id: profile?.tenant_id,
                    customer_id,
                    lead_id,
                    user_id: user.id,
                    owner_id: owner_id,
                    assigned_by_id: user.id,
                    type: next_action_type,
                    summary: next_action_summary || `Follow up: ${next_action_type}`,
                    due_date: new Date(next_action_date).toISOString(),
                    project_id: project_id || null,
                    unit_id: unit_id || null,
                    previous_activity_id: newAct.id,
                    status: 'Planned'
                })
            
            if (nextActionError) {
                console.error('Failed to create next action activity from createActivity:', nextActionError)
            }
        }
    }

    // 4. Send Notification (Always send to the assignee)
    if (owner_id && profile?.tenant_id) {
        const isSelf = owner_id === user.id
        createNotification({
            tenant_id: profile.tenant_id,
            user_id: owner_id,
            type: 'Info',
            category: 'CRM',
            title: isSelf ? '📌 Not Alındı' : '🎯 Yeni Görev Atandı',
            message: isSelf
                ? `Kendi ajandanıza yeni bir görev eklediniz: ${summary}`
                : `${profile.full_name || 'Bir çalışma arkadaşınız'} size yeni bir görev atadı: ${summary}`,
            link: '/activities'
        }).catch(console.error)
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function updateActivity(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { data: existingAct } = await supabase
        .from('activities')
        .select('status')
        .eq('id', id)
        .single()

    if (existingAct && (existingAct.status === 'Completed' || existingAct.status === 'Cancelled')) {
        return { error: 'Tamamlanmış veya İptal edilmiş aktiviteler güncellenemez.' }
    }

    const status = formData.get('status') as string

    const { error } = await supabase
        .from('activities')
        .update({
            summary: formData.get('summary') as string,
            description: formData.get('description') as string,
            due_date: formData.get('due_date') ? new Date(formData.get('due_date') as string).toISOString() : null,
            type: formData.get('type') as string,
            topic: formData.get('topic') as string,
            notes: formData.get('notes') as string,
            owner_id: (formData.get('owner_id') as string)?.trim() !== '' ? formData.get('owner_id') as string : null,
            project_id: (formData.get('project_id') as string)?.trim() !== '' ? formData.get('project_id') as string : null,
            priority: formData.get('priority') as string,
            status: status || undefined,
            completed_at: status === 'Completed' ? new Date().toISOString() : undefined,
            done_at: status === 'Completed' ? new Date().toISOString() : undefined,
            reminder_at: formData.get('reminder_at') && (formData.get('reminder_at') as string).trim() !== ''
                ? new Date(formData.get('reminder_at') as string).toISOString()
                : null,
            outcome: formData.get('outcome') as string || null,
            next_action_type: formData.get('next_action_type') as string || null,
            next_action_date: formData.get('next_action_date') && (formData.get('next_action_date') as string).trim() !== ''
                ? new Date(formData.get('next_action_date') as string).toISOString()
                : null,
        })
        .eq('id', id)

    if (!error) {
        // Fetch original to check for owner change or just notify current owner
        const { data: currentAct } = await supabase.from('activities').select('owner_id, summary, creator:profiles!user_id(full_name), tenant_id').eq('id', id).single()
        const { data: currentUser } = await supabase.auth.getUser()

        if (currentAct && currentUser.user) {
            const isSelf = currentAct.owner_id === currentUser.user.id
            createNotification({
                tenant_id: currentAct.tenant_id,
                user_id: currentAct.owner_id,
                type: 'Info',
                category: 'CRM',
                title: isSelf ? '📝 Görev Güncellendi' : '📝 Görev Güncellendi',
                message: isSelf
                    ? `"${currentAct.summary}" görevinizdeki değişiklikler kaydedildi.`
                    : `Size atanan "${currentAct.summary}" görevi ${(currentAct.creator as any)?.full_name || (Array.isArray(currentAct.creator) && (currentAct.creator as any)[0]?.full_name) || 'bir yönetici'} tarafından güncellendi.`,
                link: '/activities'
            }).catch(console.error)
        }
    }

    if (error) {
        console.error('Update Activity Error:', error)
        return { error: `Güncelleme başarısız: ${error.message} (Kod: ${error.code})` }
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function outcomeActivity(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    const id = formData.get('id') as string

    const { data: existingAct } = await supabase
        .from('activities')
        .select('status')
        .eq('id', id)
        .single()

    if (existingAct && (existingAct.status === 'Completed' || existingAct.status === 'Cancelled')) {
        return { error: 'Tamamlanmış veya İptal edilmiş aktiviteler güncellenemez.' }
    }

    const outcome = formData.get('outcome') as string
    const notes = formData.get('notes') as string

    const summary = formData.get('summary') as string
    const description = formData.get('description') as string
    const due_date = formData.get('due_date') as string
    const type = formData.get('type') as string
    const topic = formData.get('topic') as string
    const owner_id = formData.get('owner_id') as string
    const project_id = formData.get('project_id') as string
    const priority = formData.get('priority') as string
    const reminder_at = formData.get('reminder_at') as string
    const next_action_type = formData.get('next_action_type') as string
    const next_action_date = formData.get('next_action_date') as string

    const updatePayload: any = {
        status: 'Completed',
        outcome,
        completed_at: new Date().toISOString(),
        done_at: new Date().toISOString(),
        notes: notes,
        next_action_type: next_action_type || null,
        next_action_date: next_action_date && next_action_date.trim() !== '' ? new Date(next_action_date).toISOString() : null
    }

    if (summary !== null && summary !== undefined) updatePayload.summary = summary
    if (description !== null && description !== undefined) updatePayload.description = description
    if (due_date && due_date.trim() !== '') updatePayload.due_date = new Date(due_date).toISOString()
    if (type) updatePayload.type = type
    if (topic) updatePayload.topic = topic
    if (owner_id && owner_id.trim() !== '') updatePayload.owner_id = owner_id
    if (project_id && project_id.trim() !== '') updatePayload.project_id = project_id
    if (priority) updatePayload.priority = priority
    if (reminder_at && reminder_at.trim() !== '') {
        updatePayload.reminder_at = new Date(reminder_at).toISOString()
    } else if (reminder_at === '') {
        updatePayload.reminder_at = null
    }

    // Complete the current activity
    const { error: updateError } = await supabase
        .from('activities')
        .update(updatePayload)
        .eq('id', id)

    if (updateError) return { error: 'Failed to complete activity' }

    // Check for next action
    const next_action_summary = formData.get('next_action_summary') as string

    if (next_action_type && next_action_date) {
        // Fetch context from original activity
        const { data: original } = await supabase.from('activities').select('customer_id, lead_id, project_id, unit_id, owner_id').eq('id', id).single()

        if (original) {
            await supabase.from('activities').insert({
                tenant_id: profile?.tenant_id,
                customer_id: original.customer_id,
                lead_id: original.lead_id,
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

export async function cancelActivity(id: string) {
    const supabase = await createClient()
    const { data: existingAct } = await supabase
        .from('activities')
        .select('status')
        .eq('id', id)
        .single()

    if (existingAct && (existingAct.status === 'Completed' || existingAct.status === 'Cancelled')) {
        return { error: 'Tamamlanmış veya İptal edilmiş aktiviteler güncellenemez.' }
    }

    const { error } = await supabase
        .from('activities')
        .update({ status: 'Cancelled' })
        .eq('id', id)

    if (error) return { error: 'Failed to cancel activity' }

    revalidatePath('/activities')
    revalidatePath('/crm')
    return { success: true }
}

export async function completeActivity(formData: FormData) {
    // Backward compatibility wrapper or simple completion
    const supabase = await createClient()
    const id = formData.get('id') as string

    const { data: existingAct } = await supabase
        .from('activities')
        .select('status')
        .eq('id', id)
        .single()

    if (existingAct && (existingAct.status === 'Completed' || existingAct.status === 'Cancelled')) {
        return { error: 'Tamamlanmış veya İptal edilmiş aktiviteler güncellenemez.' }
    }

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
