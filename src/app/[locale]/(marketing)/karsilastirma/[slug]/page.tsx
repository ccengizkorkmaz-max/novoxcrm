import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { comparisons } from "@/data/comparisons-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { CheckCircle2, XCircle, AlertCircle, Trophy } from "lucide-react"
import Link from "next/link"

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        comparisons.map(c => ({ locale, slug: c.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const comp = comparisons.find(c => c.slug === slug)
    if (!comp) return {}
    return { title: comp.metaTitle, description: comp.metaDescription }
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const comp = comparisons.find(c => c.slug === slug)
    if (!comp) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": comp.faq.map(f => ({
            "@type": "Question", "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
    }

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Karşılaştırma", "item": `${baseUrl}/${locale}/karsilastirma` },
            { "@type": "ListItem", "position": 3, "name": comp.title }
        ]
    }

    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": brandName,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": comp.metaDescription,
        "url": `${baseUrl}/${locale}/karsilastirma/${comp.slug}`,
        "brand": { "@type": "Brand", "name": brandName },
        "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "bestRating": "5", "ratingCount": "127" },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    function getIcon(val: string) {
        if (val.startsWith('✅') || val.startsWith('⭐')) return <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        if (val.startsWith('❌')) return <XCircle size={16} className="text-red-400 shrink-0" />
        return <AlertCircle size={16} className="text-amber-400 shrink-0" />
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 mb-8">
                    <Trophy size={14} className="mr-1.5" /> Karşılaştırma
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-8 text-white tracking-tight leading-tight">{comp.title}</h1>
                <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-10">{comp.competitorDescription}</p>

                {/* Aggressive Parasite SEO CTA - Animated for Dwell Time */}
                <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-blue-900/40 border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] backdrop-blur-sm hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                        <div className="text-left">
                            <h3 className="text-white font-bold text-lg">{comp.competitor} Kullanıcısı mısınız?</h3>
                            <p className="text-slate-300 text-sm mt-1">Verilerinizi 1 dakikada {brandName}'e aktarın, AI otomasyonlarıyla satışları katlayın.</p>
                        </div>
                        <LeadCaptureModal title="Kolay Geçiş Kampanyası" description={`${comp.competitor} verilerinizi ücretsiz aktarıyoruz.`} resourceName={`Parasite_CTA_${comp.slug}`}>
                            <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 whitespace-nowrap shadow-lg shadow-blue-500/25">
                                Ücretsiz Taşıma İste
                            </Button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-5xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Özellik Karşılaştırması</h2>
                    <div className="rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="grid grid-cols-3 bg-slate-900 p-4 font-bold text-sm">
                            <div className="text-slate-400">Özellik</div>
                            <div className="text-blue-400">{brandName}</div>
                            <div className="text-slate-400">{comp.competitor}</div>
                        </div>
                        {comp.features.map((f, i) => (
                            <div key={i} className={`grid grid-cols-3 p-4 text-sm ${i % 2 === 0 ? 'bg-slate-950' : 'bg-slate-900/30'} border-t border-slate-800/50`}>
                                <div className="text-white font-medium">{f.name}</div>
                                <div className="flex items-center gap-2 text-slate-300">{getIcon(f.oikos)} {f.oikos.replace(/^[✅❌⚠️⭐]\s*/, '')}</div>
                                <div className="flex items-center gap-2 text-slate-400">{getIcon(f.competitor)} {f.competitor.replace(/^[✅❌⚠️]\s*/, '')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Verdict */}
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <h2 className="text-2xl font-bold text-white mb-6">Sonuç</h2>
                    <p className="text-lg text-slate-300 leading-relaxed bg-slate-900/50 p-8 rounded-2xl border border-slate-800">{comp.verdict}</p>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Sıkça Sorulan Sorular</h2>
                    <div className="space-y-6">
                        {comp.faq.map((f, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                                <h3 className="text-lg font-bold text-white mb-3">{f.question}</h3>
                                <p className="text-slate-400">{f.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-6">Farkı Kendiniz Görün</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile ücretsiz demo yapın ve kendi karşılaştırmanızı oluşturun.</p>
                    <LeadCaptureModal title="Demo Alın" description="Gayrimenkul CRM çözümümüzü deneyin." resourceName={`Comparison_${comp.slug}`}>
                        <Button size="lg" className="bg-white text-purple-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                            ÜCRETSİZ DEMO
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            {/* Other Comparisons */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h3 className="text-xl font-bold text-white mb-6">Diğer Karşılaştırmalar</h3>
                    <div className="flex flex-wrap gap-3">
                        {comparisons.filter(c => c.slug !== comp.slug).map(c => (
                            <Link key={c.slug} href={`/${locale}/karsilastirma/${c.slug}`} className="px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-purple-600 hover:text-white transition-colors">
                                {c.competitor} →
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
