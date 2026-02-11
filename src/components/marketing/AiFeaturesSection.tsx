'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Brain, Mic, Target, ShieldCheck, Sparkles } from 'lucide-react'

const icons = {
    copilot: Brain,
    voice: Mic,
    match: Target,
    audit: ShieldCheck,
}

export function AiFeaturesSection() {
    const t = useTranslations('AiFeaturesSection')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1
        }
    }

    const featureKeys = ['copilot', 'voice', 'match', 'audit'] as const

    return (
        <section className="py-24 bg-slate-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-wider mb-6"
                    >
                        <Sparkles className="h-4 w-4" />
                        {t('badge')}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight"
                    >
                        {t('title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
                            {t('titleHighlight')}
                        </span>
                    </motion.h2>

                    <p className="text-xl text-slate-400">
                        {t('description')}
                    </p>
                </div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {featureKeys.map((key) => {
                        const Icon = icons[key]
                        return (
                            <motion.div
                                key={key}
                                variants={itemVariants}
                                className="group p-8 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-indigo-500/30 transition-all duration-500 backdrop-blur-sm relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Icon size={120} />
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40 group-hover:scale-110 transition-transform duration-500">
                                        <Icon size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">
                                            {t(`features.${key}.title`)}
                                        </h3>
                                        <p className="text-lg text-slate-400 leading-relaxed">
                                            {t(`features.${key}.desc`)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 h-1 w-0 bg-gradient-to-r from-indigo-500 to-blue-500 group-hover:w-full transition-all duration-700 rounded-full" />
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}
