import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import { getCanonicalBaseUrl } from "@/lib/seo-constants"
import TapuHarciClient from "./TapuHarciClient"
import Link from "next/link"

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Tapu Harcı Hesaplama 2026 | Ücretsiz Hesaplayıcı - ${brandName}`,
        description: 'Tapu harcı hesaplama aracı. Gayrimenkul alım-satımında tapu harcı, KDV ve döner sermaye ücretlerini anlık hesaplayın. 2026 güncel oranları.',
        keywords: 'tapu harcı hesaplama, tapu harcı hesaplayıcı, tapu masrafları 2026, gayrimenkul tapu harcı, konut tapu harcı',
        alternates: {
            canonical: locale === 'en' ? `/en/tools/tapu-harci-hesaplayici` : `/tools/tapu-harci-hesaplayici`,
            languages: {
                tr: `/tools/tapu-harci-hesaplayici`,
                en: `/en/tools/tapu-harci-hesaplayici`,
            }
        }
    }
}

export default async function TapuHarciPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    const baseUrl = getCanonicalBaseUrl(host)

    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "Tapu harcı ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Tapu harcı gayrimenkul satış bedelinin %4'üdür. Yasal olarak alıcı ve satıcı arasında eşit paylaşılır (%2 + %2)." } },
            { "@type": "Question", "name": "Tapu harcını kim öder?", "acceptedAnswer": { "@type": "Answer", "text": "Yasal olarak alıcı %2, satıcı %2 öder. Ancak uygulamada oran müzakere edilebilir, çoğu zaman alıcı tamamını üstlenir." } },
            { "@type": "Question", "name": "2026 tapu harcı oranı değişti mi?", "acceptedAnswer": { "@type": "Answer", "text": "2026 yılı itibarıyla tapu harcı oranı %4 olarak devam etmektedir (alıcı %2 + satıcı %2)." } },
            { "@type": "Question", "name": "Tapu döner sermaye ücreti ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "2026 yılında tapu döner sermaye ücreti yaklaşık 2.850 TL civarındadır. Bu ücret her yıl güncellenir." } },
        ]
    }

    const howToSchema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "Tapu Harcı Nasıl Hesaplanır?",
        "step": [
            { "@type": "HowToStep", "name": "Gayrimenkul değerini girin", "text": "Satış bedeli veya rayiç bedelden yüksek olanını yazın." },
            { "@type": "HowToStep", "name": "Paylaşım oranını seçin", "text": "Alıcı-satıcı arasındaki tapu harcı paylaşımını belirleyin." },
            { "@type": "HowToStep", "name": "KDV seçeneklerini işaretleyin", "text": "İlk konut, yabancı uyruklu gibi seçenekleri işaretleyin." },
            { "@type": "HowToStep", "name": "Sonuçları inceleyin", "text": "Tapu harcı, KDV ve döner sermaye dahil toplam maliyeti görün." },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 mb-8">
                    Ücretsiz Araç
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">
                    Tapu Harcı{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                        Hesaplayıcı
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">
                    Gayrimenkul alım-satımında tapu harcı, KDV ve döner sermaye ücretlerini anlık hesaplayın.
                    <span className="text-emerald-400 font-medium"> 2026 güncel oranları</span> ile.
                </p>
            </section>

            <section className="container mx-auto px-4 pb-20">
                <TapuHarciClient />
            </section>

            {/* FAQ */}
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Tapu Harcı Hakkında Sıkça Sorulan Sorular</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Tapu harcı ne kadar?</h3>
                            <p className="text-slate-400">Tapu harcı gayrimenkul satış bedelinin %4&apos;üdür. Yasal olarak alıcı ve satıcı eşit paylaşır.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Tapu harcını kim öder?</h3>
                            <p className="text-slate-400">Yasal olarak her iki taraf %2 öder. Uygulamada oran müzakere edilebilir.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                            <h3 className="font-bold text-white mb-2">Düşük bedel beyan edersem ne olur?</h3>
                            <p className="text-slate-400">Beyanname bedeli emlak vergisi değerinden düşük olamaz. Aksi halde cezai işlem uygulanır.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Konut Satış Süreçlerinizi Dijitalleştirin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile tüm tapu, ödeme ve müşteri süreçlerinizi tek platformdan yönetin.</p>
                    <Link href={`/${locale}/solutions/gayrimenkul-crm`} className="inline-flex h-14 items-center px-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors">
                        CRM Hakkında Bilgi Alın →
                    </Link>
                </div>
            </section>
        </div>
    )
}
