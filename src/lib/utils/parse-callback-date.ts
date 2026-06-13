/**
 * Türkçe relative tarih/saat ifadelerini ISO timestamp'e dönüştürür.
 * 
 * Örnekler:
 *   "yarın saat 5"        → yarın 17:00
 *   "yarın öğlen"         → yarın 12:00
 *   "akşam 6 buçuk"       → bugün 18:30
 *   "yarın saat 10 gibi"  → yarın 10:00
 *   "bugün saat 3"        → bugün 15:00
 *   null                  → yarın 10:00 (varsayılan)
 */

const ISTANBUL_TZ = 'Europe/Istanbul'

/**
 * Returns the current time in Istanbul timezone as a Date object
 */
function nowInIstanbul(): Date {
    return new Date(new Date().toLocaleString('en-US', { timeZone: ISTANBUL_TZ }))
}

/**
 * Parses a Turkish relative date/time expression into an ISO timestamp string.
 * Falls back to tomorrow 10:00 Istanbul time if parsing fails.
 */
export function parseCallbackDate(input: string | null | undefined): string {
    const now = nowInIstanbul()
    const fallback = new Date(now)
    fallback.setDate(fallback.getDate() + 1)
    fallback.setHours(10, 0, 0, 0)

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return toIstanbulISO(fallback)
    }

    const text = input.toLowerCase().trim()
        .replace(/ö/g, 'o')
        .replace(/ü/g, 'u')
        .replace(/ç/g, 'c')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ı/g, 'i')

    // Determine base date
    let baseDate = new Date(now)

    if (text.includes('yarin')) {
        baseDate.setDate(baseDate.getDate() + 1)
    } else if (text.includes('obur gun') || text.includes('oburgunu')) {
        baseDate.setDate(baseDate.getDate() + 2)
    } else if (text.includes('pazartesi')) {
        baseDate = getNextWeekday(now, 1)
    } else if (text.includes('sali')) {
        baseDate = getNextWeekday(now, 2)
    } else if (text.includes('carsamba')) {
        baseDate = getNextWeekday(now, 3)
    } else if (text.includes('persembe')) {
        baseDate = getNextWeekday(now, 4)
    } else if (text.includes('cuma')) {
        baseDate = getNextWeekday(now, 5)
    }
    // "bugün" or no day specifier → keep today

    // Determine time
    let hours = -1
    let minutes = 0

    // Check for time keywords
    if (text.includes('oglen') || text.includes('ogle')) {
        hours = 12
    } else if (text.includes('sabah')) {
        hours = 9
        // Check for number after "sabah"
        const sabahMatch = text.match(/sabah\s*(\d{1,2})/)
        if (sabahMatch) hours = parseInt(sabahMatch[1])
    } else if (text.includes('aksam')) {
        hours = 18
        // Check for number after "aksam"
        const aksamMatch = text.match(/aksam\s*(\d{1,2})/)
        if (aksamMatch) {
            hours = parseInt(aksamMatch[1])
            if (hours < 12) hours += 12 // "aksam 6" → 18
        }
    }

    // Check for "buçuk" (half)
    if (text.includes('bucuk')) {
        minutes = 30
    }

    // Try to find explicit hour number: "saat 5", "saat 10", "15:00", "3 gibi"
    const saatMatch = text.match(/saat\s*(\d{1,2})(?::(\d{2}))?/)
    if (saatMatch) {
        hours = parseInt(saatMatch[1])
        if (saatMatch[2]) minutes = parseInt(saatMatch[2])
    }

    // "3 gibi", "5 gibi" — standalone number
    if (hours === -1) {
        const gibiMatch = text.match(/(\d{1,2})\s*gibi/)
        if (gibiMatch) {
            hours = parseInt(gibiMatch[1])
        }
    }

    // Bare number patterns: "saat uc", "on gibi" — try digit extraction as fallback
    if (hours === -1) {
        const bareNumber = text.match(/(\d{1,2})/)
        if (bareNumber) {
            hours = parseInt(bareNumber[1])
        }
    }

    // Turkish number words
    if (hours === -1) {
        const numberWords: Record<string, number> = {
            'bir': 1, 'iki': 2, 'uc': 3, 'dort': 4, 'bes': 5,
            'alti': 6, 'yedi': 7, 'sekiz': 8, 'dokuz': 9, 'on': 10,
            'on bir': 11, 'on iki': 12
        }
        for (const [word, num] of Object.entries(numberWords).sort((a, b) => b[0].length - a[0].length)) {
            if (text.includes(word)) {
                hours = num
                break
            }
        }
    }

    // Smart AM/PM logic: business hours assumption
    if (hours > 0 && hours <= 7) {
        // "saat 5" in business context → 17:00 not 05:00
        // Unless "sabah" was explicitly mentioned
        if (!text.includes('sabah')) {
            hours += 12
        }
    }

    // Fallback: no time detected → 10:00
    if (hours === -1) {
        hours = 10
    }

    baseDate.setHours(hours, minutes, 0, 0)

    // If the computed time is in the past, push to tomorrow
    if (baseDate.getTime() <= now.getTime()) {
        baseDate.setDate(baseDate.getDate() + 1)
    }

    return toIstanbulISO(baseDate)
}

function getNextWeekday(from: Date, targetDay: number): Date {
    const result = new Date(from)
    const currentDay = result.getDay()
    let daysUntil = targetDay - currentDay
    if (daysUntil <= 0) daysUntil += 7
    result.setDate(result.getDate() + daysUntil)
    return result
}

function toIstanbulISO(date: Date): string {
    // Convert local-like Date back to UTC-aware ISO string
    // The date object is in Istanbul-like local time, so we create a proper UTC timestamp
    const istanbulOffset = getIstanbulOffsetMs()
    const utcTime = date.getTime() - istanbulOffset + new Date().getTimezoneOffset() * 60000
    return new Date(utcTime).toISOString()
}

function getIstanbulOffsetMs(): number {
    // Turkey is UTC+3 (no DST since 2016)
    return 3 * 60 * 60 * 1000
}
