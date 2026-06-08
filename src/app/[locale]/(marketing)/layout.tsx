export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Footer } from '@/components/marketing/Footer'
import { Navbar } from '@/components/marketing/Navbar'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { BrandProvider } from '@/components/providers/BrandProvider'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'
import { cn } from '@/lib/utils'

export async function generateMetadata(
    props: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await props.params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    // Each domain is self-canonical for independent SEO indexing
    const baseUrl = getCanonicalBaseUrl(host)

    return {
        metadataBase: new URL(baseUrl),
        title: {
            default: `${brandName} - Insaat ve Gayrimenkul Proje Satis Yazilimi`,
            template: `%s | ${brandName}`
        },
        description: `Orta olcekli insaat firmalari icin Proje Satis CRM'i. Satis ofisi, broker yonetimi ve odeme plani takibini tek platformda birlestirin.`,
        keywords: ['gayrimenkul crm', 'insaat crm', 'proje satis crm', 'konut satis crm', 'real estate crm turkey', 'broker yonetim sistemi'],
        icons: {
            icon: brandName === 'Oikos CRM' ? '/oikos-logo.svg' : '/favicon.ico',
        },
        alternates: {
            canonical: '/',
            languages: {
                'tr': '/tr',
                'en': '/en',
            },
        },
        robots: locale === 'en' ? { index: false, follow: false } : undefined,
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
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const brandDomain = host.split(':')[0].replace(/^www\./, '')

    return (
        <BrandProvider brandName={brandName} brandDomain={brandDomain}>
            <div 
                className={cn(
                    "flex min-h-screen flex-col font-sans antialiased text-foreground",
                    brandName === 'Oikos CRM' ? "bg-[#F4FAF8] text-[#1A1A1A]" : "bg-slate-950"
                )}
                data-brand={brandName === 'Oikos CRM' ? 'oikos' : undefined}
            >
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
