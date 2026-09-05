'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { createNotification } from '@/lib/notifications/create'

export async function createActivity(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase.from('profiles').select('tenant_id, full_name').eq('id', user.id).single()

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

    const { data: newAct, error } = await adminSupabase
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

    // Trigger event-driven AI scoring for the customer
    if (customer_id && profile?.tenant_id) {
        try {
            const { triggerEventDrivenScoring } = await import('@/lib/outreach/ai-lead-scoring')
            await triggerEventDrivenScoring(profile.tenant_id, customer_id, 'activity')
        } catch (err: any) {
            console.error('[AI Scoring Activity Error] Failed to trigger:', err.message)
        }
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

function safeDateISO(val: unknown): string | null {
    if (!val || typeof val !== 'string' || val.trim() === '') return null
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString()
}

export async function updateActivity(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const adminSupabase = createAdminClient()
    const id = formData.get('id') as string

    if (!id) {
        return { error: 'Aktivite ID bulunamadı.' }
    }

    const { data: existingAct } = await adminSupabase
        .from('activities')
        .select('id, status, completed_at, done_at')
        .eq('id', id)
        .single()

    if (!existingAct) {
        return { error: 'Aktivite bulunamadı.' }
    }

    const status = formData.get('status') as string
    const isNowCompleted = status === 'Completed'

    const updatePayload: Record<string, any> = {
        summary: formData.get('summary') as string,
        description: formData.get('description') as string,
        due_date: safeDateISO(formData.get('due_date')),
        type: formData.get('type') as string,
        topic: formData.get('topic') as string,
        notes: formData.get('notes') as string,
        owner_id: (formData.get('owner_id') as string)?.trim() !== '' ? formData.get('owner_id') as string : null,
        project_id: (formData.get('project_id') as string)?.trim() !== '' ? formData.get('project_id') as string : null,
        priority: formData.get('priority') as string,
        status: status || undefined,
        reminder_at: safeDateISO(formData.get('reminder_at')),
        outcome: formData.get('outcome') as string || null,
        next_action_type: formData.get('next_action_type') as string || null,
        next_action_date: safeDateISO(formData.get('next_action_date')),
    }

    if (isNowCompleted) {
        updatePayload.completed_at = existingAct.completed_at || new Date().toISOString()
        updatePayload.done_at = existingAct.done_at || new Date().toISOString()
    } else if (status && status !== 'Completed') {
        updatePayload.completed_at = null
        updatePayload.done_at = null
    }

    const { error } = await adminSupabase
        .from('activities')
        .update(updatePayload)
        .eq('id', id)

    if (error) {
        console.error('Update Activity Error:', error)
        return { error: `Güncelleme başarısız: ${error.message}` }
    }

    // Bildirim gönderme
    try {
        const { data: currentAct } = await adminSupabase.from('activities').select('owner_id, summary, tenant_id').eq('id', id).single()

        if (currentAct && currentAct.owner_id) {
            const isSelf = currentAct.owner_id === user.id
            createNotification({
                tenant_id: currentAct.tenant_id,
                user_id: currentAct.owner_id,
                type: 'Info',
                category: 'CRM',
                title: '📝 Görev Güncellendi',
                message: isSelf
                    ? `"${currentAct.summary}" görevinizdeki değişiklikler kaydedildi.`
                    : `Size atanan "${currentAct.summary}" görevi güncellendi.`,
                link: '/activities'
            }).catch(console.error)
        }
    } catch (notifErr) {
        console.error('Notification error on updateActivity:', notifErr)
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    revalidatePath('/customers')
    revalidatePath('/customers/[id]', 'page')
    return { success: true }
}

export async function outcomeActivity(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const id = formData.get('id') as string

    if (!id) {
        return { error: 'Aktivite ID bulunamadı.' }
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
        next_action_date: safeDateISO(next_action_date)
    }

    if (summary !== null && summary !== undefined) updatePayload.summary = summary
    if (description !== null && description !== undefined) updatePayload.description = description
    if (due_date && due_date.trim() !== '') updatePayload.due_date = safeDateISO(due_date)
    if (type) updatePayload.type = type
    if (topic) updatePayload.topic = topic
    if (owner_id && owner_id.trim() !== '') updatePayload.owner_id = owner_id
    if (project_id && project_id.trim() !== '') updatePayload.project_id = project_id
    if (priority) updatePayload.priority = priority
    if (reminder_at && reminder_at.trim() !== '') {
        updatePayload.reminder_at = safeDateISO(reminder_at)
    } else if (reminder_at === '') {
        updatePayload.reminder_at = null
    }

    // Complete / Update the current activity
    const { error: updateError } = await adminSupabase
        .from('activities')
        .update(updatePayload)
        .eq('id', id)

    if (updateError) {
        console.error('outcomeActivity error:', updateError)
        return { error: `Aktivite güncellenemedi: ${updateError.message}` }
    }

    // Check for next action
    const next_action_summary = formData.get('next_action_summary') as string

    if (next_action_type && next_action_date) {
        // Fetch context from original activity
        const { data: original } = await adminSupabase.from('activities').select('customer_id, lead_id, project_id, unit_id, owner_id').eq('id', id).single()

        if (original) {
            await adminSupabase.from('activities').insert({
                tenant_id: profile?.tenant_id,
                customer_id: original.customer_id,
                lead_id: original.lead_id,
                user_id: user.id,
                owner_id: original.owner_id, // Keep same owner
                assigned_by_id: user.id,
                type: next_action_type,
                summary: next_action_summary || `Follow up: ${next_action_type}`,
                due_date: safeDateISO(next_action_date),
                project_id: original.project_id,
                unit_id: original.unit_id,
                previous_activity_id: id, // Link to original
                status: 'Planned'
            })
        }
    }

    revalidatePath('/activities')
    revalidatePath('/crm')
    revalidatePath('/customers')
    revalidatePath('/customers/[id]', 'page')
    return { success: true }
}

export async function deleteActivity(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('activities').delete().eq('id', id)

    if (error) return { error: `Silinemedi: ${error.message}` }

    revalidatePath('/activities')
    revalidatePath('/crm')
    revalidatePath('/customers')
    revalidatePath('/customers/[id]', 'page')
    return { success: true }
}

export async function cancelActivity(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('activities')
        .update({ status: 'Cancelled' })
        .eq('id', id)

    if (error) return { error: `İptal edilemedi: ${error.message}` }

    revalidatePath('/activities')
    revalidatePath('/crm')
    revalidatePath('/customers')
    revalidatePath('/customers/[id]', 'page')
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

    if (error) return { error: `Tamamlanamadı: ${error.message}` }
    revalidatePath('/crm')
    revalidatePath('/activities')
    revalidatePath('/customers')
    revalidatePath('/customers/[id]', 'page')
    return { success: true }
}

