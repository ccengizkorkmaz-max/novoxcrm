import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { GuestMeetingRoom } from './GuestMeetingRoom'

interface GuestMeetingPageProps {
    params: Promise<{ roomName: string }>
}

export default async function GuestMeetingPage({ params }: GuestMeetingPageProps) {
    const { roomName } = await params
    const admin = createAdminClient()

    // Find meeting by daily room name
    const { data: raw } = await admin
        .from('meetings')
        .select(`
            id, title, scheduled_at, status, guest_token, daily_room_url, daily_room_name,
            customer:customers(id, full_name),
            project:projects(id, name),
            host:profiles!meetings_host_user_id_fkey(id, full_name)
        `)
        .eq('daily_room_name', roomName)
        .single()

    if (!raw) notFound()

    // Normalize Supabase joins (arrays → single objects)
    const meeting = {
        ...raw,
        customer: Array.isArray(raw.customer) ? raw.customer[0] || null : raw.customer,
        project: Array.isArray(raw.project) ? raw.project[0] || null : raw.project,
        host: Array.isArray(raw.host) ? raw.host[0] || null : raw.host,
    }

    return <GuestMeetingRoom meeting={meeting} />
}
