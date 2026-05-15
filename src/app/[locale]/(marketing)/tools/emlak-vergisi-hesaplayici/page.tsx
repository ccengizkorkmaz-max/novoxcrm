import { Metadata } from "next"
import EmlakVergisiClient from "./EmlakVergisiClient"

export const metadata: Metadata = {
    title: "Emlak Vergisi Hesaplama 2026 | Ücretsiz Hesaplayıcı",
    description: "2026 güncel vergi dilimleriyle emlak vergisi hesaplama aracı. Konut, işyeri ve arsa vergisini büyükşehir ve diğer iller için hesaplayın.",
    alternates: { canonical: "/tools/emlak-vergisi-hesaplayici" },
}

export default function EmlakVergisiHesaplayiciPage() {
    return (
        <main className="min-h-screen bg-slate-950 py-20 md:py-32 px-4">
            <div className="text-center mb-16">
                <span className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
                    ÜCRETSİZ ARAÇ
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                    Emlak Vergisi <span className="text-emerald-400">Hesaplayıcı</span>
                </h1>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                    2026 yılı güncel vergi dilimleriyle konut, işyeri ve arsa emlak vergisini anında hesaplayın.
                </p>
            </div>
            <EmlakVergisiClient />
        </main>
    )
}
