/**
 * Turkey Timezone (Europe/Istanbul - UTC+3) Date & Time Utilities
 * Provides standardized formatting, parsing and local datetime-local helpers
 * ensuring all screens and reports consistently display accurate Turkey time.
 */

export const TURKEY_TIMEZONE = 'Europe/Istanbul'

export type TurkeyDateFormat = 'compact' | 'short' | 'long' | 'date' | 'time' | 'full' | 'dayMonth' | 'dateTime'

/**
 * Formats any date string or Date object into Turkey Timezone string
 */
export function formatTurkeyDateTime(
    date: string | number | Date | null | undefined,
    formatType: TurkeyDateFormat = 'compact'
): string {
    if (!date) return ''
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    if (isNaN(d.getTime())) return ''

    switch (formatType) {
        case 'time': // "15:30"
            return d.toLocaleTimeString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'date': // "05.09.2026"
            return d.toLocaleDateString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            })

        case 'dayMonth': // "5 Eyl"
            return d.toLocaleDateString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: 'numeric',
                month: 'short'
            })

        case 'short': // "5 Eyl, 15:30"
            return d.toLocaleString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'dateTime': // "05.09.2026 15:30"
            return d.toLocaleString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'long': // "5 Eylül 2026 Cumartesi, 15:30"
            return d.toLocaleString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'full': // "5 Eylül 2026 15:30"
            return d.toLocaleString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })

        case 'compact': // "05 Eyl 2026 15:30"
        default:
            return d.toLocaleString('tr-TR', {
                timeZone: TURKEY_TIMEZONE,
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            })
    }
}

/**
 * Converts a UTC Date/ISO String into YYYY-MM-DDTHH:mm string in Turkey Time
 * Safe for <input type="datetime-local" defaultValue={...} />
 */
export function toTurkeyDateTimeLocal(date?: string | number | Date | null): string {
    const d = date ? (typeof date === 'string' || typeof date === 'number' ? new Date(date) : date) : new Date()
    if (isNaN(d.getTime())) return ''

    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: TURKEY_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })

    return formatter.format(d).replace(' ', 'T')
}

/**
 * Converts a <input type="datetime-local"> value (YYYY-MM-DDTHH:mm) into a UTC ISO string
 * assuming the input was entered in Turkey Time (UTC+3).
 */
export function fromTurkeyDateTimeLocal(val: string | null | undefined): string | null {
    if (!val || typeof val !== 'string' || val.trim() === '') return null
    const trimmed = val.trim()

    // If already an ISO string with Z or explicit offset, parse directly
    if (trimmed.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
        const d = new Date(trimmed)
        return isNaN(d.getTime()) ? null : d.toISOString()
    }

    // Input from datetime-local is "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
    const isoWithOffset = trimmed.length === 16 ? `${trimmed}:00+03:00` : `${trimmed}+03:00`
    const d = new Date(isoWithOffset)
    return isNaN(d.getTime()) ? null : d.toISOString()
}

/**
 * Checks if a date in Turkey Time is in the past compared to current Turkey time
 */
export function isPastTurkey(date: string | Date | null | undefined): boolean {
    if (!date) return false
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) return false
    return d.getTime() < Date.now()
}
