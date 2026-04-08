import type { Metadata } from "next";
import { Link } from '@/i18n/routing'
import { Hero } from '@/components/marketing/Hero'
import { TrustSection } from '@/components/marketing/TrustSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { AiFeaturesSection } from '@/components/marketing/AiFeaturesSection'
import { PainSection } from '@/components/marketing/PainSection'
import { CRMLifecycle } from '@/components/marketing/CRMLifecycle'
import { SolutionSection } from '@/components/marketing/SolutionSection'
import { PersonaSection } from '@/components/marketing/PersonaSection'
import { ResourcesSection } from '@/components/marketing/ResourcesSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Index' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: '/',
            languages: {
                'tr': '/',
                'en': '/en',
            },
        },
    };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Marketing_CTA' })
    const faqT = await getTranslations({ locale, namespace: 'FAQSection' })

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

    // Organization schema for brand signals
    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Novo CRM",
        "url": "https://novoxcrm.com",
        "logo": "https://novoxcrm.com/icon-512.png",
        "description": "İnşaat ve gayrimenkul firmaları için özel geliştirilmiş CRM yazılımı. Konut projeleri, stok takibi, broker yönetimi ve satış süreçlerini tek platformda yönetin.",
        "sameAs": [],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "sales",
            "availableLanguage": ["Turkish", "English"]
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
            <Hero />
            <TrustSection />
            <ComparisonSection />
            <AiFeaturesSection />
            <PainSection />
            <CRMLifecycle />
            <div id="solutions">
                <SolutionSection />
            </div>
            <PersonaSection />
            <PricingSection />
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
