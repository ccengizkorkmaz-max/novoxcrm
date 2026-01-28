"use client"
import { Shield, Zap, Database, Globe, CheckCircle2, ArrowLeft, Cpu, Lock, Layers, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

export default function SystemDetailsPage() {
    return (
        <div className="bg-slate-950 min-h-screen text-slate-200">
            <div className="pt-32 pb-24">
                {/* Hero Section */}
                <section className="container mx-auto px-4 mb-24 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6 uppercase tracking-wider">
                        Enterprise Infrastructure
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tight">
                        Novox <span className="text-blue-500">Architecture</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        En zorlu kurumsal gereksinimler ve yüksek trafikli operasyonlar için tasarlanmış, esnek ve güvenli teknoloji ekosistemi.
                    </p>
                </section>

                <div className="container mx-auto px-4">
                    {/* Deployment Options - On-Prem Highlight */}
                    <div className="grid lg:grid-cols-2 gap-12 mb-24">
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                <Server className="text-blue-500" /> Dağıtım ve Kurulum Esnekliği
                            </h2>
                            <p className="text-slate-400 text-lg">
                                Veri gizliliği ve güvenlik politikalarınıza en uygun yöntemi seçin. NovoxCRM, hibrit çalışma modellerine tam uyumludur.
                            </p>

                            <div className="space-y-4">
                                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-colors group">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
                                            <Globe size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">Novox Secure Cloud</h3>
                                            <p className="text-blue-400/60 text-sm">Managed SaaS Solution</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-400">
                                        Bakım ve güncelleme gerektirmeyen, global standartlarda (GDPR/KVKK) şifrelenmiş, hazır bulut altyapısı.
                                    </p>
                                </div>

                                <div className="p-8 rounded-3xl bg-blue-600/5 border border-blue-500/30 hover:border-blue-500 transition-colors group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <span className="bg-blue-600 text-[10px] font-black px-2 py-1 rounded text-white tracking-widest">ENTERPRISE</span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 rounded-2xl bg-blue-600 text-white">
                                            <Database size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">On-Premise (Yerinde Kurulum)</h3>
                                            <p className="text-blue-300/60 text-sm">Self-Hosted Infrastructure</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-300">
                                        Verilerinizin <strong>%100 kontrolü</strong> sizde olsun. Kendi yerel veri merkezinizde (Local Datacenter) izolasyonlu kurulum desteği.
                                    </p>
                                    <ul className="mt-6 space-y-3">
                                        {['Hava Geçirmeyen (Air-Gapped) Ortam Desteği', 'Özel VPN & Firewall Konfigürasyonu', 'Yıllık Bakım & Yerinde Destek Paketi'].map((t, i) => (
                                            <li key={i} className="flex items-center gap-2 text-sm text-blue-300">
                                                <CheckCircle2 size={16} /> {t}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Technical Specs Card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
                            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-[40px] p-8 md:p-12 h-full">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 font-black">
                                        <Cpu />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white">Teknik Kapasite</h2>
                                </div>

                                <div className="grid gap-6">
                                    {[
                                        { icon: Lock, title: "Güvenlik", desc: "256-bit AES veri şifreleme ve gelişmiş IAM (Identity Access Management) katmanları.", label: "Military Grade" },
                                        { icon: Zap, title: "Performans", desc: "Mikro-servis mimarisi ile lise (sub-second) tepki süreleri ve eş zamanlı binlerce kullanıcı desteği.", label: "Ultra Low Latency" },
                                        { icon: Layers, title: "Modülerlik", desc: "Eklenebilir/Çıkarılabilir modül yapısı ile projenize özel fonksiyonel genişletilebilirlik.", label: "Fully Decoupled" },
                                        { icon: Globe, title: "API Ekosistemi", desc: "ERP, Muhasebe ve Pazarlama araçlarınızla tam entegrasyon için hazır RESTful API altyapısı.", label: "Seamless Integration" }
                                    ].map((spec, i) => (
                                        <div key={i} className="flex gap-6 p-6 rounded-2xl bg-slate-950/50 border border-slate-800 hover:bg-slate-950 transition-colors">
                                            <div className="text-emerald-500 shrink-0">
                                                <spec.icon size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-white">{spec.title}</h4>
                                                    <span className="text-[10px] text-emerald-500 font-black bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{spec.label}</span>
                                                </div>
                                                <p className="text-sm text-slate-400 leading-relaxed">{spec.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Integrated System Map */}
                    <section className="mb-24">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold text-white mb-4">Bütünleşik Modül Haritası</h2>
                            <p className="text-slate-400">Tek bir merkezden yönetilen, birbirine tam entegre sistem organları.</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { title: "Müşteri Portföyü", cat: "Core CRM" },
                                { title: "Stok Yönetimi", cat: "Inventory" },
                                { title: "Broker Paneli", cat: "B2B Cloud" },
                                { title: "Satış Ofisi", cat: "Operations" },
                                { title: "Finans & Tahsilat", cat: "Accounts" },
                                { title: "Ödeme Sihirbazı", cat: "Logic Engine" },
                                { title: "Dijital Sözleşme Yönetimi", cat: "Legal Tech" },
                                { title: "Analitik & BI", cat: "Intelligence" },
                                { title: "Saha Yönetimi", cat: "Mobile" },
                                { title: "Aktif Arşiv", cat: "Storage" },
                                { title: "Müşteri Portali", cat: "B2C Experience" },
                                { title: "API Merkezi", cat: "Integration" }
                            ].map((mod, i) => (
                                <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group">
                                    <p className="text-[10px] text-blue-500 font-black uppercase mb-2 tracking-widest">{mod.cat}</p>
                                    <h4 className="text-white font-bold">{mod.title}</h4>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Final CTA for Technical Demo */}
                    <div className="max-w-4xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 text-center relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 relative z-10">Teknik Sunum İsteyin</h2>
                        <p className="text-blue-100 mb-10 text-lg relative z-10">
                            Sistem mimarimizi, entegrasyon kapasitemizi ve güvenlik protokollerimizi IT ekibinize detaylıca sunalım.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 relative z-10">
                            <LeadCaptureModal
                                title="Teknik Demo Randevusu"
                                description="Sistem mimarimiz ve entegrasyon süreçlerimiz hakkında detaylı bilgi almak için randevu oluşturun."
                                resourceName="SystemDetails_TechnicalDemo"
                            >
                                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 px-8 font-black rounded-full h-14">
                                    TEKNİK DEMO RANDEVUSU AL
                                </Button>
                            </LeadCaptureModal>
                            <Button size="lg" className="bg-white/10 border border-white/30 text-white hover:bg-white/20 px-8 rounded-full h-14" asChild>
                                <Link href="/solutions">Çözümlere Geri Dön</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
