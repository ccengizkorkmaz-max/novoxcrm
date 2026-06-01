import React from 'react'
import { Sparkles, Brain, CheckCircle2 } from 'lucide-react'

export interface GeoBlockProps {
    question: string;
    answer: string;
    summary: string;
    highlights: string[];
}

export function GeoBlock({ question, answer, summary, highlights }: GeoBlockProps) {
    return (
        <section className="my-16 max-w-4xl mx-auto px-4">
            <div className="relative group overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 transition-all duration-300 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-blue-500/15" />
                
                {/* AI / GEO badge */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 mb-6">
                    <Brain size={14} className="animate-pulse text-blue-400" />
                    <span>Hızlı Cevap (AI Arama Özeti)</span>
                </div>

                {/* Question */}
                <h3 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-start gap-2">
                    <Sparkles className="text-amber-400 shrink-0 mt-1" size={20} />
                    <span>{question}</span>
                </h3>

                {/* Answer Box */}
                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 p-6 mb-6 leading-relaxed text-slate-300">
                    <p className="text-base md:text-lg">
                        {answer}
                    </p>
                </div>

                {/* Summary & Highlights Grid */}
                <div className="grid md:grid-cols-12 gap-6 pt-6 border-t border-slate-800/80">
                    {/* Summary */}
                    <div className="md:col-span-5">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Özet (TL;DR)</h4>
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                            "{summary}"
                        </p>
                    </div>

                    {/* Highlights */}
                    <div className="md:col-span-7">
                        <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">En Önemli Noktalar</h4>
                        <ul className="space-y-2.5">
                            {highlights.map((h, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                    <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
