'use client'

import { useState } from 'react'

interface GuestMeetingRoomProps {
    meeting: {
        id: string
        title: string
        scheduled_at: string
        status: string
        guest_token: string
        daily_room_url: string
        daily_room_name: string
        customer?: { id: string; full_name: string } | null
        project?: { id: string; name: string } | null
        host?: { id: string; full_name: string } | null
    }
}

export function GuestMeetingRoom({ meeting }: GuestMeetingRoomProps) {
    const [joined, setJoined] = useState(false)

    const scheduledDate = new Date(meeting.scheduled_at)
    const dateStr = scheduledDate.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
    const timeStr = scheduledDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit'
    })

    // Daily.co iframe URL with token
    const iframeSrc = `${meeting.daily_room_url}?t=${meeting.guest_token}`

    if (joined) {
        return (
            <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', backgroundColor: '#0f172a' }}>
                <iframe
                    src={iframeSrc}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
            </div>
        )
    }

    // Pre-join lobby
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6">
                {/* Branding */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-2 mb-6">
                        <span className="text-2xl">🎥</span>
                        <span className="text-violet-300 font-semibold text-sm">Online Toplantı</span>
                    </div>
                </div>

                {/* Meeting Info Card */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <h1 className="text-2xl font-bold text-white">{meeting.title}</h1>
                        <p className="text-slate-400 text-sm">
                            📅 {dateStr} • ⏰ {timeStr}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {meeting.host && (
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-xs text-slate-500 mb-1">Danışman</p>
                                <p className="text-sm font-semibold text-white">{meeting.host.full_name}</p>
                            </div>
                        )}
                        {meeting.project && (
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <p className="text-xs text-slate-500 mb-1">Proje</p>
                                <p className="text-sm font-semibold text-white">{meeting.project.name}</p>
                            </div>
                        )}
                    </div>

                    {meeting.status === 'cancelled' ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                            <p className="text-red-400 font-semibold">Bu toplantı iptal edilmiştir</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => setJoined(true)}
                            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                        >
                            🎥 Toplantıya Katıl
                        </button>
                    )}
                </div>

                <p className="text-center text-xs text-slate-600">
                    Uygulama indirmenize gerek yok. Tarayıcınızdan katılabilirsiniz.
                </p>
            </div>
        </div>
    )
}
