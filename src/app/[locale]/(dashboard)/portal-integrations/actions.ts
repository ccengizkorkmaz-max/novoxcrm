'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * İlân Portalı Entegrasyon Ayarları
 * 
 * ⚠️ NOT: Sahibinden.com ve Hepsiemlak KAMUYA AÇIK REST API sunmuyor.
 * Entegrasyon için:
 * - Sahibinden: "Kurumsal Hesap" ile API erişim başvurusu yapılması gerekiyor
 * - Hepsiemlak: Kurumsal ortaklık sözleşmesi gerekiyor
 * - Emlakjet: API mevcut ancak kurumsal hesap gerekiyor
 * 
 * Bu modül, API erişimi sağlandığında hazır olacak şekilde yapılandırılmıştır.
 * Manuel XML/FEED export ile birçok portal desteklenebilir.
 */

export interface PortalConfig {
    id: string
    name: string
    slug: string
    logo: string
    apiStatus: 'not_configured' | 'pending' | 'active' | 'error'
    apiKey?: string
    feedUrl?: string
    lastSync?: string
    publishedCount: number
    supportsFeed: boolean
    supportsApi: boolean
    website: string
    notes: string
}

const PORTAL_DEFINITIONS: Omit<PortalConfig, 'apiStatus' | 'apiKey' | 'feedUrl' | 'lastSync' | 'publishedCount'>[] = [
    {
        id: 'sahibinden',
        name: 'Sahibinden.com',
        slug: 'sahibinden',
        logo: '🏠',
        supportsFeed: true,
        supportsApi: false,
        website: 'https://www.sahibinden.com',
        notes: 'Kurumsal hesap ile XML feed destekler. API erişimi için kurumsal@sahibinden.com adresine başvuru yapmanız gerekmektedir.',
    },
    {
        id: 'hepsiemlak',
        name: 'Hepsiemlak',
        slug: 'hepsiemlak',
        logo: '🏘️',
        supportsFeed: true,
        supportsApi: false,
        website: 'https://www.hepsiemlak.com',
        notes: 'Kurumsal ortaklık sözleşmesi gerektirir. XML Feed ile toplu ilan aktarımı desteklenir.',
    },
    {
        id: 'emlakjet',
        name: 'Emlakjet',
        slug: 'emlakjet',
        logo: '🚀',
        supportsFeed: true,
        supportsApi: true,
        website: 'https://www.emlakjet.com',
        notes: 'Kurumsal hesap ile API erişimi sağlanabilir. REST API mevcuttur.',
    },
    {
        id: 'hurriyet_emlak',
        name: 'Hürriyet Emlak',
        slug: 'hurriyet-emlak',
        logo: '📰',
        supportsFeed: true,
        supportsApi: false,
        website: 'https://www.hurriyetemlak.com',
        notes: 'XML feed ile toplu ilan aktarımı. Kurumsal bayi sözleşmesi gerekli.',
    },
]

// Get all portals with status
export async function getPortalConfigs(): Promise<PortalConfig[]> {
    // In production, we would store portal configs in DB.
    // For now, return the definitions with default status.
    return PORTAL_DEFINITIONS.map(p => ({
        ...p,
        apiStatus: 'not_configured' as const,
        publishedCount: 0,
    }))
}

// Generate XML feed for portals
export async function generatePortfolioFeed(format: 'xml' | 'json' = 'xml') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const { data: portfolios } = await supabase
        .from('portfolios')
        .select('*, portfolio_images(url, is_cover)')
        .eq('status', 'active')

    if (!portfolios || portfolios.length === 0) {
        return { success: false, error: 'Aktif portföy yok', data: null }
    }

    const items = portfolios.map(p => ({
        id: p.id,
        title: p.title || `${p.property_type} - ${p.district}, ${p.city}`,
        description: p.description || '',
        price: p.price,
        currency: p.currency || 'TRY',
        listing_type: p.listing_type, // sale / rent
        property_type: p.property_type,
        room_count: p.room_count,
        area_gross: p.area_gross,
        area_net: p.area_net,
        floor: p.floor,
        total_floors: p.total_floors,
        building_age: p.building_age,
        heating_type: p.features?.heating || null,
        city: p.city,
        district: p.district,
        neighborhood: p.neighborhood,
        address: p.address,
        latitude: p.latitude,
        longitude: p.longitude,
        images: p.portfolio_images?.sort((a: any, b: any) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0)).map((img: any) => img.url) || [],
        features: Object.entries(p.features || {}).filter(([k, v]) => k !== 'heating' && v).map(([k]) => k),
        created_at: p.created_at,
        updated_at: p.updated_at,
    }))

    if (format === 'json') {
        return { success: true, data: JSON.stringify(items, null, 2), count: items.length, format: 'json' }
    }

    // Generate XML feed
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<listings>
  <metadata>
    <generated_at>${new Date().toISOString()}</generated_at>
    <total_count>${items.length}</total_count>
    <source>NOVOCRM</source>
  </metadata>
  ${items.map(item => `
  <listing>
    <id>${item.id}</id>
    <title><![CDATA[${item.title}]]></title>
    <description><![CDATA[${item.description}]]></description>
    <price>${item.price}</price>
    <currency>${item.currency}</currency>
    <listing_type>${item.listing_type}</listing_type>
    <property_type>${item.property_type}</property_type>
    <room_count>${item.room_count || ''}</room_count>
    <area_gross>${item.area_gross || ''}</area_gross>
    <area_net>${item.area_net || ''}</area_net>
    <floor>${item.floor || ''}</floor>
    <total_floors>${item.total_floors || ''}</total_floors>
    <building_age>${item.building_age || ''}</building_age>
    <heating_type>${item.heating_type || ''}</heating_type>
    <location>
      <city>${item.city || ''}</city>
      <district>${item.district || ''}</district>
      <neighborhood>${item.neighborhood || ''}</neighborhood>
      <address><![CDATA[${item.address || ''}]]></address>
      ${item.latitude ? `<latitude>${item.latitude}</latitude>` : ''}
      ${item.longitude ? `<longitude>${item.longitude}</longitude>` : ''}
    </location>
    <images>
      ${item.images.map((url: string) => `<image>${url}</image>`).join('\n      ')}
    </images>
    <features>
      ${item.features.map((f: string) => `<feature>${f}</feature>`).join('\n      ')}
    </features>
    <created_at>${item.created_at}</created_at>
    <updated_at>${item.updated_at}</updated_at>
  </listing>`).join('')}
</listings>`

    return { success: true, data: xml, count: items.length, format: 'xml' }
}
