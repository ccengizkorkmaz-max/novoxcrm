/**
 * Daily.co Video Conferencing API Wrapper
 * 
 * Toplantı odası oluşturma, token üretme, oda yönetimi.
 * Daily.co REST API: https://docs.daily.co/reference/rest-api
 */

const DAILY_API_BASE = 'https://api.daily.co/v1'

function getDailyApiKey(): string {
    const key = process.env.DAILY_API_KEY
    if (!key) throw new Error('DAILY_API_KEY environment variable is not set')
    return key
}

async function dailyFetch(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${DAILY_API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getDailyApiKey()}`,
            ...options.headers,
        },
    })

    if (!res.ok) {
        const text = await res.text()
        console.error(`[Daily.co] API Error ${res.status}: ${text}`)
        throw new Error(`Daily.co API error: ${res.status} ${text}`)
    }

    return res.json()
}

// ─── Room Management ─────────────────────────────────────────

export interface DailyRoom {
    id: string
    name: string
    url: string
    created_at: string
    config: Record<string, any>
}

/**
 * Toplantı ve token için geçerlilik süresi (exp) hesapla (varsayılan: planlanan tarihten itibaren 7 gün)
 */
export function calculateMeetingExpiry(scheduledAt?: string | Date | null, expiryDays = 7): number {
    let baseTime = Date.now()
    if (scheduledAt) {
        const parsed = new Date(scheduledAt).getTime()
        if (!isNaN(parsed) && parsed > baseTime) {
            baseTime = parsed
        }
    }
    return Math.floor(baseTime / 1000) + (expiryDays * 24 * 60 * 60)
}

/**
 * Yeni toplantı odası oluştur (veya var olan isimle)
 */
export async function createRoom(options: {
    meetingId: string
    customRoomName?: string
    scheduledAt?: string | Date | null
    expiryTimestamp?: number
    enableRecording?: boolean
    enableChat?: boolean
    maxParticipants?: number
}): Promise<DailyRoom> {
    const {
        meetingId,
        customRoomName,
        scheduledAt,
        expiryTimestamp,
        enableRecording = false,
        enableChat = true,
        maxParticipants = 10,
    } = options

    const expiryTime = expiryTimestamp || calculateMeetingExpiry(scheduledAt, 7)
    const roomName = customRoomName || `novocrm-${meetingId.substring(0, 8)}-${Date.now()}`

    const room = await dailyFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
            name: roomName,
            privacy: 'public', // Token ile kontrol ediyoruz
            properties: {
                exp: expiryTime,
                max_participants: maxParticipants,
                enable_chat: enableChat,
                enable_screenshare: true,
                enable_recording: enableRecording ? 'cloud' : undefined,
                enable_knocking: false,
                start_video_off: false,
                start_audio_off: false,
                lang: 'tr',
                // Branding
                enable_prejoin_ui: true,
                enable_network_ui: true,
                enable_people_ui: true,
            },
        }),
    })

    console.log(`[Daily.co] ✅ Room created: ${room.name} (${room.url}) [exp: ${new Date(expiryTime * 1000).toISOString()}]`)
    return room
}

/**
 * Toplantı token'ı oluştur (host veya guest)
 */
export async function createMeetingToken(options: {
    roomName: string
    isOwner?: boolean
    userName?: string
    scheduledAt?: string | Date | null
    expiryTimestamp?: number
}): Promise<string> {
    const {
        roomName,
        isOwner = false,
        userName = 'Katılımcı',
        scheduledAt,
        expiryTimestamp,
    } = options

    const expiryTime = expiryTimestamp || calculateMeetingExpiry(scheduledAt, 7)

    const data = await dailyFetch('/meeting-tokens', {
        method: 'POST',
        body: JSON.stringify({
            properties: {
                room_name: roomName,
                is_owner: isOwner,
                user_name: userName,
                exp: expiryTime,
                enable_screenshare: true,
                enable_recording: isOwner ? 'cloud' : undefined,
                start_video_off: false,
                start_audio_off: false,
            },
        }),
    })

    return data.token
}

/**
 * Oda bilgilerini getir
 */
export async function getRoomDetails(roomName: string): Promise<DailyRoom | null> {
    try {
        const room = await dailyFetch(`/rooms/${roomName}`)
        return room
    } catch {
        return null
    }
}

/**
 * Odayı sil
 */
export async function deleteRoom(roomName: string): Promise<boolean> {
    try {
        await dailyFetch(`/rooms/${roomName}`, { method: 'DELETE' })
        console.log(`[Daily.co] 🗑️ Room deleted: ${roomName}`)
        return true
    } catch {
        console.error(`[Daily.co] Failed to delete room: ${roomName}`)
        return false
    }
}

/**
 * Aktif katılımcıları getir
 */
export async function getActiveParticipants(roomName: string): Promise<number> {
    try {
        const data = await dailyFetch(`/rooms/${roomName}/presence`)
        return data?.total_count || 0
    } catch {
        return 0
    }
}

/**
 * Kaydı başlat (host token gerekli)
 */
export async function startRecording(roomName: string): Promise<boolean> {
    try {
        await dailyFetch(`/rooms/${roomName}/recordings`, {
            method: 'POST',
            body: JSON.stringify({ type: 'cloud' }),
        })
        console.log(`[Daily.co] 🔴 Recording started for: ${roomName}`)
        return true
    } catch {
        return false
    }
}

// ─── Helper: Ensure Daily Meeting is Ready & Active ─────────

/**
 * Toplantı odasının ve token'larının aktif olduğundan emin olur.
 * Eğer oda Daily.co üzerinde süresi dolduğu için silinmişse, odayı otomatik olarak yeniden oluşturur
 * ve taze token'lar üreterek veritabanını günceller.
 */
export async function ensureDailyMeetingReady(meeting: {
    id: string
    daily_room_name?: string | null
    scheduled_at?: string | null
    host_token?: string | null
    guest_token?: string | null
    customer?: { full_name?: string } | null
    host?: { full_name?: string } | null
    status?: string
}): Promise<{
    roomName: string
    roomUrl: string
    hostToken: string
    guestToken: string
}> {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminDb = createAdminClient()

    let roomName = meeting.daily_room_name
    let roomDetails: DailyRoom | null = null

    if (roomName) {
        roomDetails = await getRoomDetails(roomName)
    }

    // If room doesn't exist on Daily.co (or expired), create a new/fresh room
    if (!roomDetails) {
        console.log(`[Daily.co] ⚠️ Room ${roomName || meeting.id} not found or expired. Re-creating room...`)
        const newRoom = await createRoom({
            meetingId: meeting.id,
            customRoomName: roomName || undefined,
            scheduledAt: meeting.scheduled_at,
            enableRecording: false,
        })
        roomName = newRoom.name
        roomDetails = newRoom
    }

    const safeRoomName = roomName || roomDetails.name

    // Always ensure fresh valid tokens
    const hostName = meeting.host?.full_name || 'Danışman'
    const customerName = meeting.customer?.full_name || 'Müşteri'

    const hostToken = await createMeetingToken({
        roomName: safeRoomName,
        isOwner: true,
        userName: hostName,
        scheduledAt: meeting.scheduled_at,
    })

    const guestToken = await createMeetingToken({
        roomName: safeRoomName,
        isOwner: false,
        userName: customerName,
        scheduledAt: meeting.scheduled_at,
    })

    // Update DB with active room url and fresh tokens
    await adminDb
        .from('meetings')
        .update({
            daily_room_name: safeRoomName,
            daily_room_url: roomDetails.url,
            host_token: hostToken,
            guest_token: guestToken,
            updated_at: new Date().toISOString(),
        })
        .eq('id', meeting.id)

    return {
        roomName: safeRoomName,
        roomUrl: roomDetails.url,
        hostToken,
        guestToken,
    }
}

// ─── Helper: Meeting URL builder ─────────────────────────────

/**
 * Müşteriye gönderilecek toplantı URL'ini oluştur
 * Format: https://novoxcrm.com/meeting/{roomName}
 */
export function buildGuestMeetingUrl(roomName: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.novoxcrm.com'
    return `${baseUrl}/meeting/${roomName}`
}

/**
 * Danışman (host) toplantı URL'ini oluştur
 * Format: https://novoxcrm.com/tr/meetings/{meetingId}
 */
export function buildHostMeetingUrl(meetingId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.novoxcrm.com'
    return `${baseUrl}/tr/meetings/${meetingId}`
}
