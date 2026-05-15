import { Metadata } from "next"
import SerefiyeClient from "./SerefiyeClient"

export const metadata: Metadata = {
    title: "Şerefiye Hesaplama 2026 | Ücretsiz Kat & Cephe Hesaplayıcı",
    description: "Konut projelerinde daire şerefiye hesaplama aracı. Kat, cephe yönü, manzara ve köşe daire faktörlerine göre fiyat farkını hesaplayın.",
    alternates: { canonical: "/tools/serefiye-hesaplayici" },
}

export default function SerefiyeHesaplayiciPage() {
    return (
        <main className="min-h-screen bg-slate-950 py-20 md:py-32 px-4">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm font-medium mb-6">
                    ÜCRETSİZ ARAÇ
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Şerefiye <span className="text-purple-400">Hesaplayıcı</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    Konut projelerinde daire fiyatını etkileyen kat, cephe, manzara ve konum faktörlerini hesaplayın.
                </p>
            </div>
            <SerefiyeClient />
        </main>
    )
}
