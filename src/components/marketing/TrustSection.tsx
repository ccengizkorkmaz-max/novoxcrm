
import { Building2, Users, Wallet, Trophy } from 'lucide-react'

const stats = [
    {
        icon: Wallet,
        value: "10 Milyar ₺+",
        label: "Yönetilen Portföy",
        color: "text-blue-400"
    },
    {
        icon: Building2,
        value: "50+",
        label: "Aktif Proje",
        color: "text-indigo-400"
    },
    {
        icon: Users,
        value: "1.000+",
        label: "Emlak Profesyoneli",
        color: "text-purple-400"
    },
    {
        icon: Trophy,
        value: "%98",
        label: "Müşteri Memnuniyeti",
        color: "text-green-400"
    }
]

export function TrustSection() {
    return (
        <section className="py-12 bg-slate-950 border-y border-slate-900 relative z-20">
            <div className="container mx-auto px-4">
                <p className="text-center text-slate-500 text-sm font-medium mb-8 uppercase tracking-widest">
                    Sektörün Öncüleri Tarafından Güvenle Kullanılıyor
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center justify-center text-center group">
                            <div className={`mb-3 transition-transform duration-300 group-hover:scale-110 ${stat.color}`}>
                                <stat.icon size={32} />
                            </div>
                            <div className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Optional: Placeholder for Logos if needed in future */}
                <div className="mt-12 pt-8 border-t border-slate-900 flex justify-center items-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Placeholder text for logo strip visual balance */}
                    <span className="text-xl font-bold font-serif text-slate-400">VIP YAPI</span>
                    <span className="text-xl font-bold font-mono text-slate-400">MODERN İNŞAAT</span>
                    <span className="text-xl font-bold text-slate-400">GOLD PROJE</span>
                    <span className="text-xl font-bold font-sans text-slate-400 hidden md:inline">ELİT GYO</span>
                </div>
            </div>
        </section>
    )
}
