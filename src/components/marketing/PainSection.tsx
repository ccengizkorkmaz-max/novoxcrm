
import { AlertCircle, Users, Database, FileText } from 'lucide-react'

const problems = [
    {
        icon: AlertCircle,
        title: "Satış Olay ama Takip Yok",
        desc: "Proje satışlarında her müşteri kaybı maliyetlidir. Excel ile yönetilen satış süreçleri pipeline’ı körleştirir.",
        color: "text-red-400 not-bg"
    },
    {
        icon: Users,
        title: "Brokerlar Yönetilemiyor",
        desc: "Broker müşteri sahipliği, komisyon hakediş ve ödeme süreçleri manuel yürütülüyor. Çatışma ve kayıp kaçınılmaz.",
        color: "text-orange-400 not-bg"
    },
    {
        icon: Database,
        title: "Aynı Data 3 Kez Giriliyor",
        desc: "Satış ofisi, muhasebe, pazarlama ve yönetim birbirinden kopuk. Veri tutarsızlığı karar almayı engelliyor.",
        color: "text-purple-400 not-bg"
    },
    {
        icon: FileText,
        title: "Müşteri Teslim Karmaşası",
        desc: "Ödeme planı, evrak, tapu, teslim, snag list süreçleri dijital değil. Müşteri memnuniyeti düşüyor.",
        color: "text-blue-400 not-bg"
    }
]

export function PainSection() {
    return (
        <section className="py-24 bg-slate-950 relative overflow-hidden" id="why-novox">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

            <div className="container relative z-10 mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                        Neden <span className="text-blue-500">NovoxCRM?</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Geleneksel yöntemlerin yarattığı kronik sorunları çözüyor, büyümenin önündeki engelleri kaldırıyoruz.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {problems.map((item, i) => (
                        <div key={i} className="group relative p-8 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1">
                            {/* Hover Gradient */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 ${item.color}`}>
                                    <item.icon size={28} />
                                </div>
                                <h3 className="font-bold text-xl mb-4 text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
