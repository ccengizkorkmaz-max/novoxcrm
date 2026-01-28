
import Link from 'next/link'
import { Search, BookOpen, ArrowRight, TrendingUp, Shield, Users } from 'lucide-react'
import { wikiArticles } from '@/data/wiki-data'

export default function WikiPage() {
    const categories = Array.from(new Set(wikiArticles.map(a => a.category)));

    return (
        <div className="bg-slate-950 min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-4">
                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6">
                        <BookOpen size={16} /> BİLGİ BANKASI
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        Gayrimenkul Teknolojileri <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Rehberi</span>
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Sektördeki dijital dönüşüm, stratejik yönetim ve teknoloji trendleri üzerine derinlemesine makaleler.
                    </p>

                    {/* Search Bar Mockup */}
                    <div className="mt-12 relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Makale, konu veya kategori ara..."
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-2xl"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="flex flex-wrap justify-center gap-4 mb-16">
                    <button className="px-6 py-2 rounded-full bg-blue-600 text-white font-medium text-sm">Tümü</button>
                    {categories.map(cat => (
                        <button key={cat} className="px-6 py-2 rounded-full bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white transition-all text-sm">
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Article Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {wikiArticles.map((article) => (
                        <Link
                            key={article.slug}
                            href={`/wiki/${article.slug}`}
                            className="group p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all flex flex-col h-full relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <span className="px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-wider">
                                        {article.category}
                                    </span>
                                    <span className="text-slate-500 text-xs">{article.readTime} okuma</span>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                                    {article.title}
                                </h3>

                                <p className="text-slate-400 leading-relaxed mb-8 line-clamp-2">
                                    {article.excerpt}
                                </p>

                                <div className="flex items-center gap-2 mb-8 mt-auto">
                                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                                        {article.author.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-xs text-slate-500 font-medium">{article.author}</span>
                                </div>

                                <div className="flex items-center text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                                    Makaleyi Oku <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Newsletter / CTA Section */}
                <div className="mt-32 max-w-5xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/10 text-center relative overflow-hidden text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Yeni Makalelerden Haberdar Olun</h2>
                    <p className="text-slate-400 mb-10 max-w-xl mx-auto">
                        Gayrimenkul teknolojileri ve dijital dönüşüm stratejilerini ayda bir kez e-postanızda görün.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="E-posta adresiniz"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
                            Abone Ol
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
