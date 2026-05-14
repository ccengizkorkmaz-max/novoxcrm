import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    addDomainToVercel,
    removeDomainFromVercel,
    verifyDomainOnVercel,
} from '@/lib/vercel/domains'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action, domain } = body

        // Get tenant
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return NextResponse.json({ error: 'Tenant not found' })
        if (!['owner', 'admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Yetkisiz' })
        }

        // --- SET DOMAIN ---
        if (action === 'set') {
            const cleanDomain = domain.trim().toLowerCase()
            const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/
            if (!domainRegex.test(cleanDomain)) {
                return NextResponse.json({ error: 'Gecersiz domain formati' })
            }

            const blocked = ['vercel.app', 'vercel.com', 'novoxcrm.com', 'novocrm.app']
            if (blocked.some(b => cleanDomain.endsWith(b))) {
                return NextResponse.json({ error: 'Bu domain kullanilamaz' })
            }

            // Check uniqueness
            const { data: existing } = await supabase
                .from('tenants')
                .select('id')
                .eq('custom_domain', cleanDomain)
                .neq('id', profile.tenant_id)
                .single()

            if (existing) {
                return NextResponse.json({ error: 'Bu domain baska bir hesap tarafindan kullaniliyor' })
            }

            // Add to Vercel
            const vercelResult = await addDomainToVercel(cleanDomain)
            if (vercelResult.error) {
                return NextResponse.json({ error: `Vercel: ${vercelResult.error.message}` })
            }

            // Save to DB
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
                await removeDomainFromVercel(cleanDomain)
                return NextResponse.json({ error: 'DB hatasi: ' + dbError.message })
            }

            revalidatePath('/settings')
            return NextResponse.json({
                success: true,
                verified: vercelResult.verified,
                verification: vercelResult.verification,
            })
        }

        // --- VERIFY DOMAIN ---
        if (action === 'verify') {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('custom_domain')
                .eq('id', profile.tenant_id)
                .single()

            if (!tenant?.custom_domain) {
                return NextResponse.json({ error: 'Domain bulunamadi' })
            }

            const vercelResult = await verifyDomainOnVercel(tenant.custom_domain)

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
            return NextResponse.json({
                success: true,
                verified: vercelResult.verified,
                verification: vercelResult.verification,
                domain: tenant.custom_domain,
            })
        }

        // --- REMOVE DOMAIN ---
        if (action === 'remove') {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('custom_domain')
                .eq('id', profile.tenant_id)
                .single()

            if (!tenant?.custom_domain) {
                return NextResponse.json({ error: 'Silinecek domain yok' })
            }

            await removeDomainFromVercel(tenant.custom_domain)

            await supabase
                .from('tenants')
                .update({
                    custom_domain: null,
                    domain_verified: false,
                    domain_verification_record: {},
                })
                .eq('id', profile.tenant_id)

            revalidatePath('/settings')
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    } catch (err: any) {
        console.error('Domain API Error:', err)
        return NextResponse.json({ error: err.message || 'Sunucu hatasi' }, { status: 500 })
    }
}
