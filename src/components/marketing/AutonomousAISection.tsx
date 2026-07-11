'use client'

import { motion } from 'framer-motion'
import {
    Brain, DollarSign, Sparkles, TrendingUp, Users,
    Zap, BarChart3, Phone, MessageSquare, Bot,
    Rocket, Target, ShieldCheck, GitBranch
} from 'lucide-react'

const features = [
    {
        icon: Brain,
        gradient: 'from-violet-500 to-purple-600',
        glow: 'violet',
        title: 'AI Lead Scoring',
        subtitle: 'Prediktif 0-100 Skor',
        desc: 'GPT-4o her müşteriyi analiz eder: arama geçmişi, WhatsApp cevapları, randevu durumu. Kimin alacağını AI bilir.',
        stats: ['0-100 nümerik skor', 'Gerçek zamanlı güncelleme', 'Pipeline sıralama'],
    },
    {
        icon: Zap,
        gradient: 'from-amber-500 to-orange-600',
        glow: 'amber',
        title: 'Otomatik Kanal Seçimi',
        subtitle: 'AI en iyi kanalı seçer',
        desc: 'Her müşteri için en etkili iletişim kanalını AI belirler. Telefon mu? WhatsApp mı? Geçmiş veriden öğrenir.',
        stats: ['Kanal bazlı cevap oranı', 'Otomatik yönlendirme', 'Fallback mekanizması'],
    },
    {
        icon: GitBranch,
        gradient: 'from-emerald-500 to-green-600',
        glow: 'emerald',
        title: 'A/B Script Test',
        subtitle: 'Bilimsel optimizasyon',
        desc: 'İki farklı arama senaryosunu eş zamanlı test edin. Hangi yaklaşım daha çok randevu aldırıyor? Veriyle karar verin.',
        stats: ['%50/%50 otomatik dağıtım', 'Canlı performans takibi', 'Tek tıkla kazanan seç'],
    },
    {
        icon: DollarSign,
        gradient: 'from-blue-500 to-cyan-600',
        glow: 'blue',
        title: 'Revenue Attribution',
        subtitle: 'Satışın hikayesi',
        desc: 'Her satışın arkasındaki yolculuğu takip edin. Maya kaç arama yaptı? Hangi kanal satışa dönüştü? ROI ölçün.',
        stats: ['Satış yolculuğu timeline', 'Maya katkı analizi', 'Kanal bazlı ROI'],
    },
    {
        icon: Users,
        gradient: 'from-pink-500 to-rose-600',
        glow: 'pink',
        title: 'Akıllı Segment Önerileri',
        subtitle: 'AI kampanya önerir',
        desc: 'AI, CRM verinizi tarayıp aksiyon gerektiren müşteri gruplarını tespit eder. "142 lead sessiz → kampanya başlat" gibi.',
        stats: ['Sessiz lead tespiti', 'Sıcak lead algılama', 'Tek tıkla kampanya'],
    },
    {
        icon: TrendingUp,
        gradient: 'from-indigo-500 to-violet-600',
        glow: 'indigo',
        title: 'Self-Learning Script',
        subtitle: 'Kendi kendini optimize eder',
        desc: 'Başarılı aramaların kalıplarını analiz eder, hangi ifadeler randevu aldırıyor öğrenir ve prompt\'u otomatik iyileştirir.',
        stats: ['Kalıp analizi', 'Otomatik iyileştirme', 'Prompt karşılaştırma'],
    },
]

export function AutonomousAISection() {
    return (
        <section className="py-28 bg-slate-950 relative overflow-hidden" id="level5">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-violet-600/6 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-blue-600/6 blur-[180px] rounded-full" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/4 blur-[200px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center max-w-4xl mx-auto mb-20"
                >
                    {/* Level 5 Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/30 text-violet-300 text-sm font-bold uppercase tracking-wider mb-6">
                        <Rocket className="h-4 w-4" />
                        LEVEL 5 — OTONOM SATIŞ MAKİNASI
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        AI Satış Asistanı{' '}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-amber-400">
                            Kendi Kendine Öğrenir
                        </span>
                    </h2>

                    <p className="text-xl text-slate-400 leading-relaxed max-w-3xl mx-auto">
                        Maya AI sadece arama yapmaz — hangi müşteriyi, hangi kanaldan, hangi mesajla aramanız gerektiğini
                        kendi öğrenir ve optimize eder. Tam otonom satış makinası.
                    </p>
                </motion.div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {features.map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-violet-500/30 transition-all duration-500 backdrop-blur-sm"
                        >
                            {/* Glow effect on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-${feat.glow}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                                    <feat.icon size={24} />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-violet-300 transition-colors">
                                    {feat.title}
                                </h3>
                                <p className="text-xs font-semibold text-violet-400 mb-3 uppercase tracking-wider">
                                    {feat.subtitle}
                                </p>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    {feat.desc}
                                </p>

                                {/* Stats */}
                                <div className="space-y-1.5">
                                    {feat.stats.map((stat, j) => (
                                        <div key={j} className="flex items-center gap-2 text-[11px] text-slate-500">
                                            <Sparkles className="h-3 w-3 text-violet-500/50 flex-shrink-0" />
                                            {stat}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom line */}
                            <div className="mt-5 h-0.5 w-0 bg-gradient-to-r from-violet-500 to-blue-500 group-hover:w-full transition-all duration-700 rounded-full" />
                        </motion.div>
                    ))}
                </div>

                {/* Bottom CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mt-16"
                >
                    <div className="inline-flex flex-col md:flex-row items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">AI</div>
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">L5</div>
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold border-2 border-slate-900">🚀</div>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white">9 AI Özellik · 3 Faz · Tam Otonom</p>
                                <p className="text-xs text-slate-400">Cooldown → Scoring → A/B Test → Revenue → Self-Learning</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
