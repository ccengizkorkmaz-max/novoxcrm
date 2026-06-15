'use client'

import { Check, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { useBrandedTranslations } from '@/components/providers/BrandProvider'
import { motion } from 'framer-motion'

export function PricingSection() {
    const t = useBrandedTranslations('PricingSection')

    const plans = [
        {
            key: "starter",
            popular: false,
            accent: 'slate',
        },
        {
            key: "professional",
            popular: true,
            accent: 'blue',
        },
        {
            key: "business",
            popular: false,
            accent: 'violet',
        },
        {
            key: "enterprise",
            popular: false,
            accent: 'amber',
        }
    ]

    return (
        <section className="py-32 bg-slate-950 relative" id="pricing">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                        {t('title')}
                    </h2>
                    <p className="text-lg text-slate-400 mb-8">
                        {t('description')}
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative flex flex-col p-7 rounded-3xl border transition-all duration-300
                                ${plan.popular
                                    ? 'bg-slate-900/80 border-blue-500 shadow-2xl shadow-blue-500/10 lg:scale-[1.03] z-10'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
                                    <Sparkles size={14} />
                                    {t('popularTag')}
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-lg font-bold mb-1.5 text-white">{t(`plans.${plan.key}.name`)}</h3>
                                <p className="text-xs text-slate-500 mb-5 leading-relaxed">{t(`plans.${plan.key}.description`)}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-xl md:text-2xl font-bold ${plan.popular ? 'text-blue-400' : 'text-slate-300'}`}>
                                        {t('requestInfo')}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 w-full mb-6" />

                            <ul className="space-y-3 mb-7 flex-1">
                                {(t.raw(`plans.${plan.key}.features`) as string[]).map((feature, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-slate-300">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                            <Check size={11} strokeWidth={3} />
                                        </div>
                                        <span className="text-[13px] leading-snug">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <LeadCaptureModal
                                title={`${t(`plans.${plan.key}.name`)} ${t('title')}`}
                                description={`${t(`plans.${plan.key}.name`)} - ${t(`plans.${plan.key}.description`)}`}
                                resourceName={`Pricing_${plan.key}_Request`}
                            >
                                <Button
                                    size="lg"
                                    variant={plan.popular ? 'default' : 'outline'}
                                    suppressHydrationWarning
                                    className={`w-full rounded-xl h-11 font-semibold text-sm transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]'
                                            : 'bg-transparent border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    {t(`plans.${plan.key}.cta`)}
                                </Button>
                            </LeadCaptureModal>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom note */}
                <p className="text-center text-slate-600 text-xs mt-8 max-w-2xl mx-auto">
                    {t('bottomNote')}
                </p>
            </div>
        </section>
    )
}
