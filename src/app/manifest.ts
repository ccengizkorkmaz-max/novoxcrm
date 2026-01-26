import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'NovoxCRM Broker Portal',
        short_name: 'NovoxBroker',
        description: 'Broker ve İş Ortakları için Lead ve Satış Yönetim Platformu',
        start_url: '/broker',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1e40af',
        icons: [
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    }
}
