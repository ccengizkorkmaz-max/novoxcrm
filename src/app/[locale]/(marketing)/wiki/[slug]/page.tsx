
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, Tag, Share2, MessageCircle } from 'lucide-react'
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

                {/* Article Content */}
                <article className="prose prose-invert prose-lg max-w-none mb-20 prose-headings:text-white prose-p:text-slate-400 prose-strong:text-blue-400 prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-li:text-slate-400 prose-code:text-indigo-300">
                    <div dangerouslySetInnerHTML={{ __html: formatContent(article.content) }} />
                </article>

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
