
import { AlertCircle, Users, Database, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function PainSection() {
    const t = useTranslations('PainSection')

    const problems = [
        {
            key: 'sales',
            icon: AlertCircle,
            color: "text-red-400 not-bg"
        },
        {
            key: 'broker',
            icon: Users,
            color: "text-orange-400 not-bg"
        },
        {
            key: 'data',
            icon: Database,
            color: "text-purple-400 not-bg"
        },
        {
            key: 'delivery',
            icon: FileText,
            color: "text-blue-400 not-bg"
        }
    ]

    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden" id="why-novox">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                        {t('title')} <span className="text-blue-500">{t('titleHighlight')}</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        {t('description')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {problems.map((item, i) => (
                        <div key={i} className="group relative p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                            {/* Hover Gradient */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="font-bold text-xl mb-4 text-white group-hover:text-blue-400 transition-colors">{t(`cards.${item.key}.title`)}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{t(`cards.${item.key}.desc`)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
