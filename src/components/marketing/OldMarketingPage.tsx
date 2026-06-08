import { Link } from '@/i18n/routing'
import { Hero } from '@/components/marketing/Hero'
import { TrustSection } from '@/components/marketing/TrustSection'
import { PlatformPowerSection } from '@/components/marketing/PlatformPowerSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { OutreachShowcase } from '@/components/marketing/OutreachShowcase'
import { AiFeaturesSection } from '@/components/marketing/AiFeaturesSection'
import { PainSection } from '@/components/marketing/PainSection'
import { CRMLifecycle } from '@/components/marketing/CRMLifecycle'
import { SolutionSection } from '@/components/marketing/SolutionSection'
import { PersonaSection } from '@/components/marketing/PersonaSection'
import { ResourcesSection } from '@/components/marketing/ResourcesSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { getTranslations } from 'next-intl/server'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'

export async function OldMarketingPage({ 
    params, 
    showPricing = true 
}: { 
    params: Promise<{ locale: string }>; 
    showPricing?: boolean 
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Marketing_CTA' })
    const faqT = await getTranslations({ locale, namespace: 'FAQSection' })

    // Resolve brand from hostname
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    // Each domain is self-canonical — structured data uses its own URL
    const baseUrl = getCanonicalBaseUrl(host)

    // Build FAQ Schema for Google Rich Results & AI Search
    const faqItems = [0, 1, 2, 3, 4, 5].map((i) => ({
        "@type": "Question",
        "name": faqT(`items.${i}.question`),
        "acceptedAnswer": {
            "@type": "Answer",
            "text": faqT(`items.${i}.answer`)
        }
    }));

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqItems
    };

    // Organization schema for brand signals - dynamic per domain
    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": brandName,
        "url": baseUrl,
        "logo": `${baseUrl}/icon-512.png`,
        "description": `Insaat ve gayrimenkul firmalari icin ozel gelistirilmis CRM yazilimi. Konut projeleri, stok takibi, broker yonetimi ve satis sureclerini tek platformda yonetin.`,
        "sameAs": [],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "sales",
            "availableLanguage": ["Turkish", "English"]
        }
    };

    // SoftwareApplication + AggregateRating
    const productSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - Gayrimenkul ve İnşaat CRM`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": "İnşaat firmaları ve gayrimenkul geliştiricileri için konut projesi satış, stok, müşteri ve broker yönetimi CRM yazılımı.",
        "url": baseUrl,
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "53",
            "reviewCount": "42"
        },
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "TRY",
            "description": "Ücretsiz Demo",
            "availability": "https://schema.org/InStock"
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <Hero />
            <TrustSection />
            <PlatformPowerSection />
            <ComparisonSection />
            <OutreachShowcase />
            <AiFeaturesSection />
            <PainSection />
            <CRMLifecycle />
            <div id="solutions">
                <SolutionSection />
            </div>
            <PersonaSection />
            {showPricing && <PricingSection />}
            <ResourcesSection />
            <FAQSection />

            <section className="py-24 bg-slate-900 text-white text-center border-t border-slate-800">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">{t('title')}</h2>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        {t('description')}
                    </p>
                    <Link
                        href="/auth/register"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-lg font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        {t('button')}
                    </Link>
                </div>
            </section>
        </div>
    )
}
