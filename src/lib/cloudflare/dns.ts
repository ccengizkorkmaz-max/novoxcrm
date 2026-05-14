/**
 * Cloudflare DNS API Client
 * 
 * Used to automatically add CNAME records for custom domains
 * when the tenant's domain is managed by Cloudflare.
 * 
 * Cloudflare API Docs: https://developers.cloudflare.com/api
 */

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

interface CloudflareResult {
    success: boolean
    error?: string
    recordId?: string
}

/**
 * Add a CNAME record to a Cloudflare zone.
 * Points the subdomain to cname.vercel-dns.com
 */
export async function addCnameToCloudflareDns(
    apiToken: string,
    zoneId: string,
    recordName: string, // e.g., "crm" for crm.example.com
    target: string = 'cname.vercel-dns.com'
): Promise<CloudflareResult> {
    try {
        // First check if record already exists
        const existingRes = await fetch(
            `${CF_API_BASE}/zones/${zoneId}/dns_records?type=CNAME&name=${recordName}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const existingData = await existingRes.json()

        if (existingData.result && existingData.result.length > 0) {
            // Update existing record
            const recordId = existingData.result[0].id
            const updateRes = await fetch(
                `${CF_API_BASE}/zones/${zoneId}/dns_records/${recordId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'CNAME',
                        name: recordName,
                        content: target,
                        proxied: false, // Must be DNS-only for Vercel
                        ttl: 1, // Auto
                    }),
                }
            )

            const updateData = await updateRes.json()
            if (!updateData.success) {
                return {
                    success: false,
                    error: updateData.errors?.[0]?.message || 'DNS kaydı güncellenemedi.',
                }
            }

            return { success: true, recordId }
        }

        // Create new CNAME record
        const createRes = await fetch(
            `${CF_API_BASE}/zones/${zoneId}/dns_records`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'CNAME',
                    name: recordName,
                    content: target,
                    proxied: false, // DNS-only mode — required for Vercel
                    ttl: 1, // Auto
                }),
            }
        )

        const createData = await createRes.json()

        if (!createData.success) {
            return {
                success: false,
                error: createData.errors?.[0]?.message || 'DNS kaydı oluşturulamadı.',
            }
        }

        return { success: true, recordId: createData.result?.id }
    } catch (err: any) {
        console.error('Cloudflare DNS Error:', err)
        return { success: false, error: err.message }
    }
}

/**
 * Verify Cloudflare API token and Zone ID are valid.
 */
export async function verifyCloudflareCredentials(
    apiToken: string,
    zoneId: string
): Promise<{ valid: boolean; zoneName?: string; error?: string }> {
    try {
        const res = await fetch(
            `${CF_API_BASE}/zones/${zoneId}`,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await res.json()

        if (!data.success) {
            return {
                valid: false,
                error: data.errors?.[0]?.message || 'Cloudflare kimlik dogrulamasi basarisiz.',
            }
        }

        return {
            valid: true,
            zoneName: data.result?.name,
        }
    } catch (err: any) {
        return { valid: false, error: err.message }
    }
}

/**
 * Detect if a domain uses Cloudflare nameservers.
 * Uses Google DNS-over-HTTPS API to query NS records.
 */
export async function detectCloudflareNameservers(domain: string): Promise<boolean> {
    try {
        // Extract root domain (e.g., "crm.example.com" → "example.com")
        const parts = domain.split('.')
        const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain

        const res = await fetch(
            `https://dns.google/resolve?name=${rootDomain}&type=NS`,
            { headers: { 'Accept': 'application/dns-json' } }
        )

        const data = await res.json()

        if (data.Answer && data.Answer.length > 0) {
            return data.Answer.some((record: any) =>
                typeof record.data === 'string' && record.data.includes('cloudflare')
            )
        }

        return false
    } catch (err) {
        console.error('NS detection error:', err)
        return false
    }
}

/**
 * List Cloudflare zones accessible with the given API token.
 * Useful for auto-detecting Zone ID.
 */
export async function listCloudflareZones(
    apiToken: string
): Promise<{ id: string; name: string }[]> {
    try {
        const res = await fetch(
            `${CF_API_BASE}/zones?per_page=50&status=active`,
            {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        )

        const data = await res.json()

        if (!data.success) return []

        return (data.result || []).map((z: any) => ({
            id: z.id,
            name: z.name,
        }))
    } catch {
        return []
    }
}
