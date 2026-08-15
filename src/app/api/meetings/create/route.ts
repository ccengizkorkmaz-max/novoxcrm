import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createRoom, createMeetingToken, deleteRoom, buildGuestMeetingUrl } from '@/lib/daily'
import { sendWhatsAppTemplate } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
    try {
        const input = await request.json()
        console.log('[API] createMeeting input:', JSON.stringify(input))

        // Auth
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 400 })
        }

        const admin = createAdminClient()
        const hostUserId = input.host_user_id || user.id

        // Host name
        let hostName = profile.full_name || 'Danışman'
        if (input.host_user_id && input.host_user_id !== user.id) {
            const { data: hp } = await admin.from('profiles').select('full_name').eq('id', input.host_user_id).single()
            if (hp) hostName = hp.full_name || 'Danışman'
        }

        // Customer
        const { data: customer } = await admin
            .from('customers')
            .select('id, full_name, phone')
            .eq('id', input.customer_id)
            .single()

        if (!customer) {
            return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })
        }

        console.log('[API] Creating Daily room...')
        const meetingId = crypto.randomUUID()
        const room = await createRoom({
            meetingId,
            scheduledAt: input.scheduled_at,
            enableRecording: false,
        })
        console.log('[API] Room created:', room.name)

        // Tokens with 7 days expiry from scheduled_at
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
        console.log('[API] Tokens created')

        // DB Insert
        const { data: meeting, error: dbError } = await admin
            .from('meetings')
            .insert({
                id: meetingId,
                tenant_id: profile.tenant_id,
                customer_id: input.customer_id,
                title: input.title,
                description: input.description || null,
                meeting_type: input.meeting_type || 'general',
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
            .select(`
                *,
                customer:customers(id, full_name, phone, email),
                project:projects(id, name),
                host:profiles!meetings_host_user_id_fkey(id, full_name)
            `)
            .single()

        if (dbError) {
            console.error('[API] DB error:', dbError.message)
            await deleteRoom(room.name)
            return NextResponse.json({ error: dbError.message }, { status: 500 })
        }
        console.log('[API] Meeting inserted:', meetingId)

        // Notifications to Customer & Host/Organizer (non-blocking)
        try {
            const guestUrl = buildGuestMeetingUrl(room.name)
            const d = new Date(input.scheduled_at)
            const dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
            const timeStr = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

            let projectName = 'online görüşmemiz'
            if (input.project_id) {
                const { data: proj } = await admin.from('projects').select('name').eq('id', input.project_id).single()
                if (proj) projectName = proj.name
            }

            const { data: tenant } = await admin
                .from('tenants')
                .select('wa_phone_number_id, wa_access_token')
                .eq('id', profile.tenant_id)
                .single()

            const waPhoneId = tenant?.wa_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID
            const waToken = tenant?.wa_access_token || process.env.WHATSAPP_ACCESS_TOKEN

            // 1. Send WhatsApp Invite to Customer
            if (input.send_whatsapp && customer.phone && waPhoneId && waToken) {
                sendWhatsAppTemplate(
                    customer.phone,
                    'meeting_invite',
                    [
                        customer.full_name || 'Değerli Müşterimiz',
                        `${dateStr} saat ${timeStr}`,
                        projectName,
                        guestUrl,
                    ],
                    'tr',
                    waPhoneId,
                    waToken
                ).then(res => console.log('[API] Customer WA template result:', res)).catch(console.error)
            }

            // 2. Send WhatsApp & CRM Notification to Organizer / Host User
            const { data: hostProfile } = await admin
                .from('profiles')
                .select('id, full_name, phone')
                .eq('id', hostUserId)
                .single()

            if (hostProfile?.phone && waPhoneId && waToken) {
                sendWhatsAppTemplate(
                    hostProfile.phone,
                    'lead_assignment_alert',
                    [
                        customer.full_name || 'Müşteri',
                        customer.phone || '-',
                        `📹 ONLINE TOPLANTI: ${dateStr} saat ${timeStr} | Proje: ${projectName}`
                    ],
                    'tr',
                    waPhoneId,
                    waToken
                ).then(res => console.log('[API] Host WA notification result:', res)).catch(console.error)
            }

            // 3. In-App CRM Notification to Host User
            const { createNotification } = await import('@/lib/notifications/create')
            createNotification({
                tenant_id: profile.tenant_id,
                user_id: hostUserId,
                type: 'Info',
                category: 'CRM',
                title: '📹 Yeni Online Toplantı',
                message: `${customer.full_name || 'Müşteri'} ile ${dateStr} saat ${timeStr} için online toplantı planlandı.`,
                link: '/meetings'
            }).catch(console.error)

        } catch (waErr: any) {
            console.error('[API] Notification error (non-blocking):', waErr.message)
        }

        // Activity log (non-blocking)
        try {
            await admin.from('activities').insert({
                tenant_id: profile.tenant_id,
                customer_id: input.customer_id,
                type: 'Meeting',
                topic: 'Online Toplantı',
                summary: `📹 Online toplantı planlandı: ${input.title}`,
                due_date: input.scheduled_at,
                status: 'Planned',
            })
        } catch {}

        console.log('[API] ✅ Meeting created successfully:', meetingId)
        return NextResponse.json({ data: meeting, error: null })

    } catch (err: any) {
        console.error('[API] ❌ createMeeting exception:', err.message, err.stack)
        return NextResponse.json({ error: err.message || 'Bilinmeyen hata' }, { status: 500 })
    }
}
