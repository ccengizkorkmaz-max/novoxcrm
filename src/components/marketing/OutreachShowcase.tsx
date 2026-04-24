'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
    Phone, MessageSquare, Mail, Clock, GitBranch, Sparkles,
    Workflow, Users, BarChart3, Bot, Zap, ArrowRight
} from 'lucide-react'

export function OutreachShowcase() {
    const t = useTranslations('OutreachShowcase')

    const steps = [
        {
            icon: Users,
            color: 'bg-blue-500',
            title: t('steps.segment.title'),
            desc: t('steps.segment.desc'),
        },
        {
            icon: Phone,
            color: 'bg-violet-500',
            title: t('steps.aiCall.title'),
            desc: t('steps.aiCall.desc'),
        },
        {
            icon: MessageSquare,
            color: 'bg-green-500',
            title: t('steps.whatsapp.title'),
            desc: t('steps.whatsapp.desc'),
        },
        {
            icon: Mail,
            color: 'bg-amber-500',
            title: t('steps.sms.title'),
            desc: t('steps.sms.desc'),
        },
        {
            icon: Clock,
            color: 'bg-slate-500',
            title: t('steps.wait.title'),
            desc: t('steps.wait.desc'),
        },
        {
            icon: BarChart3,
            color: 'bg-emerald-500',
            title: t('steps.convert.title'),
            desc: t('steps.convert.desc'),
        },
    ]

    const features = [
        { icon: Workflow, text: t('features.workflow') },
        { icon: Bot, text: t('features.aiVoice') },
        { icon: Clock, text: t('features.schedule') },
        { icon: Sparkles, text: t('features.retry') },
        { icon: GitBranch, text: t('features.branch') },
        { icon: Zap, text: t('features.realtime') },
    ]

    return (
        <section className="py-28 bg-slate-900 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/8 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-green-600/8 blur-[150px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-4xl mx-auto mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-bold uppercase tracking-wider mb-6">
                        <Workflow className="h-4 w-4" />
                        {t('badge')}
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        {t('title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-green-400 to-blue-400">
                            {t('titleHighlight')}
                        </span>
                    </h2>

                    <p className="text-xl text-slate-400 leading-relaxed">
                        {t('description')}
                    </p>
                </motion.div>

                {/* Visual Flow */}
                <div className="max-w-5xl mx-auto mb-20">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="relative group"
                            >
                                <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/70 hover:border-violet-500/30 transition-all duration-300">
                                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                                        <step.icon size={22} />
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                                </div>

                                {/* Arrow */}
                                {i < steps.length - 1 && (
                                    <div className="absolute top-1/2 -right-2 z-10 hidden lg:block">
                                        <ArrowRight size={14} className="text-slate-600" />
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Feature Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto"
                >
                    {features.map((feat, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-300 text-sm hover:border-violet-500/30 hover:text-white transition-colors"
                        >
                            <feat.icon size={14} className="text-violet-400" />
                            {feat.text}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}
