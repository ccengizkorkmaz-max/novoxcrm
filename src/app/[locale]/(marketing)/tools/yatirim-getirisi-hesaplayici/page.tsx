import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import ROIClient from "./ROIClient"
import Link from "next/link"

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Gayrimenkul ROI Hesaplayıcı 2026 | Yatırım Getirisi - ${brandName}`,
        description: 'Gayrimenkul yatırım getirisi (ROI) hesaplama aracı. Alış-satış fiyatı, kira geliri ve giderlerle toplam yatırım getirinizi hesaplayın.',
        keywords: 'gayrimenkul ROI hesaplama, yatırım getirisi hesaplayıcı, kira getirisi hesaplama, gayrimenkul yatırım analizi',
    }
}

export default async function ROIPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "Gayrimenkul ROI nasıl hesaplanır?", "acceptedAnswer": { "@type": "Answer", "text": "Gayrimenkul ROI = (Toplam Getiri / Yatırım Tutarı) × 100. Toplam getiri = kira geliri + değer artışı - giderler." } },
            { "@type": "Question", "name": "İyi bir gayrimenkul ROI oranı nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Yıllık %8-12 ROI gayrimenkul yatırımında iyi kabul edilir. Kira getirisi yıllık %4-6, değer artışı ile birlikte %8+ hedeflenmelidir." } },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-8">Ücretsiz Araç</div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                    Gayrimenkul ROI{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Hesaplayıcı</span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">Yatırım getirisi, kira çarpanı ve geri dönüş süresini anlık hesaplayın.</p>
            </section>
            <section className="container mx-auto px-4 pb-20"><ROIClient /></section>
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Gayrimenkul ROI Hakkında SSS</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">ROI nedir?</h3><p className="text-slate-400">ROI (Return on Investment), yatırımınızın toplam getirisinin yatırım tutarına oranıdır. Gayrimenkulde kira geliri ve değer artışı dahil edilir.</p></div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Kira getirisi nasıl hesaplanır?</h3><p className="text-slate-400">Yıllık kira gelirini mülkün alış fiyatına bölerek yüzde olarak ifade edilir. Örneğin 3M TL mülk, aylık 15K kira → %6 kira getirisi.</p></div>
                    </div>
                </div>
            </section>
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Yatırım Portföyünüzü AI ile Optimize Edin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile müşterilerinize ROI analizleri sunun ve satış dönüşümünüzü artırın.</p>
                    <Link href={`/${locale}/solutions/ai-musteri-analizi`} className="inline-flex h-14 items-center px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">AI Müşteri Analizi Hakkında →</Link>
                </div>
            </section>
        </div>
    )
}
