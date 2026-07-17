export const dynamic = "force-dynamic";

import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import MetrekareFiyatClient from "./MetrekareFiyatClient"
import Link from "next/link"

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `m² Birim Fiyat Hesaplayıcı | Metrekare Fiyat Hesaplama - ${brandName}`,
        description: 'Gayrimenkul metrekare birim fiyat hesaplama aracı. Toplam fiyattan m² fiyatını veya m² fiyattan toplam bedeli anlık hesaplayın.',
        keywords: 'metrekare fiyat hesaplama, m2 birim fiyat, gayrimenkul birim fiyat hesaplayıcı, konut metrekare fiyatı',
        alternates: {
            canonical: locale === 'en' ? `/en/tools/metrekare-birim-fiyat` : `/tools/metrekare-birim-fiyat`,
            languages: {
                tr: `/tools/metrekare-birim-fiyat`,
                en: `/en/tools/metrekare-birim-fiyat`,
            }
        }
    }
}

export default async function MetrekareFiyatPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const faqSchema = {
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            { "@type": "Question", "name": "m² birim fiyat nasıl hesaplanır?", "acceptedAnswer": { "@type": "Answer", "text": "m² birim fiyat = Toplam Satış Fiyatı ÷ Brüt veya Net Alan (m²). Örneğin 3.000.000 TL / 100 m² = 30.000 TL/m²." } },
            { "@type": "Question", "name": "Brüt mü net m² mi kullanılmalı?", "acceptedAnswer": { "@type": "Answer", "text": "Karşılaştırma için net m² (kullanım alanı) daha doğrudur. Ancak proje satışlarında genellikle brüt m² kullanılır." } },
        ]
    }

    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-300 mb-8">Ücretsiz Araç</div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">m² Birim Fiyat{" "}<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Hesaplayıcı</span></h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16">Toplam fiyattan m² birim fiyatını veya birim fiyattan toplam bedeli anlık hesaplayın.</p>
            </section>
            <section className="container mx-auto px-4 pb-20"><MetrekareFiyatClient /></section>
            <section className="py-16 border-t border-slate-900">
                <div className="container mx-auto px-4 max-w-3xl">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">m² Birim Fiyat Hakkında SSS</h2>
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">m² birim fiyat neden önemli?</h3><p className="text-slate-400">Farklı büyüklükteki gayrimenkulleri karşılaştırmanın en doğru yolu m² birim fiyattır. Toplam fiyat yanıltıcı olabilir.</p></div>
                        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800"><h3 className="font-bold text-white mb-2">Brüt mü net m² mi kullanılmalı?</h3><p className="text-slate-400">Karşılaştırma için net alan daha doğru sonuç verir. Proje satışlarında genellikle brüt m² kullanılır.</p></div>
                    </div>
                </div>
            </section>
            <section className="py-16 container mx-auto px-4 text-center">
                <div className="p-12 rounded-[40px] bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-500/20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-4">Stok ve Fiyat Yönetimini Otomatikleştirin</h2>
                    <p className="text-slate-400 mb-8">{brandName} ile daire bazlı m² fiyatlarını, şerefiye puanlarını ve stok durumunu tek yerden yönetin.</p>
                    <Link href={`/${locale}/solutions/insaat-crm`} className="inline-flex h-14 items-center px-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors">İnşaat CRM Hakkında →</Link>
                </div>
            </section>
        </div>
    )
}
