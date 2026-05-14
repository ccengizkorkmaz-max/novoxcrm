'use client'


import Link from 'next/link'
import { Calculator, FileText, ArrowRight } from 'lucide-react'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { useBrandedTranslations } from '@/components/providers/BrandProvider'

export function ResourcesSection() {
    const t = useBrandedTranslations('ResourcesSection')

    return (
        <section className="py-24 bg-slate-950 border-t border-slate-900 relative">
            {/* Glow Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="container relative z-10 mx-auto px-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                            {t('title')} <span className="text-blue-500">{t('titleHighlight')}</span>
                        </h2>
                        <p className="text-slate-400 text-lg">
                            {t('description')}
                        </p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Calculator Card */}
                    <Link href="/payment-plan-calculator" className="group relative block p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                <Calculator size={28} />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-white">{t('cards.calculator.title')}</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                {t('cards.calculator.description')}
                            </p>
                            <div className="flex items-center font-bold text-blue-400 group-hover:text-blue-300 transition-colors">
                                {t('cards.calculator.cta')} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Report Card */}
                    <div className="group relative block p-0 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        <LeadCaptureModal
                            title={t('cards.report.modal.title')}
                            description={t('cards.report.modal.description')}
                            resourceName="HousingReport_2026"
                        >
                            <button className="w-full h-full text-left p-8 relative z-10">
                                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                    <FileText size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-white">{t('cards.report.title')}</h3>
                                <p className="text-slate-400 mb-8 leading-relaxed">
                                    {t('cards.report.description')}
                                </p>
                                <div className="flex items-center font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                                    {t('cards.report.cta')} <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </div>
        </section>
    )
}
