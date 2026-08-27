import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * NetGSM Netsantral CDR (Call Detail Record) API Proxy
 * 
 * Temsilci Takibi sayfasından çağrılır.
 * Müşteri telefon numarasına göre son N günlük arama geçmişini sorgular.
 * 
 * GET /api/netgsm-cdr?phone=5551234567&days=7
 * 
 * NetGSM CDR API kısıtlamaları:
 * - Max 24 saatlik aralık per request
 * - Max 2 request/dakika rate limit
 * - Date format: ddMMyyyyHHmm
 */

export const dynamic = 'force-dynamic'

interface CDRRecord {
    uniqueid: string
    date: string
    destination: string
    source: string
    duration: string
    direction: number
    recording?: string
    playerUrl?: string
}

// Parse the recording URL to extract player parameters
function buildPlayerUrl(recordingUrl: string): string | null {
    if (!recordingUrl) return null
    try {
        const url = new URL(recordingUrl)
        const tip = url.searchParams.get('tip') || '1'
        // CDR API returns 'a' param, Webhook returns 'q' param
        const a = url.searchParams.get('a')
        const q = url.searchParams.get('q')
        if (a) {
            return `https://dosyaindir.netgsm.com.tr/player/?tip=${tip}&y=${a}`
        }
        if (q) {
            return `https://dosyaindir.netgsm.com.tr/player/?tip=${tip}&q=${q}`
        }
        return null
    } catch {
        return null
    }
}

// Format date to NetGSM format: ddMMyyyyHHmm
function formatNetgsmDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0')
    const MM = String(date.getMonth() + 1).padStart(2, '0')
    const yyyy = date.getFullYear()
    const HH = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${dd}${MM}${yyyy}${HH}${mm}`
}

// Normalize Turkish phone numbers for comparison
function normalizePhone(phone: string): string {
    if (!phone) return ''
    let digits = phone.replace(/\D/g, '')
    // Remove leading country code
    if (digits.startsWith('90') && digits.length > 10) {
        digits = digits.substring(2)
    }
    if (digits.startsWith('0') && digits.length > 10) {
        digits = digits.substring(1)
    }
    return digits
}

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        // Auth check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
        }

        // Only admins/owners/managers can access
        if (!['admin', 'owner', 'manager'].includes(profile.role)) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
        }

        // Get NetGSM credentials from tenant (CDR-specific fields preferred, SIP fields as fallback)
        const { data: tenant } = await supabase
            .from('tenants')
            .select('netgsm_cdr_usercode, netgsm_cdr_password, netgsm_sip_username, netgsm_sip_password')
            .eq('id', profile.tenant_id)
            .single()

        const cdrUsercode = tenant?.netgsm_cdr_usercode || tenant?.netgsm_sip_username
        const cdrPassword = tenant?.netgsm_cdr_password || tenant?.netgsm_sip_password

        if (!cdrUsercode || !cdrPassword) {
            return NextResponse.json(
                { error: 'NetGSM CDR ayarları yapılandırılmamış. Ayarlar > Arama Kayıtları bölümünden yapılandırın.' },
                { status: 400 }
            )
        }

        // Parse query params
        const { searchParams } = new URL(req.url)
        const phone = searchParams.get('phone')
        const days = parseInt(searchParams.get('days') || '7')

        if (!phone) {
            return NextResponse.json({ error: 'Telefon numarası gerekli' }, { status: 400 })
        }

        const normalizedPhone = normalizePhone(phone)
        if (normalizedPhone.length < 10) {
            return NextResponse.json({ error: 'Geçersiz telefon numarası' }, { status: 400 })
        }

        // Normalize phone for matching: strip +90, leading 0 — keep as 10-digit 5xxxxxxxxx
        const phoneDigits = normalizedPhone.replace(/^\+?90/, '').replace(/^0/, '')

        // NetGSM CDR API has a 24-hour limit per request
        // We'll query day-by-day for the last N days
        const allRecords: CDRRecord[] = []
        const now = new Date()
        const maxDays = Math.min(days, 30) // Cap at 30 days

        // Helper: check if a CDR source/destination matches the searched phone
        const matchesPhone = (value: string): boolean => {
            if (!value) return false
            // Strip +90, leading 0, spaces, dashes
            const cleaned = value.replace(/[\s\-\(\)]/g, '').replace(/^\+?90/, '').replace(/^0/, '')
            // Also strip extension prefixes like "101-"
            const withoutExt = cleaned.replace(/^\d{3}-/, '')
            return cleaned.includes(phoneDigits) || withoutExt.includes(phoneDigits) || phoneDigits.includes(cleaned)
        }

        // Query both incoming and outgoing calls WITHOUT 'no' filter
        // NetGSM 'no' param filters by extension, not external phone number
        // querytype=2: tüm aramalar (gelen+giden)
        for (let dayOffset = 0; dayOffset < maxDays; dayOffset++) {
            const endDate = new Date(now)
            endDate.setDate(now.getDate() - dayOffset)
            endDate.setHours(23, 59, 0, 0)

            const startDate = new Date(now)
            startDate.setDate(now.getDate() - dayOffset)
            startDate.setHours(0, 0, 0, 0)

            const startStr = formatNetgsmDate(startDate)
            const stopStr = formatNetgsmDate(endDate)

            // Query all calls (querytype=2 returns all)
            try {
                const url = `https://api.netgsm.com.tr/netsantral/report?` +
                    `usercode=${encodeURIComponent(cdrUsercode)}` +
                    `&password=${encodeURIComponent(cdrPassword)}` +
                    `&startdate=${startStr}` +
                    `&stopdate=${stopStr}` +
                    `&querytype=2` +
                    `&output=json`

                const res = await fetch(url, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                })

                if (res.ok) {
                    const data = await res.json()
                    if (Array.isArray(data)) {
                        for (const group of data) {
                            if (group.values && Array.isArray(group.values)) {
                                for (const val of group.values) {
                                    // Filter: match source or destination against searched phone
                                    if (matchesPhone(val.source) || matchesPhone(val.destination)) {
                                        const exists = allRecords.some(r => r.uniqueid === group.uniqueid)
                                        if (!exists) {
                                            const playerUrl = val.recording ? buildPlayerUrl(val.recording) : null
                                            allRecords.push({
                                                uniqueid: group.uniqueid,
                                                date: val.date,
                                                destination: val.destination,
                                                source: val.source,
                                                duration: val.duration,
                                                direction: val.direction ?? 0,
                                                recording: val.recording || undefined,
                                                playerUrl: playerUrl || undefined,
                                            })
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(`[netgsm-cdr] Query error for day ${dayOffset}:`, err)
            }

            // Rate limit: small delay between day queries
            if (dayOffset < maxDays - 1) {
                await new Promise(resolve => setTimeout(resolve, 600))
            }
        }

        // Sort by date descending
        allRecords.sort((a, b) => {
            try {
                // Format: "29.07.2019 18:23:23"
                const parseDate = (d: string) => {
                    const [datePart, timePart] = d.split(' ')
                    const [day, month, year] = datePart.split('.')
                    return new Date(`${year}-${month}-${day}T${timePart}`)
                }
                return parseDate(b.date).getTime() - parseDate(a.date).getTime()
            } catch {
                return 0
            }
        })

        return NextResponse.json({
            records: allRecords,
            total: allRecords.length,
            hasRecordings: allRecords.some(r => !!r.recording),
        })

    } catch (error: any) {
        console.error('[netgsm-cdr] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Bir hata oluştu' },
            { status: 500 }
        )
    }
}
