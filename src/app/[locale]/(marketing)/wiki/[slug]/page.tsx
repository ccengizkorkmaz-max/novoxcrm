
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Share2, BookOpen, ChevronRight } from 'lucide-react'
import { wikiArticles } from '@/data/wiki-data'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { Button } from '@/components/ui/button'

export default async function WikiArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = wikiArticles.find(a => a.slug === slug);

    if (!article) {
        notFound();
    }

    const relatedArticles = wikiArticles
        .filter(a => a.slug !== article.slug && (a.category === article.category))
        .slice(0, 2);

    return (
        <div className="bg-slate-950 min-h-screen pt-32 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Breadcrumbs & Back */}
                    <div className="flex items-center gap-4 mb-12">
                        <Link href="/wiki" className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
                            <ArrowLeft size={16} className="mr-2" /> Wiki'ye Dön
                        </Link>
                        <span className="w-1 h-1 rounded-full bg-slate-700" />
                        <span className="text-blue-400 text-sm font-medium uppercase tracking-wider">{article.category}</span>
                    </div>

                    {/* Article Header */}
                    <header className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight tracking-tight">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm py-6 border-y border-slate-900">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {article.author.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <div className="text-slate-200 font-bold leading-none mb-1">{article.author}</div>
                                    <div className="text-slate-500 text-xs">{article.authorTitle}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span>{article.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>{article.readTime} okuma</span>
                            </div>
                            <button className="flex items-center gap-2 hover:text-white transition-colors ml-auto">
                                <Share2 size={16} />
                                <span>Paylaş</span>
                            </button>
                        </div>
                    </header>

                    {/* Article Content */}
                    <article className="prose prose-invert prose-blue max-w-none mb-20">
                        {/* 
                            Note: In a real app we'd use react-markdown here. 
                            For this implementation we will map the paragraphs manually to ensure styling.
                        */}
                        <div className="article-body space-y-6 text-slate-300 text-[17px] leading-relaxed">
                            {article.content.trim().split('\n\n').map((para, i) => {
                                if (para.startsWith('# ')) {
                                    return <h1 key={i} className="text-2xl font-semibold text-white mt-10 mb-4">{para.replace('# ', '')}</h1>
                                }
                                if (para.startsWith('## ')) {
                                    return <h2 key={i} className="text-xl font-semibold text-white mt-8 mb-3 border-l-2 border-blue-600/50 pl-4">{para.replace('## ', '')}</h2>
                                }
                                if (para.startsWith('### ')) {
                                    return <h3 key={i} className="text-lg font-semibold text-blue-400 mt-6 mb-2">{para.replace('### ', '')}</h3>
                                }
                                if (para.includes('1. **') || para.includes('* **')) {
                                    return (
                                        <div key={i} className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/50 my-6">
                                            {para.split('\n').map((line, j) => (
                                                <div key={j} className="mb-2 flex gap-3 text-base">
                                                    <span className="text-blue-500/70">•</span>
                                                    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-semibold">$1</b>').replace(/^\d+\.\s+/, '').replace(/^\*\s+/, '') }} />
                                                </div>
                                            ))}
                                        </div>
                                    )
                                }
                                return <p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: para.replace(/\*\*(.*?)\*\*/g, '<b class="text-white font-semibold">$1</b>') }} />
                            })}
                        </div>
                    </article>

                    {/* Inline CTA Card */}
                    <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/20 mb-20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full group-hover:bg-blue-600/20 transition-all pointer-events-none" />
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold text-white mb-4">Dijital Dönüşüme Hazır mısınız?</h3>
                                <p className="text-slate-400">
                                    NovoxCRM'in bu makalede bahsedilen süreçleri projenizde nasıl otomatiğe bağladığını bizzat görün.
                                </p>
                            </div>
                            <LeadCaptureModal
                                title="Modern Satış Danışmanlığı"
                                description="Geleceğin proje satış ofisini beraber kurgulayalım. Ücretsiz demo için bilgilerinizi bırakın."
                                resourceName={`Wiki_CTA_${article.slug}`}
                            >
                                <Button size="lg" className="bg-white text-blue-900 hover:bg-slate-100 rounded-full font-bold px-8 h-14 shrink-0 transition-transform hover:scale-105">
                                    HEMEN DEMO İSTEYİN
                                </Button>
                            </LeadCaptureModal>
                        </div>
                    </div>

                    {/* Footer Nav */}
                    <div className="flex border-t border-slate-900 pt-12 items-center justify-between">
                        <div>
                            {relatedArticles.length > 0 && (
                                <>
                                    <h4 className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-widest">İlgili Makaleler</h4>
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        {relatedArticles.map(rel => (
                                            <Link key={rel.slug} href={`/wiki/${rel.slug}`} className="group block">
                                                <h5 className="text-white font-bold group-hover:text-blue-400 transition-colors line-clamp-2">{rel.title}</h5>
                                                <div className="flex items-center text-xs text-slate-500 mt-2 font-medium">
                                                    OKU <ChevronRight size={12} className="ml-1 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="hidden md:block">
                            <div className="w-16 h-16 rounded-full border border-slate-800 flex items-center justify-center text-slate-600">
                                <BookOpen size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
