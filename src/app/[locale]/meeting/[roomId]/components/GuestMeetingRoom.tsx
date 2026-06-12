'use client'

interface GuestMeetingRoomProps {
    meeting: any
    roomUrl: string
    guestToken: string
}

export function GuestMeetingRoom({ meeting, roomUrl, guestToken }: GuestMeetingRoomProps) {
    const dailyUrl = `${roomUrl}?t=${guestToken}&showLeaveButton=true&showFullscreenButton=true&lang=tr`
    const tenantName = meeting.tenant?.name || ''
    const projectName = meeting.project?.name || ''
    const hostName = meeting.host?.full_name || 'Danışman'
    const brandColor = meeting.tenant?.branding?.primary_color || '#7c3aed'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    {meeting.tenant?.logo_url ? (
                        <img src={meeting.tenant.logo_url} alt={tenantName} className="h-8 w-8 rounded-lg object-contain" />
                    ) : (
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: brandColor }}>
                            {tenantName.charAt(0) || 'N'}
                        </div>
                    )}
                    <div>
                        <h1 className="text-sm font-bold text-white">{meeting.title}</h1>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            {projectName && <span>🏗️ {projectName}</span>}
                            <span>👤 {hostName}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Canlı
                    </span>
                </div>
            </div>

            {/* Video Area - Full Height */}
            <div className="flex-1 relative">
                <iframe
                    src={dailyUrl}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    className="absolute inset-0 w-full h-full"
                    style={{ border: 'none' }}
                />
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-500">
                    {tenantName && `${tenantName} • `}Powered by NovoCRM
                </p>
            </div>
        </div>
    )
}
