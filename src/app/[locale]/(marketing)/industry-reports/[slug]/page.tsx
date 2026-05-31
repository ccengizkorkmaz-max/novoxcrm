import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { reports } from "@/data/reports-data"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import { Calendar, User, Clock, ArrowLeft, BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"

export async function generateStaticParams() {
    const locales = ['tr', 'en']
    return locales.flatMap(locale =>
        reports.map(r => ({ locale, slug: r.slug }))
    )
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string; locale: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const report = reports.find(r => r.slug === slug)
    if (!report) return {}
    return {
        title: report.metaTitle,
        description: report.metaDescription,
        keywords: `${report.title.toLowerCase()}, gayrimenkul benchmark, konut satış istatistikleri`,
    }
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
    const { slug, locale } = await params
    const report = reports.find(r => r.slug === slug)
    if (!report) notFound()

    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Raporlar", "item": `${baseUrl}/${locale}/industry-reports` },
            { "@type": "ListItem", "position": 3, "name": report.title, "item": `${baseUrl}/${locale}/industry-reports/${report.slug}` }
        ]
    }

    const reportSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": report.title,
        "description": report.metaDescription,
        "datePublished": "2026-05-15T00:00:00.000Z",
        "author": { "@type": "Person", "name": report.author, "jobTitle": report.authorTitle },
        "publisher": { "@type": "Organization", "name": brandName, "logo": { "@type": "ImageObject", "url": `${baseUrl}/favicon.ico` } },
        "mainEntityOfPage": `${baseUrl}/${locale}/industry-reports/${report.slug}`
    }

    const otherReports = reports.filter(r => r.slug !== report.slug).slice(0, 3)

    return (
        <div className="bg-slate-950 min-h-screen pt-28 pb-24 text-slate-100 selection:bg-indigo-600/30">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reportSchema) }} />

            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back button */}
                <Link href={`/${locale}/industry-reports`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={16} /> Raporlar Listesine Dön
                </Link>

                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{report.category}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {report.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {report.readTime}</span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-8">
                    {report.title}
                </h1>

                {/* Author card */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 mb-12 backdrop-blur-sm">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                        {report.author.charAt(0)}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">{report.author}</div>
                        <div className="text-xs text-slate-500 font-medium">{report.authorTitle}</div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 mb-12 shadow-xl">
                    {report.stats.map((st, idx) => (
                        <div key={idx} className="text-center md:text-left md:border-r border-slate-800 last:border-0 pr-4">
                            <div className="text-2xl font-black text-indigo-400 mb-1">{st.value}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold leading-tight">{st.label}</div>
                        </div>
                    ))}
                </div>

                {/* Content Block */}
                <article className="prose prose-invert max-w-none prose-headings:text-white prose-h2:text-2xl prose-h2:font-extrabold prose-h3:text-xl prose-h3:font-bold prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-table:w-full prose-th:text-white prose-td:text-slate-400 prose-tr:border-b prose-tr:border-slate-800/60 pb-16 border-b border-slate-900">
                    <div dangerouslySetInnerHTML={{
                        __html: report.content
                            .replace(/#\s(.*)/, "") // strip main H1 as it is rendered above
                            .replace(/##\s(.*)/g, '<h2 class="text-2xl font-bold text-white mt-12 mb-4">$1</h2>')
                            .replace(/###\s(.*)/g, '<h3 class="text-xl font-bold text-white mt-8 mb-3">$1</h3>')
                            .replace(/blockquote>\s\*(.*)\*/g, 'blockquote class="border-l-4 border-indigo-500 bg-indigo-500/5 p-5 rounded-r-2xl my-6 text-slate-300 italic">$1</blockquote')
                            .replace(/>\s\*(.*)\*/g, '<blockquote class="border-l-4 border-indigo-500 bg-indigo-500/5 p-5 rounded-r-2xl my-6 text-slate-300 italic">$1</blockquote>')
                            .replace(/-\s\*\*(.*)\*\*:\s(.*)/g, '<li class="my-2"><strong class="text-white">$1:</strong> $2</li>')
                            .replace(/\|\s(.*)\s\|/g, (match) => {
                                // Simple table formatter converter
                                if (match.includes("---")) return "";
                                const cols = match.split("|").map(c => c.trim()).filter(Boolean);
                                const isHeader = match.includes("Aşama") || match.includes("Metrik") || match.includes("Kanal");
                                const cellTag = isHeader ? "th" : "td";
                                const cells = cols.map(c => `<${cellTag} class="p-3 text-left border-b border-slate-800">${c}</${cellTag}>`).join("");
                                return `<tr class="${isHeader ? 'bg-slate-900/50 font-bold' : ''}">${cells}</tr>`;
                            })
                            .replace(/(<tr[\s\S]*<\/tr>)/g, '<table class="w-full border-collapse border border-slate-800 my-8 rounded-xl overflow-hidden">$1</table>')
                            .replace(/<\/table>\s*<table[^>]*>/g, "") // merge tables
                    }} />
                </article>

                {/* Other reports links */}
                <section className="pt-16">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-400" /> Diğer Sektörel Analizler
                    </h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {otherReports.map(r => (
                            <Link key={r.slug} href={`/${locale}/industry-reports/${r.slug}`} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 group flex flex-col justify-between shadow-md">
                                <h4 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors leading-snug mb-3">
                                    {r.title}
                                </h4>
                                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">{r.category}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}
