import type { Metadata } from 'next'
import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'
import { headers } from 'next/headers'
import { getBrandNameFromHost } from '@/lib/tenant/resolve-brand-from-host'
import { BrandProvider } from '@/components/providers/BrandProvider'

export async function generateMetadata(): Promise<Metadata> {
    const headerList = await headers()
    const host = headerList.get('host') || 'novoxcrm.com'
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = host.includes('localhost') ? `http://${host}` : `https://${host}`

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default: `${brandName} - Insaat ve Gayrimenkul Proje Satis Yazilimi`,
            template: `%s | ${brandName}`
        },
        description: `Orta olcekli insaat firmalari icin Proje Satis CRM'i. Satis ofisi, broker yonetimi ve odeme plani takibini tek platformda birlestirin.`,
        keywords: ['gayrimenkul crm', 'insaat crm', 'proje satis crm', 'konut satis crm', 'real estate crm turkey', 'broker yonetim sistemi'],
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
            url: baseUrl,
            title: `${brandName} - Konut Satislarini Hizlandirin`,
            description: 'Excel karmasasina son verin. Satis, pazarlama ve broker yonetimini dijitallestirin.',
            siteName: brandName,
        },
        twitter: {
            card: 'summary_large_image',
            title: `${brandName} - Konut Satis CRM`,
            description: 'Insaat firmalari icin dijital satis ofisi ve broker yonetim sistemi.',
        }
    }
}

export default async function MarketingLayout(props: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const { children } = props

    // Resolve brand from hostname
    const headerList = await headers()
    const host = headerList.get('host') || 'novoxcrm.com'
    const brandName = await getBrandNameFromHost(host)
    const brandDomain = host.split(':')[0]

    return (
        <BrandProvider brandName={brandName} brandDomain={brandDomain}>
            <div className="flex min-h-screen flex-col bg-slate-950 font-sans antialiased text-foreground">
                <Navbar />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": brandName,
                            "operatingSystem": "Web",
                            "applicationCategory": "BusinessApplication",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "TRY"
                            },
                            "description": "Insaat ve Gayrimenkul Projeleri icin Satis Yonetimi ve CRM Yazilimi.",
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
        </BrandProvider>
    )
}
