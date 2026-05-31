import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import DamgaVergisiClient from "./DamgaVergisiClient"
import Link from "next/link"

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Damga Vergisi Hesaplayıcı 2026 | Sözleşme Damga Vergisi - ${brandName}`,
        description: 'Damga vergisi hesaplama aracı. Gayrimenkul satış, kira ve taahhüt sözleşmelerinin damga vergisini 2026 güncel oranlarıyla anlık hesaplayın.',
        keywords: 'damga vergisi hesaplama, damga vergisi oranı 2026, sözleşme damga vergisi, gayrimenkul damga vergisi hesaplayıcı',
    }
}

export default async function DamgaVergisiPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "Damga vergisi oranı ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "2026 yılında gayrimenkul satış sözleşmelerinde damga vergisi oranı binde 9,48'dir (%0,948). Kira sözleşmelerinde binde 1,89'dur." } },
            { "@type": "Question", "name": "Damga vergisini kim öder?", "acceptedAnswer": { "@type": "Answer", "text": "Damga vergisi, sözleşmeyi imzalayan tarafların müşterek sorumluluğundadır. Uygulamada genellikle alıcı veya kiracı öder." } },
            { "@type": "Question", "name": "Hangi sözleşmeler damga vergisine tabi?", "acceptedAnswer": { "@type": "Answer", "text": "Gayrimenkul satış, kira, taahhüt, ihale sözleşmeleri başta olmak üzere belirli bedel içeren tüm sözleşmeler damga vergisine tabidir." } },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-sm font-medium text-rose-300 mb-8">Ücretsiz Araç</div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">Damga Vergisi{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-400">Hesaplayıcı</span></h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">Gayrimenkul satış ve kira sözleşmelerinin damga vergisini hesaplayın. <span className="text-rose-400 font-medium">2026 güncel oranları</span> ile.</p>
            </section>
            <section className="container mx-auto px-4 pb-20"><DamgaVergisiClient /></section>
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Damga Vergisi Hakkında SSS</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Damga vergisi oranı 2026&apos;da ne kadar?</h3><p className="text-slate-400">Gayrimenkul satış sözleşmelerinde binde 9,48 (%0,948), kira sözleşmelerinde binde 1,89 (%0,189) oranında uygulanır.</p></div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Damga vergisini kim öder?</h3><p className="text-slate-400">Taraflar müştereken sorumludur. Uygulamada genellikle alıcı veya kiracı üstlenir.</p></div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Damga vergisi ne zaman ödenir?</h3><p className="text-slate-400">Sözleşme imzalandıktan sonra en geç ertesi ayın 26. gününe kadar beyan edilip ödenmelidir.</p></div>
                    </div>
                </div>
            </section>
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-rose-900/20 to-slate-900 border border-rose-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Sözleşme Süreçlerinizi Dijitalleştirin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile sözleşme hazırlama, damga vergisi hesaplama ve dijital imza süreçlerini tek platformdan yönetin.</p>
                    <Link href={`/${locale}/solutions/gayrimenkul-crm`} className="inline-flex h-14 items-center px-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors">Gayrimenkul CRM Hakkında →</Link>
                </div>
            </section>
        </div>
    )
}
