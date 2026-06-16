import { MetadataRoute } from 'next'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const isOikos = brandName === 'Oikos CRM'

    return {
        name: isOikos ? 'Oikos CRM Broker Portal' : 'Novo CRM Broker Portal',
        short_name: isOikos ? 'Oikos Broker' : 'Novo Broker',
        description: isOikos 
            ? 'Broker ve İş Ortakları için Müşteri ve Satış Yönetim Platformu'
            : 'Broker ve İş Ortakları için Lead ve Satış Yönetim Platformu',
        start_url: '/broker',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: isOikos ? '#0f6e56' : '#1e40af',
        icons: [
            {
                src: isOikos ? '/oikos-logo.svg' : '/icon-512.png',
                sizes: isOikos ? 'any' : '512x512',
                type: isOikos ? 'image/svg+xml' : 'image/png',
            },
        ],
    }
}
