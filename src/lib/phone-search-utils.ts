/**
 * Phone number search and matching utilities for CRM.
 * Handles diverse phone formats (e.g. +90 507 883 84 44, 05078838444, 507 883 84 44, etc.)
 * across both SQL (Supabase/PostgREST) queries and client-side filtering.
 */

/**
 * Extracts normalized core digits (e.g., standard 10-digit Turkish mobile '5078838444' or local sequence)
 */
export function extractPhoneCore(rawPhone: string): string {
    if (!rawPhone) return ''
    const trimmed = rawPhone.trim()
    const digits = trimmed.replace(/\D/g, '')
    if (!digits) return ''

    let core = digits
    if (trimmed.startsWith('+90') || trimmed.startsWith('0090') || trimmed.startsWith('90')) {
        core = digits.replace(/^(0090|90)/, '')
    } else if (digits.startsWith('90') && digits.length >= 11) {
        core = digits.slice(2)
    } else if (digits.startsWith('0')) {
        core = digits.replace(/^0+/, '')
    }

    return core || digits
}

/**
 * Generates an array of phone search terms to match in SQL / PostgREST queries
 */
export function getPhoneSearchTerms(query: string): string[] {
    const raw = query.trim()
    if (!raw) return []

    const terms = new Set<string>()
    const cleanRaw = raw.replace(/[,()]/g, '').trim()
    if (cleanRaw) terms.add(cleanRaw)

    const digits = raw.replace(/\D/g, '')
    if (digits) {
        terms.add(digits)

        const core = extractPhoneCore(raw)
        if (core) {
            terms.add(core)
            terms.add(`0${core}`)
            terms.add(`90${core}`)
            terms.add(`+90${core}`)

            if (core.length >= 7) {
                terms.add(core.slice(-7))
            }
            if (core.length >= 10) {
                terms.add(core.slice(-10))
            }

            // Formatted representations with spaces for standard 10-digit numbers (e.g. 507 883 84 44)
            if (core.length === 10) {
                const c1 = core.slice(0, 3)
                const c2 = core.slice(3, 6)
                const c3 = core.slice(6, 8)
                const c4 = core.slice(8, 10)

                // Match with % between chunks (matches ANY formatting / spacing in database!)
                terms.add(`${c1}%${c2}%${c3}%${c4}`)
                terms.add(`0${c1} ${c2} ${c3} ${c4}`)
                terms.add(`${c1} ${c2} ${c3} ${c4}`)
                terms.add(`+90 ${c1} ${c2} ${c3} ${c4}`)
                terms.add(`(${c1}) ${c2} ${c3} ${c4}`)
            } else if (core.length >= 4) {
                // Generates wildcards for partial numbers
                terms.add(core.split('').join('%'))
            }
        }
    }

    return Array.from(terms).filter(Boolean)
}

/**
 * Builds PostgREST `.or(...)` filter string for searching customers table by name, phone, email, etc.
 */
export function buildCustomerSearchFilter(query: string, options?: { includeEmail?: boolean }): string {
    const raw = query.trim()
    if (!raw) return ''

    const cleanRaw = raw.replace(/[,()]/g, '').trim()
    if (!cleanRaw) return ''

    const includeEmail = options?.includeEmail ?? true
    const conditions = new Set<string>()

    // Standard string matching for name and email
    conditions.add(`full_name.ilike.%${cleanRaw}%`)
    if (includeEmail) {
        conditions.add(`email.ilike.%${cleanRaw}%`)
    }

    // Phone search terms
    const phoneTerms = getPhoneSearchTerms(raw)
    phoneTerms.forEach(term => {
        conditions.add(`phone.ilike.%${term}%`)
    })

    return Array.from(conditions).join(',')
}

/**
 * Checks if a customer's phone number matches a search query client-side.
 * Robust against format differences: +90 507..., 0507..., 507..., spaces, dashes, etc.
 */
export function matchCustomerPhone(customerPhone: string | null | undefined, searchQuery: string): boolean {
    if (!customerPhone || !searchQuery) return false

    const cleanPhone = customerPhone.trim().toLowerCase()
    const cleanSearch = searchQuery.trim().toLowerCase()

    // 1. Direct text substring match
    if (cleanPhone.includes(cleanSearch)) return true

    // 2. Digits comparison
    const phoneDigits = customerPhone.replace(/\D/g, '')
    const searchDigits = searchQuery.replace(/\D/g, '')

    if (!phoneDigits || !searchDigits) return false

    // Direct digit substring
    if (phoneDigits.includes(searchDigits) || searchDigits.includes(phoneDigits)) return true

    // 3. Core normalized comparison (strip +90, 0, etc.)
    const phoneCore = extractPhoneCore(customerPhone)
    const searchCore = extractPhoneCore(searchQuery)

    if (phoneCore && searchCore) {
        if (phoneCore.includes(searchCore) || searchCore.includes(phoneCore)) return true

        // Last 7 digits match
        if (phoneCore.length >= 7 && searchCore.length >= 7) {
            const p7 = phoneCore.slice(-7)
            const s7 = searchCore.slice(-7)
            if (p7.includes(s7) || s7.includes(p7)) return true
        }

        // 10 digits match
        if (phoneCore.length >= 10 && searchCore.length >= 10) {
            if (phoneCore.slice(-10) === searchCore.slice(-10)) return true
        }
    }

    return false
}

/**
 * Checks if a customer object matches a search query across name, phone, email, or customer number.
 */
export function matchCustomerSearch(
    customer: { full_name?: string | null; phone?: string | null; email?: string | null; customer_number?: string | null } | null | undefined,
    query: string
): boolean {
    if (!customer) return false
    const q = (query || '').trim().toLowerCase()
    if (!q) return true

    if (customer.full_name && customer.full_name.toLowerCase().includes(q)) return true
    if (customer.email && customer.email.toLowerCase().includes(q)) return true
    if (customer.customer_number && customer.customer_number.toLowerCase().includes(q)) return true
    if (matchCustomerPhone(customer.phone, query)) return true

    return false
}
