import type { Metadata } from 'next'
import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'

export const metadata: Metadata = {
    metadataBase: new URL('https://novocrm.com'),
    title: {
        default: 'Novo CRM - İnşaat ve Gayrimenkul Proje Satış Yazılımı',
        template: '%s | Novo CRM'
    },
    description: 'Orta ölçekli inşaat firmaları için Proje Satış CRM\'i. Satış ofisi, broker yönetimi ve ödeme planı takibini tek platformda birleştirin.',
    keywords: ['gayrimenkul crm', 'inşaat crm', 'proje satış crm', 'konut satış crm', 'real estate crm turkey', 'broker yönetim sistemi'],
    alternates: {
        canonical: '/',
        languages: {
            'tr': '/tr',
            'en': '/en',
        },
    },
    openGraph: {
        type: 'website',
        locale: 'tr_TR',
        url: 'https://novocrm.com',
        title: 'Novo CRM - Konut Satışlarını Hızlandırın',
        description: 'Excel karmaşasına son verin. Satış, pazarlama ve broker yönetimini dijitalleştirin.',
        siteName: 'Novo CRM',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Novo CRM - Konut Satış CRM',
        description: 'İnşaat firmaları için dijital satış ofisi ve broker yönetim sistemi.',
        creator: '@novocrm',
    }
}

export default async function MarketingLayout(props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const { children } = props
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 font-sans antialiased text-foreground">
            <Navbar />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Novo CRM",
                        "operatingSystem": "Web",
                        "applicationCategory": "BusinessApplication",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "TRY"
                        },
                        "description": "İnşaat ve Gayrimenkul Projeleri için Satış Yönetimi ve CRM Yazılımı.",
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "120"
                        }
                    })
                }}
            />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
