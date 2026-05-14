'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    addDomainToVercel,
    removeDomainFromVercel,
    verifyDomainOnVercel,
    getDomainFromVercel,
} from '@/lib/vercel/domains'
import {
    detectCloudflareNameservers,
    addCnameToCloudflareDns,
    verifyCloudflareCredentials,
    listCloudflareZones,
} from '@/lib/cloudflare/dns'

/**
 * Set a custom domain for the current tenant.
 * Steps:
 *   1. Validate domain format
 *   2. Add domain to Vercel project via API
 *   3. Save domain + verification info to tenants table
 */
export async function setCustomDomain(domain: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    // Get tenant
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }
    if (!['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yönetici yetkisi gereklidir.' }
    }

    // Validate domain format
    const cleanDomain = domain.trim().toLowerCase()
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
    if (!domainRegex.test(cleanDomain)) {
        return { error: 'Geçersiz domain formatı. Örnek: crm.firmaadi.com' }
    }

    // Block reserved domains
    const blocked = ['vercel.app', 'vercel.com', 'novoxcrm.com', 'novocrm.app']
    if (blocked.some(b => cleanDomain.endsWith(b))) {
        return { error: 'Bu domain kullanılamaz.' }
    }

    // Check if domain already used by another tenant
    const { data: existing } = await supabase
        .from('tenants')
        .select('id')
        .eq('custom_domain', cleanDomain)
        .neq('id', profile.tenant_id)
        .single()

    if (existing) {
        return { error: 'Bu domain başka bir hesap tarafından kullanılıyor.' }
    }

    try {
        // 1. Add domain to Vercel
        const vercelResult = await addDomainToVercel(cleanDomain)

        if (vercelResult.error) {
            return { error: `Vercel Hatası: ${vercelResult.error.message}` }
        }

        // 2. Save to database
        const { error: dbError } = await supabase
            .from('tenants')
            .update({
                custom_domain: cleanDomain,
                domain_verified: vercelResult.verified,
                domain_verification_record: {
                    verification: vercelResult.verification || [],
                    added_at: new Date().toISOString(),
                    added_by: user.id,
                },
            })
            .eq('id', profile.tenant_id)

        if (dbError) {
            // Rollback: remove from Vercel
            await removeDomainFromVercel(cleanDomain)
            return { error: 'Veritabanı hatası: ' + dbError.message }
        }

        revalidatePath('/settings')
        return {
            success: true,
            verified: vercelResult.verified,
            verification: vercelResult.verification,
        }
    } catch (err: any) {
        console.error('setCustomDomain Error:', err)
        return { error: err.message || 'Bilinmeyen hata' }
    }
}

/**
 * Check DNS verification status for the current tenant's custom domain.
 */
export async function checkDomainVerification() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('custom_domain, domain_verified')
        .eq('id', profile.tenant_id)
        .single()

    if (!tenant?.custom_domain) return { error: 'Kayıtlı custom domain bulunamadı' }

    try {
        // Verify via Vercel API
        const vercelResult = await verifyDomainOnVercel(tenant.custom_domain)

        // Update DB
        await supabase
            .from('tenants')
            .update({
                domain_verified: vercelResult.verified,
                domain_verification_record: {
                    verification: vercelResult.verification || [],
                    last_checked: new Date().toISOString(),
                },
            })
            .eq('id', profile.tenant_id)

        revalidatePath('/settings')
        return {
            success: true,
            verified: vercelResult.verified,
            verification: vercelResult.verification,
            domain: tenant.custom_domain,
        }
    } catch (err: any) {
        console.error('checkDomainVerification Error:', err)
        return { error: err.message }
    }
}

/**
 * Remove custom domain from the current tenant.
 */
export async function removeCustomDomain() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }
    if (!['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yönetici yetkisi gereklidir.' }
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('custom_domain')
        .eq('id', profile.tenant_id)
        .single()

    if (!tenant?.custom_domain) return { error: 'Silinecek domain bulunamadı' }

    try {
        // 1. Remove from Vercel
        const removeResult = await removeDomainFromVercel(tenant.custom_domain)
        if (!removeResult.success) {
            console.error('Vercel domain removal warning:', removeResult.error)
            // Continue anyway - clean up DB
        }

        // 2. Clear from DB
        const { error: dbError } = await supabase
            .from('tenants')
            .update({
                custom_domain: null,
                domain_verified: false,
                domain_verification_record: {},
            })
            .eq('id', profile.tenant_id)

        if (dbError) return { error: 'Veritabanı hatası: ' + dbError.message }

        revalidatePath('/settings')
        return { success: true }
    } catch (err: any) {
        console.error('removeCustomDomain Error:', err)
        return { error: err.message }
    }
}

/**
 * Get current domain status for the tenant.
 */
export async function getDomainStatus() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return null

    const { data: tenant } = await supabase
        .from('tenants')
        .select('custom_domain, domain_verified, domain_verification_record')
        .eq('id', profile.tenant_id)
        .single()

    return {
        domain: tenant?.custom_domain || null,
        verified: tenant?.domain_verified || false,
        verificationRecord: tenant?.domain_verification_record || {},
    }
}

/**
 * Check if a domain's DNS is managed by Cloudflare.
 */
export async function checkDnsProvider(domain: string) {
    try {
        const isCloudflare = await detectCloudflareNameservers(domain)
        return { provider: isCloudflare ? 'cloudflare' : 'other' }
    } catch (err: any) {
        console.error('DNS Provider Check Error:', err)
        return { provider: 'other' }
    }
}

/**
 * Auto-configure Cloudflare DNS for the custom domain.
 * Adds CNAME record pointing to cname.vercel-dns.com
 */
export async function autoConfigureCloudflare(apiToken: string, zoneId: string, domain: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erisim' }

    // 1. Verify credentials
    const verification = await verifyCloudflareCredentials(apiToken, zoneId)
    if (!verification.valid) {
        return { error: verification.error || 'Cloudflare kimlik bilgileri gecersiz.' }
    }

    // 2. Extract subdomain part for CNAME name
    // e.g., "crm.example.com" → name should be "crm" (Cloudflare auto-appends the zone)
    // But Cloudflare accepts full domain name too
    const recordName = domain // Cloudflare handles this correctly

    // 3. Add CNAME record
    const result = await addCnameToCloudflareDns(apiToken, zoneId, recordName)

    if (!result.success) {
        return { error: result.error || 'DNS kaydi eklenemedi.' }
    }

    return {
        success: true,
        message: `CNAME kaydi basariyla eklendi: ${domain} -> cname.vercel-dns.com`,
        recordId: result.recordId,
    }
}

/**
 * Auto-detect Zone ID from Cloudflare API token.
 */
export async function detectCloudflareZone(apiToken: string, domain: string) {
    try {
        const zones = await listCloudflareZones(apiToken)
        
        // Find matching zone for the domain
        const parts = domain.split('.')
        const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain

        const match = zones.find(z => z.name === rootDomain)

        if (match) {
            return { zoneId: match.id, zoneName: match.name }
        }

        // Return all zones so user can pick
        return { zones, zoneId: null }
    } catch (err: any) {
        return { error: err.message }
    }
}
