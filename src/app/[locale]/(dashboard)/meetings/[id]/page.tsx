import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { MeetingRoom } from '../components/MeetingRoom'

interface MeetingRoomPageProps {
    params: Promise<{ id: string }>
}

export default async function MeetingRoomPage({ params }: MeetingRoomPageProps) {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Use admin client to bypass RLS
    const admin = createAdminClient()
    const { data: meeting } = await admin
        .from('meetings')
        .select(`
            *,
            customer:customers(id, full_name, phone, email, city, profile_data, customer_demands(*)),
            project:projects(id, name, city, district, address, description),
            host:profiles!meetings_host_user_id_fkey(id, full_name)
        `)
        .eq('id', id)
        .single()

    if (!meeting) notFound()

    if (meeting && meeting.project) {
        // Construct the location field manually
        meeting.project.location = [meeting.project.district, meeting.project.city]
            .filter(Boolean)
            .join(' / ') || meeting.project.address || ''
    }

    // Fetch recent activities for the customer
    let activities: any[] = []
    if (meeting.customer_id) {
        const { data } = await supabase
            .from('activities')
            .select('*')
            .eq('customer_id', meeting.customer_id)
            .order('due_date', { ascending: false })
            .limit(5)
        activities = data || []
    }

    // Fetch sales/leads for the customer
    let sales: any[] = []
    if (meeting.customer_id) {
        const { data } = await supabase
            .from('sales')
            .select('*, project:projects(name)')
            .eq('customer_id', meeting.customer_id)
            .order('created_at', { ascending: false })
            .limit(5)
        sales = data || []
    }

    // Get user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    // Ensure Daily room and host token are active
    if (meeting.status !== 'cancelled' && meeting.status !== 'completed') {
        const { ensureDailyMeetingReady } = await import('@/lib/daily')
        try {
            const ready = await ensureDailyMeetingReady(meeting)
            meeting.host_token = ready.hostToken
            meeting.daily_room_url = ready.roomUrl
            meeting.daily_room_name = ready.roomName
        } catch (err) {
            console.error('[MeetingRoomPage] Error ensuring Daily room ready:', err)
        }
    }

    return (
        <MeetingRoom
            meeting={meeting}
            activities={activities}
            sales={sales}
            userName={profile?.full_name || 'Danışman'}
        />
    )
}
