export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { turkishCities } from "@/data/cities-data"
import { sectors } from "@/data/sectors-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders, getCityLocativeSuffix, getCityLocativeDeSuffix, adjustBranding } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { 
    Building2, LineChart, FileText, Star, Lock, Link as LinkIcon, Map, FileCheck, 
    Users, Building, Calculator, Network, CheckCircle2, MapPin, Trophy, ArrowRight,
    Globe, Shield, DollarSign, Store, PieChart, RefreshCw, Calendar, LayoutDashboard, 
    Briefcase, BarChart3, Shuffle
} from "lucide-react"
import Link from "next/link"
import { GeoBlock } from "@/components/marketing/GeoBlock"

const ICON_MAP: Record<string, any> = {
    Building2, LineChart, FileText, Star, Lock, Link: LinkIcon, Map, FileCheck, Users, 
    Building, Calculator, Network, Globe, Shield, DollarSign, Store, PieChart, 
    RefreshCw, Calendar, LayoutDashboard, Briefcase, BarChart3, Shuffle
}

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        turkishCities.flatMap(city =>
            sectors.map(sector => ({
                locale,
                slug: city.slug,
                sectorSlug: sector.slug
            }))
        )
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; sectorSlug: string; locale: string }> }
): Promise<Metadata> {
    const { slug, sectorSlug, locale } = await params
    const city = turkishCities.find(c => c.slug === slug)
    const rawSector = sectors.find(s => s.slug === sectorSlug)
    if (!city || !rawSector) return {}
    
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const locative = getCityLocativeSuffix(city.name)
    const sector = {
        ...rawSector,
        title: adjustBranding(rawSector.title, brandName)
    }
    
    const title = `${city.name} ${sector.title} Programı | ${brandName}`
    const description = `${city.name} ve çevresindeki projeleriniz için ${sector.title} süreçlerini dijitalleştirin. ${locative} gayrimenkul pazarına özel geliştirilen en iyi CRM ve otomasyon yazılımı.`
    
    return {
        title: adjustBranding(title, brandName),
        description: adjustBranding(description, brandName),
        keywords: `${city.name} ${sector.slug.replace('-crm', '')} crm, ${city.name} ${sector.title}, ${city.name} emlak yazılımı, ${sector.title} programı`,
        robots: locale === 'en' ? { index: false, follow: false } : undefined,
        alternates: {
            canonical: locale === 'en' ? `/en/sehir/${slug}/${sectorSlug}` : `/sehir/${slug}/${sectorSlug}`,
            languages: {
                tr: `/sehir/${slug}/${sectorSlug}`,
                en: `/en/sehir/${slug}/${sectorSlug}`,
            }
        },
    }
}

export default async function CitySectorPage({ params }: { params: Promise<{ slug: string; sectorSlug: string; locale: string }> }) {
    const { slug, sectorSlug, locale } = await params
    const city = turkishCities.find(c => c.slug === slug)
    const rawSector = sectors.find(s => s.slug === sectorSlug)
    if (!city || !rawSector) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const sector = {
        ...rawSector,
        title: adjustBranding(rawSector.title, brandName),
        features: rawSector.features.map(f => ({
            ...f,
            title: adjustBranding(f.title, brandName),
            description: adjustBranding(f.description, brandName)
        })),
        benefits: rawSector.benefits.map(b => adjustBranding(b, brandName))
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Şehirler", "item": `${baseUrl}/${locale}/sehir` },
            { "@type": "ListItem", "position": 3, "name": city.name, "item": `${baseUrl}/${locale}/sehir/${city.slug}` },
            { "@type": "ListItem", "position": 4, "name": sector.title }
        ]
    }

    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - ${city.name} ${sector.title} Modülü`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": `${city.name} gayrimenkul pazarında ${sector.title} çözümü`,
        "url": `${baseUrl}/${locale}/sehir/${city.slug}/${sector.slug}`,
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "ratingCount": "92" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    // Select major cities for regional context linking
    const majorCities = turkishCities.filter(c => c.slug !== city.slug && ['istanbul', 'ankara', 'izmir', 'antalya', 'bursa'].includes(c.slug))

    const geoQuestion = `${city.name} bölgesinde ${sector.title} süreçleri nasıl yönetilmelidir?`
    const geoAnswer = `${city.name} ve çevresinde yer alan konut ve ticari gayrimenkul projelerinde ${sector.title} süreçlerini dijitalleştirmek, satış hızını ve müşteri memnuniyetini artırır. ${brandName}, bu lokasyona özel interaktif daire stok lejantı, broker yönetim portalı ve yapay zeka destekli müşteri takip otomasyonu sunar.`
    const geoSummary = `${city.name} pazar dinamiklerine ve ${sector.title} gereksinimlerine tam uyumlu modern bulut altyapısı.`
    const geoHighlights = [
        `${city.name} ve çevre illere özel interaktif daire lejantı`,
        'Bölgesel acente ve broker satış portalı entegrasyonu',
        'Otomatik müşteri atama ve entegre WhatsApp takip motoru'
    ]

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20 text-slate-100 selection:bg-blue-600/30 selection:text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            {/* Premium Hero Section */}
            <section className="container mx-auto px-4 py-16 text-center relative overflow-hidden">
                {/* Background decorative glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 mb-8 backdrop-blur-md uppercase tracking-wider animate-pulse">
                    <MapPin size={12} className="mr-1.5 text-blue-400" /> {city.name} · {sector.title}
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    {city.name} Bölgesinde<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                        {sector.title}
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    {city.name} gayrimenkul pazarına özel otomasyonlar, interaktif stok yönetimi ve {brandName} gücüyle satış hızınızı katlayın. {city.marketContext}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <LeadCaptureModal title={`${city.name} ${sector.title} Demosu`} description={`${city.name} pazarındaki projeleriniz için özel kurgulanmış demo randevusu alın.`} resourceName={`City_${city.slug}_Sector_${sector.slug}_Hero`}>
                        <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-14 px-8 text-lg rounded-full shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform duration-300 w-full sm:w-auto">
                            Ücretsiz Demo Alın
                        </Button>
                    </LeadCaptureModal>
                    <Link href={`/${locale}/solutions`} className="text-sm font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors group">
                        Diğer Çözümleri Keşfet <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* Quick Stats Block */}
            <section className="py-8 bg-slate-900/30 border-y border-slate-900 backdrop-blur-sm">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div>
                            <div className="text-3xl font-extrabold text-blue-400 mb-1">{city.population}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Şehir Nüfusu</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-indigo-400 mb-1">{city.plateCode}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Plaka Kodu</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-purple-400 mb-1">{city.region}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Coğrafi Bölge</div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-emerald-400 mb-1">2026 Ready</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Güncel Altyapı</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* GEO Block */}
            <GeoBlock
                question={geoQuestion}
                answer={geoAnswer}
                summary={geoSummary}
                highlights={geoHighlights}
            />

            {/* Sektörel Modül Özellikleri */}
            <section className="py-20 border-b border-slate-900 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                            {city.name} Satış Ofisiniz İçin Güçlü Sektörel Araçlar
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            {sector.title} süreçlerinde ihtiyaç duyduğunuz tüm yerleşik araçlar, entegrasyonlar ve raporlama modülleri ilk günden hazır.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {sector.features.map((f, i) => {
                            const IconCmp = ICON_MAP[f.icon] || CheckCircle2
                            return (
                                <div key={i} className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-300 group shadow-md hover:shadow-lg">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                        <IconCmp className="text-blue-400" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm">{f.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* City Regional Context */}
            <section className="py-20 border-b border-slate-900 bg-slate-900/10">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">{city.name} Gayrimenkul Pazar Dinamikleri</h2>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                        {city.name} genelinde öne çıkan ve aktif olarak gayrimenkul hareketliliği görülen başlıca bölgeler:
                    </p>
                    <div className="inline-block p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm text-blue-300 font-medium text-lg shadow-inner mb-8">
                        {city.keyProjects}
                    </div>
                    <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                        Bu bölgelerdeki tüm portföy, stok lejantı ve müşteri taleplerini {getCityLocativeSuffix(city.name)} satış ekibinizle koordineli olarak tek bir bulut tabanlı CRM sistemi üzerinden yönetebilirsiniz.
                    </p>
                </div>
            </section>

            {/* Benefits section */}
            <section className="py-20 border-b border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="p-10 md:p-12 rounded-[32px] border border-slate-800/80 bg-slate-900/30 backdrop-blur-sm">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Neden {brandName} Tercih Edilmeli?</h2>
                        <ul className="space-y-5">
                            {sector.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-4 text-base md:text-lg text-slate-300">
                                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-1" size={20} />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 container mx-auto px-4 text-center">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-indigo-950/40 via-slate-900/80 to-indigo-950/40 border border-indigo-500/20 max-w-4xl mx-auto shadow-2xl shadow-indigo-500/5">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        {getCityLocativeDeSuffix(city.name)} {sector.title} Süreçlerinizi Bir Üst Seviyeye Taşıyın
                    </h2>
                    <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
                        {brandName} ile {city.name} ve çevre illerdeki tüm projelerinizi dijitalleştirin, acente ağınızı tek bir panelden kontrol edin.
                    </p>
                    <LeadCaptureModal title={`${city.name} ${sector.title} Demosu`} description="Çözümümüzü deneyimlemek için demo isteği gönderin." resourceName={`City_${city.slug}_Sector_${sector.slug}_CTA`}>
                        <Button size="lg" className="bg-white text-indigo-900 hover:bg-slate-100 h-14 px-10 rounded-full font-extrabold shadow-lg shadow-white/10 hover:scale-[1.02] transition-transform duration-300">
                            ŞİMDİ DEMO ALIN
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            {/* Cross Linking Footer */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-5xl">
                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Other sectors in this city */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Building2 size={18} className="text-blue-400" /> {city.name} İçin Diğer Çözümler
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                                {sectors.filter(s => s.slug !== sector.slug).map(s => (
                                    <Link key={s.slug} href={`/${locale}/sehir/${city.slug}/${s.slug}`} className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 text-xs hover:border-blue-500/50 hover:bg-slate-900 hover:text-white transition-all">
                                        {s.title}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* This sector in other major cities */}
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Globe size={18} className="text-indigo-400" /> Diğer Şehirlerde {sector.title}
                            </h3>
                            <div className="flex flex-wrap gap-2.5">
                                {majorCities.map(c => (
                                    <Link key={c.slug} href={`/${locale}/sehir/${c.slug}/${sector.slug}`} className="px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-slate-300 text-xs hover:border-indigo-500/50 hover:bg-slate-900 hover:text-white transition-all">
                                        {c.name} {sector.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
