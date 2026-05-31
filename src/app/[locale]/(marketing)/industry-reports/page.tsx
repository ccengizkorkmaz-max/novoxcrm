import type { Metadata } from "next"
import { reports } from "@/data/reports-data"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { Calendar, User, Clock, ArrowRight, BarChart3 } from "lucide-react"
import Link from "next/link"

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Gayrimenkul Sektörel Benchmark Raporları & Analizler | ${brandName}`,
        description: `Türkiye konut projeleri satış dönüşüm oranları, WhatsApp yanıt süreleri, broker performans analizleri ve gayrimenkul veri raporları.`,
        keywords: "gayrimenkul raporu, konut satış benchmark, emlak analizleri, emlak istatistikleri 2026",
    }
}

export default async function ReportsIndexPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    return (
        <div className="bg-slate-950 min-h-screen pt-28 pb-24 text-slate-100 selection:bg-indigo-600/30">
            {/* Header */}
            <section className="container mx-auto px-4 text-center max-w-4xl mb-20 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 mb-6 backdrop-blur-md uppercase tracking-wider">
                    <BarChart3 size={12} className="mr-1.5 text-indigo-400" /> Araştırma & Veri
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-8 text-white tracking-tight leading-tight">
                    Gayrimenkul Satış &<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
                        Benchmark Raporları
                    </span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
                    Sektör genelinden toplanan anonimleştirilmiş ve konsolide edilmiş gerçek verilerle, gayrimenkul ve inşaat satış süreçlerindeki en doğru performans kriterlerini keşfedin.
                </p>
            </section>

            {/* Reports Grid */}
            <section className="container mx-auto px-4 max-w-6xl">
                <div className="grid md:grid-cols-2 gap-8">
                    {reports.map((report) => (
                        <div key={report.slug} className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 group flex flex-col justify-between shadow-xl">
                            <div>
                                {/* Meta row */}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">
                                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{report.category}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {report.date}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-indigo-300 transition-colors">
                                    {report.title}
                                </h2>
                                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                    {report.excerpt}
                                </p>

                                {/* Highlights grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                                    {report.stats.slice(0, 2).map((st, idx) => (
                                        <div key={idx}>
                                            <div className="text-lg font-black text-indigo-400">{st.value}</div>
                                            <div className="text-[10px] text-slate-500 uppercase font-semibold">{st.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <User size={12} />
                                    <span>{report.author}</span>
                                    <span>·</span>
                                    <Clock size={12} />
                                    <span>{report.readTime}</span>
                                </div>
                                <Link href={`/${locale}/industry-reports/${report.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                                    Raporu Oku <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Corporate CTA */}
            <section className="py-24 container mx-auto px-4 text-center">
                <div className="p-12 md:p-16 rounded-[40px] bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-indigo-500/20 max-w-4xl mx-auto shadow-2xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Kendi Satış Ofisi Performansınızı Ölçün</h2>
                    <p className="text-slate-400 mb-10 max-w-2xl mx-auto">
                        {brandName} CRM altyapısı ile lead dönüşüm oranlarınızı, WhatsApp yanıt hızlarınızı ve broker komisyonlarınızı gerçek zamanlı takip etmeye başlayın.
                    </p>
                    <Link href={`/${locale}/solutions/insaat-crm`} className="inline-flex h-14 items-center px-10 rounded-full bg-white text-indigo-950 hover:bg-slate-100 font-extrabold shadow-lg transition-transform hover:scale-[1.02] duration-300">
                        Hemen Başlayın
                    </Link>
                </div>
            </section>
        </div>
    )
}
