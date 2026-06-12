import { createAdminClient } from '@/lib/supabase/admin'
import { GuestMeetingRoom } from './components/GuestMeetingRoom'

interface GuestMeetingPageProps {
    params: Promise<{ roomId: string }>
}

export default async function GuestMeetingPage({ params }: GuestMeetingPageProps) {
    const { roomId } = await params
    const supabase = createAdminClient()

    // Find meeting by daily_room_name (no auth needed)
    const { data: meeting } = await supabase
        .from('meetings')
        .select(`
            id,
            title,
            meeting_type,
            daily_room_url,
            guest_token,
            status,
            scheduled_at,
            project:projects(name),
            host:profiles!meetings_host_user_id_fkey(full_name),
            tenant:tenants(name, logo_url, branding)
        `)
        .eq('daily_room_name', roomId)
        .single()

    if (!meeting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="p-4 rounded-full bg-red-500/10 mx-auto w-fit">
                        <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Toplantı Bulunamadı</h1>
                    <p className="text-slate-400">Bu toplantı linki geçersiz veya süresi dolmuş olabilir.</p>
                </div>
            </div>
        )
    }

    if (meeting.status === 'cancelled') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="p-4 rounded-full bg-amber-500/10 mx-auto w-fit">
                        <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Toplantı İptal Edildi</h1>
                    <p className="text-slate-400">Bu toplantı iptal edilmiştir. Detaylar için danışmanınızla iletişime geçin.</p>
                </div>
            </div>
        )
    }

    if (meeting.status === 'completed') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <div className="p-4 rounded-full bg-emerald-500/10 mx-auto w-fit">
                        <svg className="h-12 w-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Toplantı Tamamlandı</h1>
                    <p className="text-slate-400">Bu toplantı tamamlanmıştır. Teşekkür ederiz!</p>
                </div>
            </div>
        )
    }

    return (
        <GuestMeetingRoom
            meeting={meeting}
            roomUrl={meeting.daily_room_url}
            guestToken={meeting.guest_token}
        />
    )
}
