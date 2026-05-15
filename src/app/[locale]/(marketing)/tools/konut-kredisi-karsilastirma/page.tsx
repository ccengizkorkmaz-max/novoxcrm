import { Metadata } from "next"
import KonutKredisiClient from "./KonutKredisiClient"

export const metadata: Metadata = {
    title: "Konut Kredisi Hesaplama & Banka Karşılaştırma 2026 | Ücretsiz",
    description: "10 bankanın güncel konut kredisi faiz oranlarını karşılaştırın. Aylık taksit, toplam faiz ve ödeme tutarını anında hesaplayın.",
    alternates: { canonical: "/tools/konut-kredisi-karsilastirma" },
}

export default function KonutKredisiKarsilastirmaPage() {
    return (
        <main className="min-h-screen bg-slate-950 py-20 md:py-32 px-4">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-medium mb-6">
                    ÜCRETSİZ ARAÇ
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Konut Kredisi <span className="text-amber-400">Karşılaştırma</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    10 bankanın güncel konut kredisi faiz oranlarını karşılaştırın, en uygun krediyi bulun.
                </p>
            </div>
            <KonutKredisiClient />
        </main>
    )
}
