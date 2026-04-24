import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import path from 'path'
import fs from 'fs'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        // Auth check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'admin' && profile?.role !== 'owner') {
            return NextResponse.json({ error: 'Bu işlemi sadece yönetici yapabilir.' }, { status: 403 })
        }

        // Load service account key
        const keyFilePath = path.join(process.cwd(), 'google-indexer-key.json')
        if (!fs.existsSync(keyFilePath)) {
            return NextResponse.json({ error: 'Google Service Account key dosyası bulunamadı.' }, { status: 500 })
        }

        const SITE_URL = 'https://novoxcrm.com'
        const SITEMAP_URL = 'https://novoxcrm.com/sitemap.xml'

        // Authenticate
        const auth = new google.auth.GoogleAuth({
            keyFile: keyFilePath,
            scopes: ['https://www.googleapis.com/auth/webmasters'],
        })

        const authClient = await auth.getClient()
        const webmasters = google.webmasters({ version: 'v3', auth: authClient as any })

        // Submit sitemap
        await webmasters.sitemaps.submit({
            siteUrl: SITE_URL,
            feedpath: SITEMAP_URL,
        })

        // List sitemaps
        let sitemaps: any[] = []
        try {
            const res = await webmasters.sitemaps.list({ siteUrl: SITE_URL })
            sitemaps = res.data.sitemap || []
        } catch (listErr: any) {
            console.log('Could not list sitemaps:', listErr.message)
        }

        return NextResponse.json({
            success: true,
            message: `Sitemap ${SITEMAP_URL} Google Search Console'a başarıyla gönderildi.`,
            sitemaps: sitemaps.map(sm => ({
                path: sm.path,
                lastDownloaded: sm.lastDownloaded,
                warnings: sm.warnings,
                errors: sm.errors,
                contents: sm.contents,
            }))
        })

    } catch (error: any) {
        console.error('Submit sitemap error:', error)
        return NextResponse.json({
            error: error.message || 'Sitemap gönderilemedi.',
            details: error.response?.data
        }, { status: 500 })
    }
}
