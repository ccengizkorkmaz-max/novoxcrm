'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import {
    Brain, Phone, MessageSquare, Mail, BarChart3, Shield, Zap,
    Building2, Users, Layers, Sparkles, Globe, Bot, Clock
} from 'lucide-react'
import { useBrandedTranslations } from '@/components/providers/BrandProvider'

function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return
        let start = 0
        const increment = target / (duration / 16)
        const timer = setInterval(() => {
            start += increment
            if (start >= target) {
                setCount(target)
                clearInterval(timer)
            } else {
                setCount(Math.floor(start))
            }
        }, 16)
        return () => clearInterval(timer)
    }, [isInView, target, duration])

    return <span ref={ref}>{count}{suffix}</span>
}

export function PlatformPowerSection() {
    const t = useBrandedTranslations('PlatformPower')

    const stats = [
        {
            value: 35,
            suffix: '+',
            label: t('stats.modules'),
            sublabel: t('stats.modulesDesc'),
            icon: Layers,
            gradient: 'from-blue-500 to-indigo-600',
            glow: 'shadow-blue-500/30',
        },
        {
            value: 5,
            suffix: '',
            label: t('stats.aiEngines'),
            sublabel: t('stats.aiEnginesDesc'),
            icon: Brain,
            gradient: 'from-purple-500 to-violet-600',
            glow: 'shadow-purple-500/30',
        },
        {
            value: 4,
            suffix: '',
            label: t('stats.channels'),
            sublabel: t('stats.channelsDesc'),
            icon: MessageSquare,
            gradient: 'from-emerald-500 to-green-600',
            glow: 'shadow-emerald-500/30',
        },
        {
            value: 0,
            suffix: '',
            displayText: '7/24',
            label: t('stats.seoPages'),
            sublabel: t('stats.seoPagesDesc'),
            icon: Clock,
            gradient: 'from-orange-500 to-red-500',
            glow: 'shadow-orange-500/30',
        },
    ]

    const channels = [
        { icon: Phone, name: t('channelNames.aiCall'), color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
        { icon: MessageSquare, name: t('channelNames.whatsapp'), color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        { icon: Mail, name: t('channelNames.sms'), color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
        { icon: Mail, name: t('channelNames.email'), color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    ]

    return (
        <section className="py-28 bg-slate-950 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-blue-600/5 blur-[150px] rounded-full" />
                <div className="absolute top-0 left-0 w-full h-full" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-4xl mx-auto mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-bold uppercase tracking-wider mb-6">
                        <Zap className="h-4 w-4" />
                        {t('badge')}
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        {t('title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400">
                            {t('titleHighlight')}
                        </span>
                    </h2>

                    <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
                        {t('description')}
                    </p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-20">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`group relative p-6 md:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-slate-600 transition-all duration-500 backdrop-blur-sm`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />

                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white mb-5 shadow-lg ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={24} />
                            </div>

                            <div className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight">
                                {stat.displayText || <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                            </div>
                            <div className="text-sm font-bold text-white mb-1">{stat.label}</div>
                            <div className="text-xs text-slate-500">{stat.sublabel}</div>
                        </motion.div>
                    ))}
                </div>

                {/* Communication Channels Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative max-w-4xl mx-auto"
                >
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-3">{t('channelsTitle')}</h3>
                        <p className="text-slate-400 text-sm">{t('channelsDesc')}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {channels.map((channel, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className={`flex items-center gap-3 p-4 rounded-2xl border ${channel.bg} backdrop-blur-sm hover:scale-105 transition-transform cursor-default`}
                            >
                                <channel.icon size={20} className={channel.color} />
                                <span className="text-sm font-bold text-white">{channel.name}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Center Connection Visual */}
                    <div className="mt-8 flex justify-center">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm">
                            <Bot size={16} className="text-violet-400" />
                            {t('allAiPowered')}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
