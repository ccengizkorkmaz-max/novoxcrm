'use client'


import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useBrandedTranslations } from '@/components/providers/BrandProvider'

export function FAQSection() {
    const t = useBrandedTranslations('FAQSection')

    return (
        <section className="py-24 bg-slate-950 relative border-t border-slate-900" id="faq">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-12 gap-12">
                    <div className="md:col-span-4">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            {t('title')} <br /> <span className="text-blue-500">{t('titleHighlight')}</span>
                        </h2>
                        <p className="text-slate-400 mb-8">
                            {t('description')}
                        </p>
                    </div>

                    <div className="md:col-span-8">
                        <Accordion type="single" collapsible className="w-full space-y-4" suppressHydrationWarning>
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 rounded-xl px-4 bg-slate-900/30 data-[state=open]:bg-slate-900/80 data-[state=open]:border-blue-500/30 transition-all duration-200">
                                    <AccordionTrigger className="text-white hover:text-blue-400 hover:no-underline text-left text-lg font-medium py-6">
                                        {t(`items.${i}.question`)}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-400 text-base pb-6 leading-relaxed">
                                        {t(`items.${i}.answer`)}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
}
