import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { aiSolutions } from "@/data/ai-solutions-data"
import { Button } from "@/components/ui/button"
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
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
    Award, ShieldCheck, FlaskConical
} from "lucide-react"

const ICON_MAP: Record<string, any> = {
    Brain, Phone, MessageCircle, Target, Network, Workflow, Users, Sparkles,
    CheckCircle2, ChevronDown, ArrowRight, Zap, Star,
    Mic, GitBranch, FileText, Sunrise, AlertTriangle,
    Clock, UserPlus, FileImage, BarChart3, Layers, TrendingUp,
    Activity, PieChart, AlertCircle, Lightbulb, Trophy, ClipboardCheck,
    Award, ShieldCheck, FlaskConical, Handshake: Users
}

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        aiSolutions.map(solution => ({ locale, slug: solution.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug, locale } = await params
    const solution = aiSolutions.find(s => s.slug === slug)
    if (!solution) return {}
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: solution.metaTitle.replace('NovoxCRM', brandName),
        description: solution.metaDescription,
        keywords: `${solution.title}, gayrimenkul ai, yapay zeka crm, ${brandName}`,
        alternates: {
            canonical: locale === 'en' ? `/en/solutions/${slug}` : `/solutions/${slug}`,
            languages: {
                tr: `/solutions/${slug}`,
                en: `/en/solutions/${slug}`,
            }
        },
        openGraph: {
            title: solution.metaTitle.replace('NovoxCRM', brandName),
            description: solution.metaDescription,
            type: 'website',
        },
    }
}

export default async function AISolutionPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const solution = aiSolutions.find(s => s.slug === slug)
    if (!solution) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Çözümler", "item": `${baseUrl}/${locale}/solutions` },
            { "@type": "ListItem", "position": 3, "name": solution.title, "item": `${baseUrl}/${locale}/solutions/${solution.slug}` }
        ]
    }

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": solution.faq.map(f => ({
            "@type": "Question",
            "name": f.question,
            "acceptedAnswer": { "@type": "Answer", "text": f.answer }
        }))
    }

    const softwareSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": `${brandName} - ${solution.title}`,
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
        "description": solution.metaDescription,
        "url": `${baseUrl}/${locale}/solutions/${solution.slug}`,
        "brand": { "@type": "Brand", "name": brandName },
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "TRY", "description": "Ücretsiz Demo" }
    }

    const geoData = generateGeoData('solution', solution.slug, solution, brandName)
    const GradientIcon = ICON_MAP[solution.icon] || Brain

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

            {/* Hero */}
            <section className="container mx-auto px-4 py-16 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className={`inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-gradient-to-r ${solution.gradient} bg-clip-text px-4 py-1.5 text-sm font-bold mb-8`}>
                    <GradientIcon size={16} className="text-blue-400" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">AI Çözüm</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-8 text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    {solution.heroHeadline}
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    {solution.heroSubheadline}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <LeadCaptureModal title={`${solution.title} Demo`} description={`${brandName} ${solution.title} çözümünü deneyin.`} resourceName={`AI_${solution.slug}_Hero`}>
                        <Button size="lg" className={`bg-gradient-to-r ${solution.gradient} text-white h-14 px-8 text-lg rounded-full hover:opacity-90 transition-opacity`}>
                            Ücretsiz Demo Alın
                        </Button>
                    </LeadCaptureModal>
                    <Button size="lg" className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 h-14 px-8 text-lg rounded-full" asChild>
                        <Link href={`/${locale}/solutions`}>Tüm Çözümler</Link>
                    </Button>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="border-y border-slate-800 bg-slate-900/30">
                <div className="container mx-auto px-4 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {solution.stats.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className={`text-3xl md:text-4xl font-black bg-gradient-to-r ${solution.gradient} bg-clip-text text-transparent`}>
                                    {stat.value}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* GEO Block */}
            <GeoBlock
                question={geoData.question}
                answer={geoData.answer}
                summary={geoData.summary}
                highlights={geoData.highlights}
            />

            {/* Features */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Temel Özellikler
                    </h2>
                    <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        {solution.title} ile satış süreçlerinizi bir üst seviyeye taşıyın.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {solution.features.map((f, i) => {
                            const IconCmp = ICON_MAP[f.icon] || CheckCircle2
                            return (
                                <div key={i} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
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
            <section className="py-24 border-t border-slate-900 bg-slate-900/20">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Kullanım Senaryoları
                    </h2>
                    <p className="text-slate-400 text-center mb-16 max-w-2xl mx-auto">
                        Gerçek iş hayatından {solution.title} kullanım örnekleri.
                    </p>
                    <div className="max-w-4xl mx-auto space-y-6">
                        {solution.useCases.map((uc, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all flex gap-5">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center shrink-0 text-white font-bold text-sm`}>
                                    {i + 1}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">{uc.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{uc.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Custom Interactive Inbound Calling and Recording section for AI Sesli Arama */}
            {slug === 'ai-sesli-arama' && (
                <section className="py-20 border-t border-slate-900 bg-slate-950/50">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="bg-gradient-to-br from-slate-900 via-blue-950/30 to-slate-900 border border-blue-500/20 rounded-[32px] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
                            
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-400 mb-4 animate-pulse">
                                    <Phone size={14} /> Canlı Deneyim Hattı
                                </div>
                                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                                    Yapay Zekayı Hemen Canlı Arayın
                                </h2>
                                <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed text-sm">
                                    Novo AI inbound agent&apos;ımızın hızını ve doğallığını doğrudan kendi telefonunuzdan test edin. Güncel gayrimenkul projelerimiz hakkında konuşun.
                                </p>
                            </div>

                            {/* Call widget */}
                            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                                <div className="space-y-2 text-center md:text-left">
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aranacak Telefon Numarası</div>
                                    <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 select-all hover:scale-102 transition-transform duration-200 inline-block">
                                        0212 905 0559
                                    </div>
                                    <div className="text-xs text-slate-400">Aradığınızda yapay zeka sizi güncel konut projeleri hakkında bilgilendirecektir.</div>
                                </div>
                                <div className="shrink-0 w-full md:w-auto">
                                    <a href="tel:02129050559" className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-8 py-4 rounded-full transition-all shadow-lg hover:shadow-blue-500/20 text-sm">
                                        <Phone size={16} /> Hemen Ara
                                    </a>
                                </div>
                            </div>

                            {/* Audio Recording Player and Transcripts */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                                        <Mic size={16} className="text-cyan-400" /> Başarılı Arama Ses Kaydı
                                    </h3>
                                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
                                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold shrink-0">Örnek Görüşme (Mert Aksoy Sesi)</div>
                                        <audio 
                                            controls 
                                            className="w-full h-10 accent-blue-500 [&::-webkit-media-controls-panel]:bg-slate-900 [&::-webkit-media-controls-play-button]:text-blue-400"
                                        >
                                            <source src="/audio/sample_call.mp3" type="audio/mpeg" />
                                            Tarayıcınız ses oynatıcısını desteklemiyor.
                                        </audio>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                                        <FileText size={16} className="text-purple-400" /> Maskelenmiş Arama Transkripti
                                    </h3>
                                    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-6 space-y-4 max-h-80 overflow-y-auto text-xs md:text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">AI</div>
                                            <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl rounded-tl-none p-3.5 text-slate-300 max-w-[85%]">
                                                Merhaba, iyi günler! Ben Novo AI satış temsilcisi. Gönderdiğiniz form için ulaşıyorum. Yeni lansmana çıkacak olan Marina Towers konut projesiyle ilgilenmiştiniz, doğru mudur?
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl rounded-tr-none p-3.5 text-slate-300 max-w-[85%]">
                                                Evet, Marina Towers hakkında bilgi almak için formu doldurmuştum. Tam olarak nerede yapılacağını ve fiyat aralığını merak ediyorum.
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">M***</div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">AI</div>
                                            <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl rounded-tl-none p-3.5 text-slate-300 max-w-[85%]">
                                                Tabii ki seve seve açıklayayım. Projemiz Kartal sahil hattında, marinaya yürüyüş mesafesinde konumlanıyor. 1+1 daire tipleri 4.5 Milyon TL&apos;den başlıyor. Yatırımlık mı düşünüyorsunuz yoksa oturum amaçlı mı?
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl rounded-tr-none p-3.5 text-slate-300 max-w-[85%]">
                                                Oturum için düşünüyoruz, 2+1 bakıyoruz aslında. Ödeme planı nasıl? Peşinat ne kadar olmalı?
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">M***</div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">AI</div>
                                            <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl rounded-tl-none p-3.5 text-slate-300 max-w-[85%]">
                                                Marina projemizde 2+1 daireler için lansmana özel %35 peşinat ve kalan tutarı şirket bünyesinde 24 ay faizsiz taksitlendirebiliyoruz. Dilerseniz ödeme planı dökümünü ve detaylı kataloğu WhatsApp üzerinden hemen göndereyim? Cep numaranız 0532 *** ** 43, bu numaraya göndermem uygun mudur?
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl rounded-tr-none p-3.5 text-slate-300 max-w-[85%]">
                                                Harika olur, evet bu numaraya WhatsApp&apos;tan gönderebilirsiniz. Ben inceleyip eşime de göstereyim.
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">M***</div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">AI</div>
                                            <div className="bg-blue-950/20 border border-blue-500/10 rounded-2xl rounded-tl-none p-3.5 text-slate-300 max-w-[85%]">
                                                Tabii ki M*** Bey, kataloğu ve size özel 2+1 ödeme planını anında iletiyorum. Ayrıca sizi cumartesi günü lansman ofisimizde kahve içmeye davet etmek isteriz. Satış danışmanımız müsaitliğinizi teyit etmek için ararsa uygun olur musunuz?
                                            </div>
                                        </div>
                                        <div className="flex gap-3 justify-end">
                                            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl rounded-tr-none p-3.5 text-slate-300 max-w-[85%]">
                                                Cumartesi öğleden sonra uygunum, arayabilirler. Teşekkür ederim bilgi verdiğiniz için.
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 text-[10px] font-bold font-mono">M***</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Benefits */}
            <section className="py-24 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="p-10 rounded-3xl border border-slate-800 bg-slate-950/50">
                        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                            <Zap className="text-amber-400" /> Neden {brandName} {solution.title}?
                        </h2>
                        <ul className="space-y-4">
                            {solution.benefits.map((benefit, idx) => (
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
            <section className="py-24 border-t border-slate-900 bg-slate-900/20">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
                        Sıkça Sorulan Sorular
                    </h2>
                    <p className="text-slate-400 text-center mb-12">
                        {solution.title} hakkında merak edilenler
                    </p>
                    <div className="space-y-4">
                        {solution.faq.map((item, i) => (
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
            <section className="py-24 container mx-auto px-4 text-center">
                <div className={`p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 max-w-4xl mx-auto relative overflow-hidden`}>
                    <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${solution.gradient} opacity-10 blur-[120px] rounded-full pointer-events-none`} />
                    <GradientIcon className="h-16 w-16 text-blue-400 mx-auto mb-8 opacity-50" />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 relative z-10">
                        {solution.title} ile Tanışın
                    </h2>
                    <p className="text-lg text-slate-400 mb-10 relative z-10">
                        Ücretsiz demo ile {solution.title} çözümümüzü projenize özel deneyimleyin.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <LeadCaptureModal title={`${solution.title} Demo`} description="Projenize özel demo sunumu için iletişime geçelim." resourceName={`AI_${solution.slug}_CTA`}>
                            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                                ŞİMDİ DEMO ALIN
                            </Button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </section>

            {/* Other AI Solutions */}
            <section className="py-12 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h3 className="text-xl font-bold text-white mb-6">Diğer AI Çözümler</h3>
                    <div className="flex flex-wrap gap-3">
                        {aiSolutions.filter(s => s.slug !== solution.slug).map(s => {
                            const SIcon = ICON_MAP[s.icon] || Brain
                            return (
                                <Link key={s.slug} href={`/${locale}/solutions/${s.slug}`} className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 text-slate-300 text-sm hover:bg-blue-600 hover:text-white transition-colors">
                                    <SIcon size={14} />
                                    {s.title} →
                                </Link>
                            )
                        })}
                    </div>
                </div>
            </section>
        </div>
    )
}
