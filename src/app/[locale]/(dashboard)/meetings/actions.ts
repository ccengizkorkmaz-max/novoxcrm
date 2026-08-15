'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRoom, createMeetingToken, deleteRoom, buildGuestMeetingUrl, buildHostMeetingUrl } from '@/lib/daily'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'
import { MEETING_OUTCOME_LABELS, MEETING_TYPE_LABELS } from './constants'

// ─── Types ──────────────────────────────────────────────────

export interface CreateMeetingInput {
    customer_id: string
    title: string
    description?: string
    meeting_type: 'project_presentation' | 'sales_meeting' | 'follow_up' | 'general'
    scheduled_at: string // ISO date string
    project_id?: string
    unit_ids?: string[]
    host_user_id?: string
    send_whatsapp?: boolean
}

export interface UpdateMeetingInput {
    title?: string
    description?: string
    status?: string
    notes?: string
    outcome?: string
    next_action?: string
    next_action_date?: string
}

// Constants moved to constants.ts

// ─── Fetch Meetings ──────────────────────────────────────────

export async function getMeetings(filters?: {
    status?: string
    from_date?: string
    to_date?: string
    host_user_id?: string
    customer_id?: string
}) {
    const supabase = await createClient()
    let query = supabase
        .from('meetings')
        .select(`
            *,
            customer:customers(id, full_name, phone, email),
            project:projects(id, name),
            host:profiles!meetings_host_user_id_fkey(id, full_name)
        `)
        .order('scheduled_at', { ascending: true })

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.from_date) query = query.gte('scheduled_at', filters.from_date)
    if (filters?.to_date) query = query.lte('scheduled_at', filters.to_date)
    if (filters?.host_user_id) query = query.eq('host_user_id', filters.host_user_id)
    if (filters?.customer_id) query = query.eq('customer_id', filters.customer_id)

    const { data, error } = await query
    if (error) {
        console.error('[Meetings] Fetch error:', error.message)
        return { data: [], error: error.message }
    }
    return { data: data || [], error: null }
}

export async function getMeeting(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('meetings')
        .select(`
            *,
            customer:customers(id, full_name, phone, email, city, profile_data),
            project:projects(id, name, city, district, address, description, image_url),
            host:profiles!meetings_host_user_id_fkey(id, full_name, phone)
        `)
        .eq('id', id)
        .single()

    if (error) return { data: null, error: error.message }

    if (data && data.project) {
        data.project.location = [data.project.district, data.project.city]
            .filter(Boolean)
            .join(' / ') || data.project.address || ''
        data.project.images = data.project.image_url ? [data.project.image_url] : []
    }

    return { data, error: null }
}

// ─── Create Meeting ──────────────────────────────────────────

export async function createMeeting(input: CreateMeetingInput) {
    try {
    const supabase = await createClient()

    // Get current user info
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Oturum bulunamadı' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { data: null, error: 'Tenant bulunamadı' }

    const hostUserId = input.host_user_id || user.id

    // Get host name for token
    let hostName = profile.full_name || 'Danışman'
    if (input.host_user_id && input.host_user_id !== user.id) {
        const { data: hostProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', input.host_user_id)
            .single()
        if (hostProfile) hostName = hostProfile.full_name || 'Danışman'
    }

    // Get customer info (admin client for reliability)
    const adminDb = createAdminClient()
    const { data: customer } = await adminDb
        .from('customers')
        .select('id, full_name, phone')
        .eq('id', input.customer_id)
        .single()

    if (!customer) return { data: null, error: 'Müşteri bulunamadı' }

    try {
        // 1. Create Daily.co room with expiry based on scheduled_at (+7 days)
        const meetingId = crypto.randomUUID()
        const room = await createRoom({
            meetingId,
            scheduledAt: input.scheduled_at,
            enableRecording: false, // Free plan uyumlu
        })

        // 2. Generate tokens with expiry based on scheduled_at (+7 days)
        const hostToken = await createMeetingToken({
            roomName: room.name,
            isOwner: true,
            userName: hostName,
            scheduledAt: input.scheduled_at,
        })

        const guestToken = await createMeetingToken({
            roomName: room.name,
            isOwner: false,
            userName: customer.full_name || 'Müşteri',
            scheduledAt: input.scheduled_at,
        })

        // 3. Save to database (admin client to bypass RLS insert issues)
        const adminDb = createAdminClient()
        const { data: meeting, error: dbError } = await adminDb
            .from('meetings')
            .insert({
                id: meetingId,
                tenant_id: profile.tenant_id,
                customer_id: input.customer_id,
                title: input.title,
                description: input.description,
                meeting_type: input.meeting_type,
                scheduled_at: input.scheduled_at,
                project_id: input.project_id || null,
                unit_ids: input.unit_ids || null,
                host_user_id: hostUserId,
                daily_room_name: room.name,
                daily_room_url: room.url,
                host_token: hostToken,
                guest_token: guestToken,
                status: 'scheduled',
            })
            .select()
            .single()

        if (dbError) {
            console.error('[Meetings] DB insert error:', dbError.message)
            // Cleanup: delete the room we just created
            await deleteRoom(room.name)
            return { data: null, error: dbError.message }
        }

        // 4. Send WhatsApp invite if requested
        if (input.send_whatsapp && customer.phone) {
            const guestUrl = buildGuestMeetingUrl(room.name)
            const scheduledDate = new Date(input.scheduled_at)
            const dateStr = scheduledDate.toLocaleDateString('tr-TR', {
                day: 'numeric', month: 'long', year: 'numeric'
            })
            const timeStr = scheduledDate.toLocaleTimeString('tr-TR', {
                hour: '2-digit', minute: '2-digit'
            })

            // Get project name if available
            let projectName = 'online görüşmemiz'
            if (input.project_id) {
                const { data: project } = await supabase
                    .from('projects')
                    .select('name')
                    .eq('id', input.project_id)
                    .single()
                if (project) projectName = project.name
            }

            try {
                const adminSupabase = createAdminClient()
                const { data: tenant } = await adminSupabase
                    .from('tenants')
                    .select('whatsapp_config')
                    .eq('id', profile.tenant_id)
                    .single()

                if (tenant?.whatsapp_config?.phone_number_id) {
                    // Template: meeting_invite
                    // {{1}}=isim, {{2}}=tarih/saat, {{3}}=proje, {{4}}=link
                    await sendWhatsAppTemplate(
                        customer.phone,
                        'meeting_invite',
                        [
                            customer.full_name || 'Değerli Müşterimiz',
                            `${dateStr} saat ${timeStr}`,
                            projectName,
                            guestUrl,
                        ],
                        'tr',
                        tenant.whatsapp_config.phone_number_id,
                        tenant.whatsapp_config.access_token
                    )
                    console.log(`[Meetings] ✅ WhatsApp template invite sent to ${customer.phone}`)
                }
            } catch (waErr: any) {
                console.error('[Meetings] WhatsApp send error:', waErr.message)
                // Non-blocking: don't fail the meeting creation
            }
        }

        // 5. Log activity on customer timeline
        try {
            await adminDb.from('activities').insert({
                tenant_id: profile.tenant_id,
                customer_id: input.customer_id,
                type: 'Meeting',
                topic: 'Online Toplantı',
                summary: `📹 Online toplantı planlandı: ${input.title}`,
                description: `Tarih: ${new Date(input.scheduled_at).toLocaleDateString('tr-TR')} ${new Date(input.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\nTip: ${MEETING_TYPE_LABELS[input.meeting_type] || input.meeting_type}\nDanışman: ${hostName}`,
                due_date: input.scheduled_at,
                status: 'Planned',
            })
        } catch {
            // Non-blocking
        }

        console.log(`[Meetings] ✅ Meeting created: ${meetingId} for ${customer.full_name}`)
        return { data: meeting, error: null }
    } catch (err: any) {
        console.error('[Meetings] Create inner error:', err.message)
        return { data: null, error: err.message }
    }
    } catch (outerErr: any) {
        console.error('[Meetings] Create outer error:', outerErr.message)
        return { data: null, error: outerErr.message || 'Bilinmeyen hata' }
    }
}

// ─── Update Meeting ──────────────────────────────────────────

export async function updateMeeting(id: string, input: UpdateMeetingInput) {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('meetings')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

// ─── Start Meeting ───────────────────────────────────────────

export async function startMeeting(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
        .from('meetings')
        .update({
            status: 'in_progress',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
}

// ─── End Meeting ─────────────────────────────────────────────

export async function endMeeting(id: string, input: {
    outcome?: string
    notes?: string
    next_action?: string
    next_action_date?: string
}) {
    const admin = createAdminClient()

    // Get meeting data
    const { data: meeting } = await admin
        .from('meetings')
        .select('*, customer:customers(id, full_name, phone)')
        .eq('id', id)
        .single()

    if (!meeting) return { error: 'Toplantı bulunamadı' }

    const startedAt = meeting.started_at ? new Date(meeting.started_at) : new Date()
    const endedAt = new Date()
    const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000)

    // Update meeting
    const { error } = await admin
        .from('meetings')
        .update({
            status: 'completed',
            ended_at: endedAt.toISOString(),
            duration_seconds: durationSeconds,
            outcome: input.outcome || null,
            notes: input.notes || null,
            next_action: input.next_action || null,
            next_action_date: input.next_action_date || null,
            updated_at: endedAt.toISOString(),
        })
        .eq('id', id)

    if (error) return { error: error.message }

    // Log completed activity on timeline
    try {
        const durationMin = Math.round(durationSeconds / 60)
        const outcomeLabel = input.outcome ? (MEETING_OUTCOME_LABELS[input.outcome] || input.outcome) : 'Belirtilmedi'
        const endAdmin = createAdminClient()
        await endAdmin.from('activities').insert({
            tenant_id: meeting.tenant_id,
            customer_id: meeting.customer_id,
            type: 'Meeting',
            topic: 'Online Toplantı',
            summary: `🎥 Online toplantı tamamlandı (${durationMin} dk)`,
            description: `Toplantı: ${meeting.title}\nSüre: ${durationMin} dakika\nSonuç: ${outcomeLabel}${input.notes ? `\nNotlar: ${input.notes}` : ''}${input.next_action ? `\nSonraki Adım: ${input.next_action}` : ''}`,
            due_date: endedAt.toISOString(),
            status: 'Completed',
        })
    } catch {
        // Non-blocking
    }

    // Cleanup: delete Daily room
    if (meeting.daily_room_name) {
        try {
            await deleteRoom(meeting.daily_room_name)
        } catch {
            // Non-blocking
        }
    }

    return { error: null }
}

// ─── Cancel Meeting ──────────────────────────────────────────

export async function cancelMeeting(id: string) {
    const admin = createAdminClient()

    const { data: meeting } = await admin
        .from('meetings')
        .select('daily_room_name')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('meetings')
        .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)

    if (error) return { error: error.message }

    if (meeting?.daily_room_name) {
        try { await deleteRoom(meeting.daily_room_name) } catch {}
    }

    return { error: null }
}

// ─── Delete Meeting ──────────────────────────────────────────

export async function deleteMeeting(id: string) {
    const admin = createAdminClient()

    const { data: meeting } = await admin
        .from('meetings')
        .select('daily_room_name')
        .eq('id', id)
        .single()

    const { error } = await admin
        .from('meetings')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    if (meeting?.daily_room_name) {
        try { await deleteRoom(meeting.daily_room_name) } catch {}
    }

    return { error: null }
}

// ─── Search Customers ────────────────────────────────────────

export async function searchCustomersForMeeting(query: string) {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) return []

    try {
        // Get current user's tenant
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return []

        // Use admin client to bypass RLS for fast search
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('customers')
            .select('id, full_name, phone, email')
            .eq('tenant_id', profile.tenant_id)
            .or(`full_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%`)
            .order('full_name')
            .limit(10)

        if (error) {
            console.error('[Meetings] Customer search error:', error.message)
            return []
        }

        return data || []
    } catch (err) {
        console.error('[Meetings] Customer search exception:', err)
        return []
    }
}

