export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { sectors } from "@/data/sectors-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders, adjustBranding } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { Building2, LineChart, FileText, Star, Lock, Link as LinkIcon, Map, FileCheck, Users, Building, Calculator, Network, CheckCircle2 } from "lucide-react"
import Link from "next/link"

const ICON_MAP: Record<string, any> = {
    Building2, LineChart, FileText, Star, Lock, Link: LinkIcon, Map, FileCheck, Users, Building, Calculator, Network
}

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        sectors.map(sector => ({ locale, slug: sector.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug, locale } = await params
    const sector = sectors.find(c => c.slug === slug)
    if (!sector) return {}
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: adjustBranding(sector.metaTitle, brandName),
        description: adjustBranding(sector.metaDescription, brandName),
        keywords: `${sector.title} crm, gayrimenkul crm, inşaat crm`,
        robots: locale === 'en' ? { index: false, follow: false } : undefined,
    }
}

export default async function SectorPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const rawSector = sectors.find(c => c.slug === slug)
    if (!rawSector) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const sector = {
        ...rawSector,
        heroHeadline: adjustBranding(rawSector.heroHeadline, brandName),
        heroSubheadline: adjustBranding(rawSector.heroSubheadline, brandName),
        metaDescription: adjustBranding(rawSector.metaDescription, brandName),
        features: rawSector.features.map(f => ({
            ...f,
            title: adjustBranding(f.title, brandName),
            description: adjustBranding(f.description, brandName),
        })),
        benefits: rawSector.benefits.map(b => adjustBranding(b, brandName))
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Sektörel Çözümler", "item": `${baseUrl}/${locale}/sektor` },
            { "@type": "ListItem", "position": 3, "name": sector.title, "item": `${baseUrl}/${locale}/sektor/${sector.slug}` }
        ]
    }

    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - ${sector.title}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": sector.metaDescription,
        "url": `${baseUrl}/${locale}/sektor/${sector.slug}`,
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "ratingCount": "84" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-8">
                    <Building2 size={14} className="mr-1.5" /> Sektörel Çözüm
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight leading-tight">
                    {sector.heroHeadline}
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-10">
                    {sector.heroSubheadline}
                </p>
                
                <LeadCaptureModal title={`${sector.title} Demo`} description={`${brandName} ile sektörel çözümümüzü deneyin.`} resourceName={`Sector_${sector.slug}_Hero`}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg rounded-full">
                        Ücretsiz Demo Alın
                    </Button>
                </LeadCaptureModal>
            </section>

            {/* Features */}
            <section className="py-20 border-t border-slate-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
                        Öne Çıkan Özellikler
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {sector.features.map((f, i) => {
                            const IconCmp = ICON_MAP[f.icon] || CheckCircle2;
                            return (
                                <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                                    <IconCmp className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{f.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 border-t border-slate-900 bg-slate-900/20">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="p-10 rounded-3xl border border-slate-800 bg-slate-950/50">
                        <h2 className="text-2xl font-bold text-white mb-8">Neden {brandName}?</h2>
                        <ul className="space-y-4">
                            {sector.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-lg text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 container mx-auto px-4 text-center">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Sektörünüze Özel Çözümü Deneyin</h2>
                    <p className="text-lg text-slate-400 mb-10">{sector.title} ihtiyaçlarınız için tam uyumlu CRM altyapısı.</p>
                    <LeadCaptureModal title="Hemen Başlayın" description="Sektöre özel demo randevusu alın." resourceName={`Sector_${sector.slug}_CTA`}>
                        <Button size="lg" className="bg-white text-blue-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                            ŞİMDİ DEMO ALIN
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            {/* Internal Links */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h3 className="text-xl font-bold text-white mb-6">Diğer Çözümler</h3>
                    <div className="flex flex-wrap gap-3">
                        {sectors.filter(s => s.slug !== sector.slug).map(s => (
                            <Link key={s.slug} href={`/${locale}/sektor/${s.slug}`} className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                                {s.title} →
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
