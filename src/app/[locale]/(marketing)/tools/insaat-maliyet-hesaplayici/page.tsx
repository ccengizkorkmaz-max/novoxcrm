export const dynamic = "force-dynamic";

import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import InsaatMaliyetClient from "./InsaatMaliyetClient"
import Link from "next/link"

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `İnşaat Maliyet Hesaplayıcı 2026 | Proje Maliyet Tahmini - ${brandName}`,
        description: 'İnşaat maliyet hesaplama aracı. Kaba inşaat, ince işler, mekanik ve çevre düzenleme dahil toplam proje maliyetini hesaplayın. 2026 güncel birim fiyatları.',
        keywords: 'inşaat maliyet hesaplama, inşaat m2 birim fiyat 2026, bina yapım maliyeti, konut inşaat maliyeti hesaplayıcı',
        alternates: {
            canonical: locale === 'en' ? `/en/tools/insaat-maliyet-hesaplayici` : `/tools/insaat-maliyet-hesaplayici`,
            languages: {
                tr: `/tools/insaat-maliyet-hesaplayici`,
                en: `/en/tools/insaat-maliyet-hesaplayici`,
            }
        }
    }
}

export default async function InsaatMaliyetPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "2026 inşaat m² maliyeti ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "2026 yılında standart konut 18.000 TL/m², orta üst segment 28.000 TL/m², lüks segment ise 45.000 TL/m² civarındadır. Bu rakamlar İstanbul baz alınmıştır." } },
            { "@type": "Question", "name": "İnşaat maliyeti neleri kapsar?", "acceptedAnswer": { "@type": "Answer", "text": "Kaba inşaat (%45), ince işler (%30), mekanik-elektrik (%15) ve çevre düzenleme (%10) olarak dağılır. Arsa maliyeti ayrıca eklenir." } },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-medium text-orange-300 mb-8">Ücretsiz Araç</div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">İnşaat Maliyet{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Hesaplayıcı</span></h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">Proje inşaat maliyetinizi kaba inşaat, ince işler ve mekanik dahil hesaplayın. <span className="text-orange-400 font-medium">2026 güncel birim fiyatları</span> ile.</p>
            </section>
            <section className="container mx-auto px-4 pb-20"><InsaatMaliyetClient /></section>
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">İnşaat Maliyeti Hakkında SSS</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">2026 inşaat m² maliyeti ne kadar?</h3><p className="text-slate-400">Standart 18.000 TL/m², orta üst 28.000 TL/m², lüks 45.000 TL/m² civarında. Bölge ve projeye göre değişir.</p></div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Kaba inşaat maliyetin yüzde kaçı?</h3><p className="text-slate-400">Kaba inşaat (hafriyat, beton, kalıp, demir) toplam inşaat maliyetinin yaklaşık %45&apos;ini oluşturur.</p></div>
                    </div>
                </div>
            </section>
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-orange-900/20 to-slate-900 border border-orange-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Proje Satışlarınızı Dijitalleştirin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile proje stok takibi, ödeme planı ve satış süreçlerinizi tek platformdan yönetin.</p>
                    <Link href={`/${locale}/solutions/insaat-crm`} className="inline-flex h-14 items-center px-10 rounded-full bg-orange-600 hover:bg-orange-700 text-white font-bold transition-colors">İnşaat CRM Hakkında →</Link>
                </div>
            </section>
        </div>
    )
}
