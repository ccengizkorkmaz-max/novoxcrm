
import { XCircle, CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function ComparisonSection() {
    const t = useTranslations('ComparisonSection')

    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden">
            {/* Background Split */}
            <div className="absolute inset-0 flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 h-full bg-red-950/10 border-r border-red-900/20" />
                <div className="w-full md:w-1/2 h-full bg-green-950/10 border-l border-green-900/20" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        {t('title')}
                    </h2>
                    <p className="text-lg text-slate-400">
                        {t('subtitle')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* The Old Way (Excel) */}
                    <div className="bg-red-950/20 border border-red-900/30 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[80px] rounded-full" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <XCircle size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-red-400">{t('oldWay.title')}</h3>
                        </div>

                        <ul className="space-y-6">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <li key={i} className="flex items-start gap-4 text-red-200/60">
                                    <XCircle size={20} className="shrink-0 mt-1 text-red-500/50" />
                                    <span>{t(`oldWay.items.${i}`)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* The New Way (NovoxCRM) */}
                    <div className="bg-green-950/20 border border-green-900/30 rounded-3xl p-8 md:p-12 relative overflow-hidden backdrop-blur-sm shadow-[0_0_50px_rgba(22,163,74,0.15)] ring-1 ring-green-500/20">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-green-600/10 blur-[80px] rounded-full" />

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                <CheckCircle size={24} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-400">{t('newWay.title')}</h3>
                        </div>

                        <ul className="space-y-6">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <li key={i} className="flex items-start gap-4 text-green-100">
                                    <CheckCircle size={20} className="shrink-0 mt-1 text-green-500" />
                                    <span className="font-medium">{t(`newWay.items.${i}`)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
