import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import BrokerKomisyonClient from "./BrokerKomisyonClient"
import Link from "next/link"

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Broker Komisyon Hesaplayıcı 2026 | Ücretsiz Araç - ${brandName}`,
        description: 'Gayrimenkul broker komisyon hesaplama aracı. Satış bedeli, komisyon oranı, KDV ve stopaj dahil net broker gelirini anlık hesaplayın.',
        keywords: 'broker komisyon hesaplama, gayrimenkul komisyon oranı, emlak komisyon hesaplayıcı, broker hakediş hesaplama',
        alternates: {
            canonical: locale === 'en' ? `/en/tools/broker-komisyon-hesaplayici` : `/tools/broker-komisyon-hesaplayici`,
            languages: {
                tr: `/tools/broker-komisyon-hesaplayici`,
                en: `/en/tools/broker-komisyon-hesaplayici`,
            }
        }
    }
}

export default async function BrokerKomisyonPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "Gayrimenkul broker komisyon oranı ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Türkiye'de gayrimenkul broker komisyon oranı genellikle satış bedelinin %2-3'ü arasındadır. Lüks projelerde %4-5'e çıkabilir. Oran, proje ve anlaşmaya göre değişir." } },
            { "@type": "Question", "name": "Broker komisyonundan stopaj kesilir mi?", "acceptedAnswer": { "@type": "Answer", "text": "Evet, broker komisyonundan %20 oranında gelir vergisi stopajı kesilir. Stopaj, komisyonu ödeyen firma tarafından vergi dairesine beyan edilir." } },
            { "@type": "Question", "name": "Broker komisyonunda KDV var mı?", "acceptedAnswer": { "@type": "Answer", "text": "Evet, broker hizmeti %20 KDV'ye tabidir. Broker faturasında komisyon tutarı + %20 KDV olarak gösterilir." } },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 mb-8">
                    Ücretsiz Araç
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                    Broker Komisyon{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                        Hesaplayıcı
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">
                    Gayrimenkul satışında broker komisyonu, KDV ve stopaj dahil net geliri hesaplayın.
                    <span className="text-emerald-400 font-medium"> 2026 güncel oranları</span> ile.
                </p>
            </section>

            <section className="container mx-auto px-4 pb-20">
                <BrokerKomisyonClient />
            </section>

            {/* FAQ */}
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Broker Komisyonu Hakkında Sıkça Sorulan Sorular</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Gayrimenkul broker komisyon oranı ne kadar?</h3>
                            <p className="text-slate-400">Türkiye&apos;de gayrimenkul broker komisyon oranı genellikle satış bedelinin %2-3&apos;ü arasındadır. Lüks projelerde %4-5&apos;e çıkabilir.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Broker komisyonundan stopaj kesilir mi?</h3>
                            <p className="text-slate-400">Evet, broker komisyonundan %20 oranında gelir vergisi stopajı kesilir. Stopaj, komisyonu ödeyen firma tarafından beyan edilir.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Broker komisyonunda KDV var mı?</h3>
                            <p className="text-slate-400">Evet, broker hizmeti %20 KDV&apos;ye tabidir. Faturada komisyon tutarı + %20 KDV olarak gösterilir.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Broker Ağınızı Profesyonelce Yönetin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile broker komisyonları, hakedişler ve lead takibini tek platformdan otomatik yönetin.</p>
                    <Link href={`/${locale}/solutions/ai-broker-matching`} className="inline-flex h-14 items-center px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">
                        AI Broker Eşleştirme Hakkında →
                    </Link>
                </div>
            </section>
        </div>
    )
}
