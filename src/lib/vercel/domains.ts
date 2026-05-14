/**
 * Vercel Domains API Client
 * 
 * Used to programmatically add/remove/verify custom domains
 * for multi-tenant white-label support.
 * 
 * Required env vars:
 *   VERCEL_API_TOKEN  - Vercel API Bearer token (from Account Settings → Tokens)
 *   VERCEL_PROJECT_ID - The Vercel project ID (from Project Settings → General)
 *   VERCEL_TEAM_ID    - (Optional) Team ID if project is under a team
 */

const VERCEL_API_BASE = 'https://api.vercel.com'

function getHeaders() {
    // Strip out any non-ASCII characters (like →) that might have been accidentally copied into the env var
    const token = process.env.VERCEL_API_TOKEN?.replace(/[^\x20-\x7E]/g, '').trim()
    if (!token) throw new Error('VERCEL_API_TOKEN is not configured')
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }
}

function getProjectId() {
    const projectId = process.env.VERCEL_PROJECT_ID?.replace(/[^\x20-\x7E]/g, '').trim()
    if (!projectId) throw new Error('VERCEL_PROJECT_ID is not configured')
    return projectId
}

function getTeamQuery() {
    const teamId = process.env.VERCEL_TEAM_ID?.replace(/[^\x20-\x7E]/g, '').trim()
    return teamId ? `?teamId=${teamId}` : ''
}

export interface VercelDomainResponse {
    name: string
    verified: boolean
    verification?: {
        type: string
        domain: string
        value: string
        reason: string
    }[]
    error?: {
        code: string
        message: string
    }
}

export interface VercelDomainConfig {
    configuredBy: string | null
    acceptedChallenges: string[]
    misconfigured: boolean
}

/**
 * Add a custom domain to the Vercel project.
 * After adding, the tenant must configure DNS (CNAME → cname.vercel-dns.com).
 */
export async function addDomainToVercel(domain: string): Promise<VercelDomainResponse> {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const res = await fetch(
        `${VERCEL_API_BASE}/v10/projects/${projectId}/domains${teamQuery}`,
        {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name: domain }),
        }
    )

    const data = await res.json()

    if (!res.ok) {
        console.error('Vercel Add Domain Error:', data)
        return {
            name: domain,
            verified: false,
            error: {
                code: data.error?.code || 'UNKNOWN',
                message: data.error?.message || 'Domain eklenirken bir hata oluştu.',
            },
        }
    }

    return {
        name: data.name,
        verified: data.verified || false,
        verification: data.verification || [],
    }
}

/**
 * Remove a custom domain from the Vercel project.
 */
export async function removeDomainFromVercel(domain: string): Promise<{ success: boolean; error?: string }> {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const res = await fetch(
        `${VERCEL_API_BASE}/v10/projects/${projectId}/domains/${domain}${teamQuery}`,
        {
            method: 'DELETE',
            headers: getHeaders(),
        }
    )

    if (!res.ok) {
        const data = await res.json()
        console.error('Vercel Remove Domain Error:', data)
        return { success: false, error: data.error?.message || 'Domain kaldırılırken hata oluştu.' }
    }

    return { success: true }
}

/**
 * Get domain info and verification status from Vercel.
 */
export async function getDomainFromVercel(domain: string): Promise<VercelDomainResponse | null> {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const res = await fetch(
        `${VERCEL_API_BASE}/v10/projects/${projectId}/domains/${domain}${teamQuery}`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    )

    if (!res.ok) {
        return null
    }

    const data = await res.json()
    return {
        name: data.name,
        verified: data.verified || false,
        verification: data.verification || [],
    }
}

/**
 * Verify (refresh) domain DNS configuration status.
 */
export async function verifyDomainOnVercel(domain: string): Promise<VercelDomainResponse> {
    const projectId = getProjectId()
    const teamQuery = getTeamQuery()

    const res = await fetch(
        `${VERCEL_API_BASE}/v10/projects/${projectId}/domains/${domain}/verify${teamQuery}`,
        {
            method: 'POST',
            headers: getHeaders(),
        }
    )

    const data = await res.json()

    return {
        name: data.name || domain,
        verified: data.verified || false,
        verification: data.verification || [],
        error: data.error ? { code: data.error.code, message: data.error.message } : undefined,
    }
}

/**
 * Get domain configuration (to check if DNS is properly set up).
 */
export async function getDomainConfig(domain: string): Promise<VercelDomainConfig | null> {
    const teamQuery = getTeamQuery()

    const res = await fetch(
        `${VERCEL_API_BASE}/v6/domains/${domain}/config${teamQuery}`,
        {
            method: 'GET',
            headers: getHeaders(),
        }
    )

    if (!res.ok) return null

    const data = await res.json()
    return {
        configuredBy: data.configuredBy || null,
        acceptedChallenges: data.acceptedChallenges || [],
        misconfigured: data.misconfigured || false,
    }
}
