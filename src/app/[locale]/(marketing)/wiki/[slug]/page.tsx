
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, Tag, Share2, MessageCircle, ChevronDown, BarChart3, Sparkles } from 'lucide-react'
import { wikiArticles } from '@/data/wiki-data'
import type { Metadata } from 'next'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { getCanonicalBaseUrl } from '@/lib/seo-constants'

// Tüm slug'ları ve locale'leri Next.js'e bildirerek 404 hatasını önle
export async function generateStaticParams() {
    const locales = ['tr', 'en'];
    return locales.flatMap((locale) =>
        wikiArticles.map((article) => ({
            locale,
            slug: article.slug,
        }))
    );
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const article = wikiArticles.find(a => a.slug === slug);
    if (!article) return {};

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    return {
        title: `${article.title} | ${brandName} Bilgi Bankasi`,
        description: article.excerpt,
        keywords: article.tags?.join(', '),
        openGraph: {
            title: article.title,
            description: article.excerpt,
            type: 'article',
            authors: [article.author],
        },
    };
}

// Markdown benzeri içeriği HTML'e dönüştür
function formatContent(content: string) {
    if (!content) return '';
    let h2Index = 0;
    return content
        // Tabloları işle — önce satırları convert et
        .replace(/^\|(.+)\|$/gim, (match) => {
            const cells = match.split('|').filter(c => c.trim() !== '');
            return `<tr>${cells.map(c => `<td class="border border-slate-700 px-4 py-2 text-slate-400">${c.trim()}</td>`).join('')}</tr>`;
        })
        .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, (match) => {
            return `<table class="w-full border-collapse border border-slate-700 my-8 text-sm">${match}</table>`;
        })
        // Başlıklar
        .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-12 mb-6 text-white">$1</h1>')
        .replace(/^## (.*$)/gim, (match, p1) => {
            const id = `heading-${h2Index++}`;
            return `<h2 id="${id}" class="text-2xl font-bold mt-10 mb-5 text-white scroll-mt-32">${p1}</h2>`;
        })
        .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-8 mb-4 text-slate-200">$1</h3>')
        // Listeler
        .replace(/^\* (.*$)/gim, '<li class="ml-6 mb-2 list-disc text-slate-400">$1</li>')
        .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 list-disc text-slate-400">$1</li>')
        // Numaralı listeler
        .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 list-decimal text-slate-400">$1</li>')
        // Bold
        .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-blue-400 font-semibold">$1</strong>')
        // İtalik
        .replace(/\*(.*?)\*/gim, '<em class="text-slate-300">$1</em>')
        // Linkler
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" class="text-blue-400 hover:underline">$1</a>')
        // Paragraflar
        .replace(/\n\n/gim, '</p><p class="mb-6 text-slate-400 leading-relaxed">');
}

// Next.js 15: params is a Promise — must be awaited
export default async function ArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params;

    const article = wikiArticles.find(a => a.slug === slug);

    if (!article) {
        notFound();
    }

    const relatedArticles = wikiArticles.filter(a =>
        article.relatedSlugs?.includes(a.slug)
    ).slice(0, 3);

    // relatedSlugs boşsa aynı kategoriden öneri getir
    const suggestedArticles = relatedArticles.length > 0
        ? relatedArticles
        : wikiArticles.filter(a => a.category === article.category && a.slug !== article.slug).slice(0, 3);

    // Resolve brand from hostname for JSON-LD
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    // JSON-LD Schema (Google SEO icin kritik)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "mainEntityOfPage": {
            "@type": "WebPage",
            "id": `${baseUrl}/${locale}/wiki/${article.slug}`
        },
        "headline": article.title,
        "description": article.excerpt,
        "image": article.image || `${baseUrl}/og-image.jpg`,
        "author": {
            "@type": "Person",
            "name": article.author,
            "jobTitle": article.authorTitle
        },
        "publisher": {
            "@type": "Organization",
            "name": brandName,
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`
            }
        },
        "datePublished": (() => {
            const months: Record<string, string> = {
                'Ocak': '01', 'Subat': '02', 'Mart': '03', 'Nisan': '04',
                'Mayis': '05', 'Haziran': '06', 'Temmuz': '07', 'Agustos': '08',
                'Eylul': '09', 'Ekim': '10', 'Kasim': '11', 'Aralik': '12',
            };
            const parts = article.date.split(' ');
            if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = months[parts[1]] || '01';
                const year = parts[2];
                return `${year}-${month}-${day}`;
            }
            return '2026-01-20';
        })()
    };

    // BreadcrumbList Schema → SERP'te zengin breadcrumb gösterimi
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Bilgi Bankası", "item": `${baseUrl}/${locale}/wiki` },
            { "@type": "ListItem", "position": 3, "name": article.title, "item": `${baseUrl}/${locale}/wiki/${article.slug}` }
        ]
    };

    // FAQPage Schema → "People Also Ask" kutusunu ele geçirme
    // Wiki makalelerindeki FAQ bölümünü otomatik parse et
    const faqSplit = article.content.split(/##\s*S[ıi]k[çc]a Sorulan Sorular/i);
    let faqSchema = null;
    if (faqSplit.length > 1) {
        const faqContent = faqSplit[1];
        const faqMatches = [...faqContent.matchAll(/###\s*(.+?)[\n]+([^#]+?)(?=###|$)/g)];
        if (faqMatches.length > 0) {
            faqSchema = {
                "@context": "https://schema.org",
                "@type": "FAQPage",
                "mainEntity": faqMatches.map(m => ({
                    "@type": "Question",
                    "name": m[1].trim(),
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": m[2].trim().replace(/\n+/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                    }
                }))
            };
        }
    }

    // İçindekiler Tablosu (TOC) Oluşturucu
    const headings = [...(article.content.matchAll(/^##\s+(.*$)/gm))].map((match, idx) => ({
        id: `heading-${idx}`,
        text: match[1]
    }));

    return (
        <div className="bg-slate-950 min-h-screen pt-32 pb-20">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back Link */}
                <Link
                    href={`/${locale}/wiki`}
                    className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors mb-12 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Bilgi Bankası'na Geri Dön
                </Link>

                {/* Article Header */}
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
                            {article.category}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-700" />
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs italic">
                            <Clock size={14} /> {article.readTime} okuma hızı
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 tracking-tight leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-between gap-6 py-8 border-y border-slate-800/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg text-white font-bold shadow-lg shadow-blue-900/20">
                                {article.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <div className="text-slate-200 font-bold">{article.author}</div>
                                <div className="text-slate-500 text-sm font-medium">{article.authorTitle}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} /> {article.date}
                            </div>
                            <div className="flex gap-4">
                                <button className="hover:text-blue-400 transition-colors"><Share2 size={18} /></button>
                                <button className="hover:text-blue-400 transition-colors"><MessageCircle size={18} /></button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* İçindekiler (TOC) - SEO için çok önemli */}
                {headings.length > 0 && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-12">
                        <h3 className="text-lg font-bold text-white mb-4">İçindekiler</h3>
                        <ul className="space-y-2">
                            {headings.map((heading) => (
                                <li key={heading.id}>
                                    <a href={`#${heading.id}`} className="text-slate-400 hover:text-blue-400 transition-colors text-sm flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                                        {heading.text}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* TL;DR Summary Box (GEO Optimized — falls back to excerpt) */}
                <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 rounded-2xl p-6 mb-12">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-sm uppercase tracking-wider mb-3">
                        <Sparkles size={16} /> Özet (TL;DR)
                    </div>
                    <p className="text-slate-300 leading-relaxed text-lg">{article.tldr || article.excerpt}</p>
                </div>

                {/* Stats Cards (GEO Optimized) */}
                {(article as any).stats && (article as any).stats.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                        {(article as any).stats.map((stat: {label: string; value: string}, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
                                <p className="text-2xl font-black text-blue-400">{stat.value}</p>
                                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Article Content */}
                <article className="prose prose-invert prose-lg max-w-none mb-20 prose-headings:text-white prose-p:text-slate-400 prose-strong:text-blue-400 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-400 prose-code:text-indigo-300">
                    <div dangerouslySetInnerHTML={{ __html: formatContent(article.content) }} />
                </article>

                {/* Structured FAQ Accordion (GEO Optimized) — merges explicit faq + content-parsed SSS */}
                {(() => {
                    const explicitFaq = article.faq || [];
                    // Parse SSS from content if no explicit faq
                    const contentFaq = explicitFaq.length === 0 && faqSchema
                        ? (faqSchema as any).mainEntity.map((e: any) => ({ question: e.name, answer: e.acceptedAnswer.text }))
                        : [];
                    const allFaq = [...explicitFaq, ...contentFaq];
                    if (allFaq.length === 0) return null;
                    return (
                        <section className="mb-16">
                            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                                <BarChart3 className="text-blue-400" size={24} /> Sıkça Sorulan Sorular
                            </h2>
                            <div className="space-y-3">
                                {allFaq.map((item: {question: string; answer: string}, i: number) => (
                                    <details key={i} className="group rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
                                        <summary className="p-5 cursor-pointer flex items-center justify-between text-white font-semibold hover:bg-slate-900/50 transition-colors">
                                            <span>{item.question}</span>
                                            <ChevronDown className="h-5 w-5 text-slate-500 group-open:rotate-180 transition-transform shrink-0 ml-2" />
                                        </summary>
                                        <div className="px-5 pb-5 text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                                            {item.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    );
                })()}

                {/* Expert Quote (GEO Optimized) */}
                {(article as any).expertQuote && (
                    <blockquote className="mb-16 p-6 rounded-2xl bg-slate-900/50 border-l-4 border-blue-500">
                        <p className="text-lg text-slate-300 italic leading-relaxed mb-3">&ldquo;{(article as any).expertQuote.text}&rdquo;</p>
                        <cite className="text-sm text-slate-500 not-italic">— {(article as any).expertQuote.author}</cite>
                    </blockquote>
                )}

                {/* Tags */}
                {article.tags && (
                    <div className="flex flex-wrap gap-2 mb-20 py-8 border-t border-slate-800/50">
                        <span className="text-slate-500 mr-2 flex items-center gap-1.5 text-sm uppercase font-bold tracking-widest">
                            <Tag size={16} /> Etiketler:
                        </span>
                        {article.tags.map(tag => (
                            <span key={tag} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs hover:border-blue-500/30 transition-all cursor-default">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Cross-Link Section — Internal Linking SEO Boost */}
                <section className="mb-20 grid md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">🧮 Ücretsiz Araçlar</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href={`/${locale}/tools/tapu-harci-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">Tapu Harcı Hesaplayıcı 2026</Link></li>
                            <li><Link href={`/${locale}/tools/serefiye-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">Şerefiye Hesaplama Aracı</Link></li>
                            <li><Link href={`/${locale}/tools/broker-komisyon-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">Broker Komisyon Hesaplayıcı</Link></li>
                            <li><Link href={`/${locale}/tools/yatirim-getirisi-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">Gayrimenkul ROI Hesaplayıcı</Link></li>
                            <li><Link href={`/${locale}/tools/metrekare-birim-fiyat`} className="text-blue-400 hover:text-blue-300 transition-colors">m² Birim Fiyat Hesaplayıcı</Link></li>
                            <li><Link href={`/${locale}/tools/insaat-maliyet-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">İnşaat Maliyet Hesaplayıcı</Link></li>
                            <li><Link href={`/${locale}/tools/damga-vergisi-hesaplayici`} className="text-blue-400 hover:text-blue-300 transition-colors">Damga Vergisi Hesaplayıcı</Link></li>
                            <li><Link href={`/${locale}/payment-plan-calculator`} className="text-blue-400 hover:text-blue-300 transition-colors">Ödeme Planı Sihirbazı</Link></li>
                        </ul>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">🏗️ Çözümler & Karşılaştırma</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href={`/${locale}/solutions/gayrimenkul-crm`} className="text-blue-400 hover:text-blue-300 transition-colors">Gayrimenkul CRM Yazılımı</Link></li>
                            <li><Link href={`/${locale}/solutions/insaat-crm`} className="text-blue-400 hover:text-blue-300 transition-colors">İnşaat CRM Yazılımı</Link></li>
                            <li><Link href={`/${locale}/karsilastirma/en-iyi-gayrimenkul-crm-2026`} className="text-blue-400 hover:text-blue-300 transition-colors">En İyi 10 Gayrimenkul CRM 2026</Link></li>
                            <li><Link href={`/${locale}/karsilastirma/oikos-crm-vs-emor`} className="text-blue-400 hover:text-blue-300 transition-colors">Oikos CRM vs e-MOR Karşılaştırma</Link></li>
                            <li><Link href={`/${locale}/karsilastirma/crm-vs-excel-gayrimenkul`} className="text-blue-400 hover:text-blue-300 transition-colors">CRM mi Excel mi?</Link></li>
                        </ul>
                    </div>
                </section>

                {/* Suggested Articles */}
                {suggestedArticles.length > 0 && (
                    <section className="mt-20">
                        <h2 className="text-2xl font-bold text-white mb-10 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                <Clock size={18} />
                            </div>
                            İlginizi Çekebilecek Diğer Yazılar
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            {suggestedArticles.map(rel => (
                                <Link
                                    key={rel.slug}
                                    href={`/${locale}/wiki/${rel.slug}`}
                                    className="group p-6 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/20 transition-all"
                                >
                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-3">{rel.category}</span>
                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">{rel.title}</h3>
                                    <p className="text-slate-500 text-sm line-clamp-2">{rel.excerpt}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Newsletter Box */}
                <div className="mt-32 p-10 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] -mr-32 -mt-32" />
                    <h3 className="text-2xl font-bold text-white mb-4">Bu makale yardımcı oldu mu?</h3>
                    <p className="text-slate-400 mb-8 max-w-md">
                        Haftalık gayrimenkul teknoloji bültenimize abone olarak sektördeki son gelişmeleri takip edebilirsiniz.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20">
                            Abone Ol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
