export const dynamic = 'force-dynamic'

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { useCases } from "@/data/use-cases-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders, adjustBranding } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { GeoBlock } from "@/components/marketing/GeoBlock"
import { generateGeoData } from "@/lib/seo-helpers"
import Link from "next/link"
import {
    Brain, Phone, MessageCircle, Target, Network, Workflow, Users, Sparkles,
    CheckCircle2, ChevronDown, ArrowRight, Zap, Star,
    Mic, GitBranch, FileText, Sunrise, AlertTriangle,
    Clock, UserPlus, FileImage, BarChart3, Layers, TrendingUp,
    Activity, PieChart, AlertCircle, Lightbulb, Trophy, ClipboardCheck,
    Award, ShieldCheck, Building, DollarSign
} from "lucide-react"

const ICON_MAP: Record<string, any> = {
    Brain, Phone, MessageCircle, Target, Network, Workflow, Users, Sparkles,
    CheckCircle2, ChevronDown, ArrowRight, Zap, Star,
    Mic, GitBranch, FileText, Sunrise, AlertTriangle,
    Clock, UserPlus, FileImage, BarChart3, Layers, TrendingUp,
    Activity, PieChart, AlertCircle, Lightbulb, Trophy, ClipboardCheck,
    Award, ShieldCheck, Building, DollarSign
}

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        useCases.map(uc => ({ locale, slug: uc.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug, locale } = await params
    const uc = useCases.find(u => u.slug === slug)
    if (!uc) return {}
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: adjustBranding(uc.metaTitle, brandName),
        description: adjustBranding(uc.metaDescription, brandName),
        keywords: `${uc.title}, gayrimenkul crm, emlak yazılımı, ${brandName}`,
        robots: locale === 'en' ? { index: false, follow: false } : undefined,
    }
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const rawUc = useCases.find(u => u.slug === slug)
    if (!rawUc) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const uc = {
        ...rawUc,
        title: adjustBranding(rawUc.title, brandName),
        heroHeadline: adjustBranding(rawUc.heroHeadline, brandName),
        heroSubheadline: adjustBranding(rawUc.heroSubheadline, brandName),
        metaDescription: adjustBranding(rawUc.metaDescription, brandName),
        features: rawUc.features.map(f => ({
            ...f,
            title: adjustBranding(f.title, brandName),
            description: adjustBranding(f.description, brandName),
        })),
        useCases: rawUc.useCases.map(u => ({
            title: adjustBranding(u.title, brandName),
            description: adjustBranding(u.description, brandName),
        })),
        benefits: rawUc.benefits.map(b => adjustBranding(b, brandName)),
        faq: rawUc.faq.map(f => ({
            question: adjustBranding(f.question, brandName),
            answer: adjustBranding(f.answer, brandName),
        }))
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Çözümler", "item": `${baseUrl}/${locale}/cozum` },
            { "@type": "ListItem", "position": 3, "name": uc.title, "item": `${baseUrl}/${locale}/cozum/${uc.slug}` }
        ]
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": uc.faq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
    }

    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - ${uc.title}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": uc.metaDescription,
        "url": `${baseUrl}/${locale}/cozum/${uc.slug}`,
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "bestRating": "5", "ratingCount": "62" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    const getHowToSteps = (sSlug: string) => {
        switch (sSlug) {
            case 'lead-yonetimi':
                return [
                    { name: 'Reklam Kanallarını Bağlayın', text: 'Meta (Facebook/Instagram) Leads ve Google Ads kampanya formlarını entegre edin.' },
                    { name: 'Dağıtım Kurallarını Tanımlayın', text: 'Danışmanlar arasında sıra (round-robin) veya bölge uzmanlığına göre atama kurallarını kurun.' },
                    { name: 'Takip ve Satış Sürecini Yönetin', text: 'Gelen leadlerin ilk temas sürelerini izleyin, görüşme notlarını ve randevuları zaman tünelinden takip edin.' }
                ]
            case 'whatsapp-entegrasyonu':
                return [
                    { name: 'Numaranızı Entegre Edin', text: 'WhatsApp Business API veya QR kod entegrasyonu ile telefon numaranızı sisteme bağlayın.' },
                    { name: 'Mesaj Şablonları Oluşturun', text: 'Tek tıkla gönderilecek daire katalogları, ödeme tabloları ve hazır teklif şablonlarını hazırlayın.' },
                    { name: 'AI Asistanı Aktif Edin', text: 'Gelen mesai dışı müşteri mesajlarına anında yanıt verilmesi için yapay zeka asistanını devreye sokun.' }
                ]
            case 'stok-yonetimi':
                return [
                    { name: 'Daire Envanterini Yükleyin', text: 'Projedeki blok, kat, daire numarası ve şerefiye fiyatlarını Excel veya form ile içe aktarın.' },
                    { name: 'İnteraktif Lejantı Oluşturun', text: 'Blok kat planını yükleyin ve dairelerin konumlarını görsel şema üzerine yerleştirin.' },
                    { name: 'Satış Durumunu Yönetin', text: 'Satılan, rezerve olan veya boş daireleri renk kodlarıyla anlık olarak güncelleyin.' }
                ]
            case 'broker-yonetimi':
                return [
                    { name: 'Acenteleri Kaydedin', text: 'Dış satış ortaklarınızın ve brokerların sisteme kayıt başvurularını onaylayın.' },
                    { name: 'Stok Yetkilerini Belirleyin', text: 'Brokerların portal üzerinden hangi blokları ve fiyatları göreceğini kısıtlayın veya izin verin.' },
                    { name: 'Komisyon Takibini Kurun', text: 'Satış kapandıktan sonra tahsilat vadelerine göre broker komisyon hakedişlerini otomatik vadelendirin.' }
                ]
            case 'odeme-plani':
                return [
                    { name: 'Ödeme Parametrelerini Girin', text: 'Daire toplam fiyatı, peşinat tutarı, taksit sayısı ve varsa ara ödeme tarihlerini belirtin.' },
                    { name: 'Planı Hesaplayın ve Senetleri Yazdırın', text: 'Taksit tablosunu saniyeler içinde hesaplayarak ödeme planı PDF\'ini ve vadeli senetleri yazdırın.' },
                    { name: 'Otomatik Hatırlatıcıları Kurun', text: 'Günü yaklaşan taksitler ve geciken ödemeler için otomatik SMS veya WhatsApp uyarılarını ayarlayın.' }
                ]
            default:
                return []
        }
    }

    const steps = getHowToSteps(uc.slug)
    const howToSchema = steps.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": `${uc.title} Nasıl Yapılır?`,
        "description": uc.metaDescription,
        "step": steps.map((s, idx) => ({
            "@type": "HowToStep",
            "position": idx + 1,
            "name": s.name,
            "text": s.text,
            "url": `${baseUrl}/${locale}/cozum/${uc.slug}#step-${idx + 1}`
        }))
    } : null

    const geoData = generateGeoData('use-case', uc.slug, uc, brandName)
    const GradientIcon = ICON_MAP[uc.icon] || Target

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20 text-slate-100">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
            {howToSchema && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
            )}

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className={`inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r ${uc.gradient} bg-clip-text px-4 py-1.5 text-sm font-bold mb-8`}>
                    <GradientIcon size={16} className="text-blue-400" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Ürün Özelliği</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    {uc.heroHeadline}
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    {uc.heroSubheadline}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <LeadCaptureModal title={`${uc.title} Demo`} description={`${brandName} ${uc.title} çözümünü deneyin.`} resourceName={`Cozum_${uc.slug}_Hero`}>
                        <Button size="lg" className={`bg-gradient-to-r ${uc.gradient} text-white h-14 px-8 text-lg rounded-full hover:opacity-90 transition-opacity`}>
                            Ücretsiz Demo Alın
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="border-y border-slate-800 bg-slate-900/30">
                <div className="container mx-auto px-4 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {uc.stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${uc.gradient} bg-clip-text text-transparent`}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GEO Block Section */}
            <GeoBlock
                question={geoData.question}
                answer={geoData.answer}
                summary={geoData.summary}
                highlights={geoData.highlights}
            />

            {/* Features */}
            <section className="py-20 border-t border-slate-900">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Temel Kapasiteler
                    </h2>
                    <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        {uc.title} ile satış süreçlerinizi optimize edin ve kontrol altına alın.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {uc.features.map((f, i) => {
                            const IconCmp = ICON_MAP[f.icon] || CheckCircle2
                            return (
                                <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${uc.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <IconCmp className="text-white" size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{f.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* Use Cases */}
            <section className="py-20 border-t border-slate-900 bg-slate-900/20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Kullanım Senaryoları
                    </h2>
                    <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        Sektörün en başarılı ekiplerinden gerçek kullanım örnekleri.
                    </p>
                    <div className="max-w-4xl mx-auto space-y-6">
                        {uc.useCases.map((ucItem, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex gap-5">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${uc.gradient} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{ucItem.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{ucItem.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="p-10 rounded-3xl border border-slate-800 bg-slate-950/50">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                            <Zap className="text-amber-400 animate-pulse" /> Neden {brandName} {uc.title}?
                        </h2>
                        <ul className="space-y-4">
                            {uc.benefits.map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-lg text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 shrink-0" size={24} />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 border-t border-slate-900 bg-slate-900/20">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Sıkça Sorulan Sorular
                    </h2>
                    <p className="text-slate-400 text-center mb-12">
                        {uc.title} hakkında en çok merak edilenler
                    </p>
                    <div className="space-y-4">
                        {uc.faq.map((item, i) => (
                            <details key={i} className="group rounded-2xl border border-slate-800 bg-slate-950/50 overflow-hidden">
                                <summary className="p-6 cursor-pointer flex items-center justify-between text-white font-semibold hover:bg-slate-900/50 transition-colors">
                                    <span>{item.question}</span>
                                    <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                                    {item.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 container mx-auto px-4 text-center">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 max-w-4xl mx-auto relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${uc.gradient} opacity-10 blur-[120px] rounded-full pointer-events-none`} />
                    <GradientIcon className="h-16 w-16 text-blue-400 mx-auto mb-8 opacity-50" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 relative z-10">
                        {uc.title} Çözümünü Hemen Deneyin
                    </h2>
                    <p className="text-lg text-slate-400 mb-10 relative z-10">
                        Projelerinize özel demo kurgusu için hemen randevu alın.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <LeadCaptureModal title={`${uc.title} Demo`} description="Projelerinize özel çözüm sunumu için uygun bir zaman belirleyelim." resourceName={`Cozum_${uc.slug}_CTA`}>
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                                ŞİMDİ DEMO ALIN
                            </Button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </section>

            {/* Other Use Cases */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h3 className="text-xl font-bold text-white mb-6">Diğer Çözümlerimiz</h3>
                    <div className="flex flex-wrap gap-3">
                        {useCases.filter(u => u.slug !== uc.slug).map(u => {
                            const SIcon = ICON_MAP[u.icon] || Target
                            return (
                                <Link key={u.slug} href={`/${locale}/cozum/${u.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                                    <SIcon size={14} />
                                    {u.title} →
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
