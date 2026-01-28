
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

const plans = [
    {
        name: "Basic",
        price: "₺2.900",
        period: "/ay",
        description: "Küçük ölçekli projeler ve butik satış ofisleri için.",
        features: [
            "Stok Yönetimi",
            "Müşteri Kartları",
            "Satış İşlemleri",
            "Basit Raporlama",
            "5 Kullanıcıya Kadar"
        ],
        cta: "Başlayın",
        popular: false
    },
    {
        name: "Pro",
        price: "₺5.900",
        period: "/ay",
        description: "Büyüyen ekipler ve aktif satış ofisleri için.",
        features: [
            "Her şey (Basic)",
            "Broker Portalı",
            "Ödeme Planı Sihirbazı",
            "Dijital Sözleşme Yönetimi",
            "Gelişmiş Raporlama",
            "20 Kullanıcıya Kadar"
        ],
        cta: "Ücretsiz Deneyin",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Özel Teklif",
        period: "",
        description: "Çoklu proje ve büyük organizasyonlar için.",
        features: [
            "Her şey (Pro)",
            "Mobil Uygulama (iOS/Android)",
            "API Erişimi",
            "ERP Entegrasyonları",
            "Özel Sunucu (On-Premise)",
            "Sınırsız Kullanıcı"
        ],
        cta: "İletişime Geçin",
        popular: false
    }
]

export function PricingSection() {
    return (
        <section className="py-32 bg-slate-950 relative" id="pricing">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950 to-slate-950" />

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                        Şeffaf Fiyatlandırma
                    </h2>
                    <p className="text-lg text-slate-400">
                        Gizli maliyet yok. İhtiyacınıza uygun paketi seçin, hemen başlayın.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300
                                ${plan.popular
                                    ? 'bg-slate-900/80 border-blue-500 shadow-2xl shadow-blue-500/10 scale-105 z-10'
                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                                    En Popüler
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                                <p className="text-sm text-slate-400 mb-6">{plan.description}</p>
                                <div className="flex items-baseline">
                                    <span className={`text-4xl font-bold ${plan.popular ? 'text-blue-400' : 'text-white'}`}>{plan.price}</span>
                                    <span className="text-slate-500 ml-1">{plan.period}</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 w-full mb-8" />

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, j) => (
                                    <li key={j} className="flex items-center gap-3 text-slate-300">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${plan.popular ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                                            <Check size={12} />
                                        </div>
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <LeadCaptureModal
                                title={`${plan.name} Paketi Bilgi Formu`}
                                description={`${plan.name} paketi hakkında detaylı bilgi ve demo için lütfen bilgilerinizi bırakın.`}
                                resourceName={`Pricing_${plan.name}_Request`}
                            >
                                <Button
                                    size="lg"
                                    variant={plan.popular ? 'default' : 'outline'}
                                    className={`w-full rounded-xl h-12 font-semibold transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-none shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]'
                                            : 'bg-transparent border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600'
                                        }`}
                                >
                                    {plan.cta}
                                </Button>
                            </LeadCaptureModal>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
