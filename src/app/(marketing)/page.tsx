
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "NovoxCRM | İnşaat & Gayrimenkul CRM – Konut Projeleri için Satış Yönetimi",
    description: "NovoxCRM, inşaat ve gayrimenkul firmaları için özel geliştirilmiş CRM yazılımıdır. Konut projeleri, stok takibi, broker yönetimi ve satış süreçlerini tek platformda yönetin.",
};

import { Hero } from '@/components/marketing/Hero'

import { TrustSection } from '@/components/marketing/TrustSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { PainSection } from '@/components/marketing/PainSection'
import { CRMLifecycle } from '@/components/marketing/CRMLifecycle'
import { SolutionSection } from '@/components/marketing/SolutionSection'
import { PersonaSection } from '@/components/marketing/PersonaSection'
import { ResourcesSection } from '@/components/marketing/ResourcesSection'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'

export default function MarketingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Hero />
            <TrustSection />
            <ComparisonSection />
            <PainSection />
            <CRMLifecycle />
            <SolutionSection />
            <PersonaSection />
            <PricingSection />
            <ResourcesSection />
            <FAQSection />

            <section className="py-24 bg-slate-900 text-white text-center border-t border-slate-800">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold mb-6">Satışlarınızı Hızlandırmaya Hazır Mısınız?</h2>
                    <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        Siz zaten satış yapıyorsunuz, biz daha hızlı satmanızı sağlıyoruz.
                    </p>
                    <a
                        href="/auth/register"
                        className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 text-lg font-medium text-white transition-colors hover:bg-blue-700"
                    >
                        Hemen Başlayın
                    </a>
                </div>
            </section>
        </div>
    )
}
