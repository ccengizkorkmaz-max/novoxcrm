export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { turkishCities } from "@/data/cities-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders, getCityLocativeSuffix } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { CheckCircle2, MapPin, Building2, Users, TrendingUp, ArrowRight } from "lucide-react"
import { GeoBlock } from "@/components/marketing/GeoBlock"
import { generateGeoData } from "@/lib/seo-helpers"
import Link from "next/link"

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        turkishCities.map(city => ({ locale, slug: city.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug, locale } = await params
    const city = turkishCities.find(c => c.slug === slug)
    if (!city) return {}
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const locative = getCityLocativeSuffix(city.name)
    return {
        title: `${city.name} Gayrimenkul CRM Yazılımı | İnşaat Firmaları İçin - ${brandName}`,
        description: `${locative} inşaat firmaları ve gayrimenkul geliştiricileri için CRM yazılımı. ${city.population} nüfuslu ${city.name} pazarında satış süreçlerinizi ${brandName} ile dijitalleştirin.`,
        keywords: `${city.name} gayrimenkul CRM, ${city.name} inşaat CRM, ${city.name} konut satış yazılımı, ${city.name} CRM`,
        robots: locale === 'en' ? { index: false, follow: false } : undefined,
    }
}

export default async function CityPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const city = turkishCities.find(c => c.slug === slug)
    if (!city) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - ${city.name} Gayrimenkul CRM`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": `${city.name} inşaat firmaları için gayrimenkul CRM yazılımı`,
        "url": `${baseUrl}/${locale}/sehir/${city.slug}`,
        "areaServed": { "@type": "City", "name": city.name },
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "ratingCount": "47" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Şehirler", "item": `${baseUrl}/${locale}/sehir` },
            { "@type": "ListItem", "position": 3, "name": city.name, "item": `${baseUrl}/${locale}/sehir/${city.slug}` }
        ]
    }

    const geoData = generateGeoData('city', city.slug, city, brandName)

    const features = [
        { icon: Building2, title: "Proje Bazlı Satış Takibi", desc: `${getCityLocativeSuffix(city.name)} tüm konut projelerinizi tek panelden yönetin. Daire bazlı stok, fiyat ve satış durumu anlık güncellensin.` },
        { icon: Users, title: "Broker & Acente Yönetimi", desc: `${city.name} ve çevresindeki broker ağınızı güvenle sisteme dahil edin. Komisyon ve hakediş süreçlerini otomatikleştirin.` },
        { icon: TrendingUp, title: "Performans Analizi", desc: `${city.name} satış ofisinizin performansını anlık dashboard'larla izleyin. Danışman bazlı KPI takibi yapın.` },
        { icon: MapPin, title: "Lokasyon Bazlı Müşteri Takibi", desc: `${city.name} ve ${city.region} bölgesinden gelen müşteri adaylarını otomatik segmentleyin ve önceliklendirin.` },
    ]

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-8">
                    <MapPin size={14} className="mr-1.5" /> {city.name} · {city.region} Bölgesi
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight leading-tight">
                    {city.name} İçin<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Gayrimenkul CRM Yazılımı
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-6">
                    {city.marketContext}
                </p>
                <p className="text-lg text-slate-500 mb-12">
                    <strong className="text-slate-300">{city.population}</strong> nüfuslu {city.name} pazarında satış süreçlerinizi {brandName} ile dijitalleştirin.
                </p>
                <LeadCaptureModal title={`${city.name} İçin Demo`} description={`${city.name} bölgesindeki projeleriniz için özel demo alın.`} resourceName={`City_${city.name}_Hero`}>
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg rounded-full">
                        Ücretsiz Demo Alın
                    </Button>
                </LeadCaptureModal>
            </section>

            {/* GEO Block */}
            <GeoBlock
                question={geoData.question}
                answer={geoData.answer}
                summary={geoData.summary}
                highlights={geoData.highlights}
            />

            {/* Features */}
            <section className="py-20 border-t border-slate-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">
                        {city.name} İnşaat Firmaları İçin {brandName} Özellikleri
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {features.map((f, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                                <f.icon className="text-blue-500 mb-4 group-hover:scale-110 transition-transform" size={36} />
                                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Key Projects */}
            <section className="py-20 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold text-white mb-8">{city.name} Gayrimenkul Pazarı</h2>
                    <p className="text-slate-400 text-lg mb-8">Öne çıkan bölgeler: <span className="text-slate-300">{city.keyProjects}</span></p>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="text-3xl font-bold text-blue-400 mb-2">{city.population}</div>
                            <div className="text-slate-500 text-sm">Şehir Nüfusu</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="text-3xl font-bold text-emerald-400 mb-2">{city.plateCode}</div>
                            <div className="text-slate-500 text-sm">Plaka Kodu</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <div className="text-3xl font-bold text-purple-400 mb-2">{city.region}</div>
                            <div className="text-slate-500 text-sm">Bölge</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 container mx-auto px-4 text-center">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">{city.name}&apos;de Satışlarınızı Artırmaya Hazır Mısınız?</h2>
                    <p className="text-lg text-slate-400 mb-10">{brandName} ile {city.name} projelerinizi dijital dünyada yönetin.</p>
                    <LeadCaptureModal title="Hemen Başlayın" description={`${city.name} bölgesi için özel demo randevusu alın.`} resourceName={`City_${city.name}_CTA`}>
                        <Button size="lg" className="bg-white text-blue-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                            ŞİMDİ DEMO ALIN
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            {/* Internal Links */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h3 className="text-xl font-bold text-white mb-6">İlgili Sayfalar</h3>
                    <div className="flex flex-wrap gap-3">
                        <Link href={`/${locale}/solutions/gayrimenkul-crm`} className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                            Gayrimenkul CRM →
                        </Link>
                        <Link href={`/${locale}/solutions/insaat-crm`} className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                            İnşaat CRM →
                        </Link>
                        <Link href={`/${locale}/wiki`} className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                            Bilgi Bankası →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
