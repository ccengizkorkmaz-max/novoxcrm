
"use client";
import { useState } from 'react'
import { Briefcase, TrendingUp, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useBrandedTranslations } from '@/components/providers/BrandProvider'

const personas = [
    {
        id: 'patron',
        icon: Briefcase,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        id: 'sales',
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-500'
    },
    {
        id: 'broker',
        icon: Users,
        color: 'from-orange-500 to-red-500'
    }
]

export function PersonaSection() {
    const t = useBrandedTranslations('PersonaSection')
    const [activeTab, setActiveTab] = useState(personas[0])

    return (
        <section className="py-24 bg-slate-950">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        {t('title')}
                    </h2>
                    <p className="text-lg text-slate-400">
                        {t('description')}
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* Tabs */}
                    <div className="flex flex-wrap justify-center gap-4 mb-12">
                        {personas.map((persona) => (
                            <button
                                key={persona.id}
                                onClick={() => setActiveTab(persona)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 border
                                    ${activeTab.id === persona.id
                                        ? 'bg-slate-800 text-white border-slate-700 shadow-lg shadow-blue-900/20'
                                        : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-900 hover:text-slate-300'
                                    }`}
                            >
                                <persona.icon size={18} className={activeTab.id === persona.id ? 'text-blue-400' : ''} />
                                {t(`personas.${persona.id}.label`)}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="relative min-h-[400px] bg-slate-900/50 rounded-3xl border border-slate-800 backdrop-blur-sm p-8 md:p-12 overflow-hidden">
                        {/* Dynamic Gradient Background based on active tab */}
                        <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b ${activeTab.color} opacity-5 blur-[120px] rounded-full transition-colors duration-700`} />

                        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center h-full">
                            <div className="space-y-6">
                                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${activeTab.color} shadow-lg text-white mb-4`}>
                                    <activeTab.icon size={24} />
                                </div>

                                <h3 className="text-3xl font-bold text-white">{t(`personas.${activeTab.id}.title`)}</h3>
                                <p className="text-slate-400 text-lg leading-relaxed">
                                    {t(`personas.${activeTab.id}.description`)}
                                </p>

                                <ul className="space-y-4 pt-4">
                                    {(t.raw(`personas.${activeTab.id}.benefits`) as string[]).map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-3 text-slate-300">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${activeTab.color}`} />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>

                                <div className="pt-6">
                                    <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800" asChild>
                                        <Link href="/solutions">{t('cta')}</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Visual representation placeholder */}
                            <div className="relative aspect-square md:aspect-auto md:h-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group">
                                <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)]" />
                                <activeTab.icon size={80} className={`text-slate-800 transition-colors duration-500 group-hover:text-slate-700`} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
