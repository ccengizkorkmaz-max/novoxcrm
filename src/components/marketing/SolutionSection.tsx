import { CheckCircle2, LayoutDashboard, Calculator, PieChart, Users2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const solutions = [
    {
        icon: Users2,
        title: "CRM & Satış Yönetimi",
        features: [
            "Tüm müşteri görüşmeleri tek ekranda",
            "Otomatik hatırlatmalar ve takip",
            "Satış ofisi performans ölçümü",
            "Call-center entegrasyonu"
        ]
    },
    {
        icon: Users2,
        title: "Broker Portalı",
        features: [
            "Brokerlar için özel mobil uyumlu panel",
            "Anlık stok ve fiyat listesi paylaşımı",
            "Otomatik komisyon hakediş hesaplama",
            "Dublicate müşteri koruması"
        ]
    },
    {
        icon: Calculator,
        title: "Finans & Ödeme Planı",
        features: [
            "Esnek ödeme planı oluşturucu",
            "Senet, ara ödeme takibi",
            "Gecikmiş tahsilat uyarıları",
            "Dövizli satış desteği"
        ]
    },
    {
        icon: PieChart,
        title: "Gelişmiş Raporlama",
        features: [
            "Dönemsel satış hızı analizleri",
            "Stok yaşlandırma raporları",
            "Gelir projeksiyonu",
            "Pazarlama ROI analizi"
        ]
    }
]

export function SolutionSection() {
    return (
        <section className="py-24 bg-slate-950 relative" id="solutions">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Left Content */}
                    <div>
                        <div className="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm font-medium text-green-300 mb-6">
                            ✨ Bütünleşik Mimari
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
                            Parça Parça Değil, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                                Tam Entegre Çözüm
                            </span>
                        </h2>
                        <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                            İnşaat ve gayrimenkul satışlarının kendine has dinamikleri vardır. NovoxCRM, lead aşamasından tapu teslimine kadar tüm süreci tek platformda çözer.
                        </p>

                        <div className="mb-12">
                            <Button className="bg-green-600 hover:bg-green-700 text-white rounded-full px-8 h-12 shadow-lg shadow-green-900/20" asChild>
                                <Link href="/solutions">DETAYLI BİLGİ İÇİN TIKLAYIN</Link>
                            </Button>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {solutions.map((solution, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-colors">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-green-400 mb-4">
                                        <solution.icon size={20} />
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{solution.title}</h3>
                                    <div className="space-y-2">
                                        {solution.features.slice(0, 2).map((feat, j) => (
                                            <div key={j} className="flex items-center text-sm text-slate-500">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2" />
                                                {feat}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Visual (Abstract Representation) */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl rounded-full opacity-30" />
                        <div className="relative bg-slate-900 rounded-3xl border border-slate-800 p-2 shadow-2xl">
                            <div className="aspect-square rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative">
                                {/* Abstract connection lines */}
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative w-48 h-48">
                                        {/* Center Hub */}
                                        <div className="absolute inset-0 m-auto w-20 h-20 bg-green-500/20 rounded-full animate-pulse blur-xl"></div>
                                        <div className="absolute inset-0 m-auto w-16 h-16 bg-slate-900 border border-green-500/50 rounded-full flex items-center justify-center z-10 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                            <Database className="text-green-400" />
                                        </div>

                                        {/* Satellites */}
                                        {[0, 90, 180, 270].map((deg, i) => (
                                            <div key={i} className="absolute w-12 h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400"
                                                style={{
                                                    top: '50%', left: '50%',
                                                    transform: `translate(-50%, -50%) rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`
                                                }}>
                                                {[<Users2 key={0} size={18} />, <Calculator key={1} size={18} />, <PieChart key={2} size={18} />, <LayoutDashboard key={3} size={18} />][i]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
