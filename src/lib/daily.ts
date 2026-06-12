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
 * Yeni toplantı odası oluştur
 */
export async function createRoom(options: {
    meetingId: string
    expiryMinutes?: number
    enableRecording?: boolean
    enableChat?: boolean
    maxParticipants?: number
}): Promise<DailyRoom> {
    const {
        meetingId,
        expiryMinutes = 120,
        enableRecording = true,
        enableChat = true,
        maxParticipants = 10,
    } = options

    const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60)
    const roomName = `novocrm-${meetingId.substring(0, 8)}-${Date.now()}`

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

    console.log(`[Daily.co] ✅ Room created: ${room.name} (${room.url})`)
    return room
}

/**
 * Toplantı token'ı oluştur (host veya guest)
 */
export async function createMeetingToken(options: {
    roomName: string
    isOwner?: boolean
    userName?: string
    expiryMinutes?: number
}): Promise<string> {
    const {
        roomName,
        isOwner = false,
        userName = 'Katılımcı',
        expiryMinutes = 120,
    } = options

    const expiryTime = Math.floor(Date.now() / 1000) + (expiryMinutes * 60)

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
