import { Button } from '@/components/ui/button'
import { ChevronRight, Sparkles } from 'lucide-react'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

import { HeroCarousel } from '@/components/marketing/HeroCarousel'

export function Hero() {
    const t = useTranslations('Hero')

    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 hero-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4 text-center">
                {/* Badge Container */}
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-300 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                        {t('badge')}
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.2)] animate-bounce text-nowrap">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-indigo-400" />
                        Sektörün İlk AI Destekli CRM'i
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-8 leading-[1.1]">
                    {t('title1')} <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                        {t('titleHighlight')}
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="max-w-4xl mx-auto text-xl text-slate-400 mb-10 leading-relaxed">
                    {t('description').split('Novo CRM').map((part, i, arr) => (
                        <span key={i}>
                            {part}
                            {i < arr.length - 1 && <span className="text-white font-bold">Novo CRM</span>}
                        </span>
                    ))}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <LeadCaptureModal
                        title={t('demoTitle')}
                        description={t('demoDescription')}
                        resourceName="Hero_Demo_Request"
                    >
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-900/40 group">
                            <span className="flex items-center font-bold">
                                {t('ctaPrimary')}
                                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </LeadCaptureModal>

                    <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-full text-slate-300 hover:text-white hover:bg-white/5 border border-slate-800" asChild>
                        <Link href="/solutions" className="flex items-center">
                            {t('ctaSecondary')}
                        </Link>
                    </Button>
                </div>

                <HeroCarousel />
            </div>
        </section>
    )
}
