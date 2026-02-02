import Image from 'next/image'
import { CheckCircle2, TrendingUp, Users, Shield, Zap, Globe, ArrowRight, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { CRMLifecycle } from '@/components/marketing/CRMLifecycle'

export default function SolutionsPage() {
    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            {/* Executive Hero */}
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-8">
                    Gayrimenkul CEO'ları İçin Stratejik Çözümler
                </div>
                <h1 className="text-4xl md:text-7xl font-bold mb-8 text-white tracking-tight leading-tight">
                    Proje Satışlarında <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Tam Saha Hakimiyet
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    NovoxCRM, sadece bir veri kayıt sistemi değildir. Satış ofisinizden bağımsız broker ağınıza, pazarlama bütçenizden finansal nakit akışınıza kadar tüm ekosistemi yöneten stratejik bir yönetim panelidir.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    <LeadCaptureModal
                        title="Ücretsiz Tanıtım ve Demo"
                        description="Satışlarınızı nasıl artırabileceğimizi göstermek için bir uzmanımız sizinle iletişime geçecek."
                        resourceName="SolutionsPage_Hero_Demo"
                    >
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg rounded-full">
                            Ücretsiz Tanıtım İsteyin
                        </Button>
                    </LeadCaptureModal>
                    <Button size="lg" className="bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 h-14 px-8 text-lg rounded-full" asChild>
                        <Link href="/system-details">Sistem Detaylarını İnceleyin</Link>
                    </Button>
                </div>
            </section>

            {/* Core Value Pillars */}
            <section id="core-modules" className="py-24 border-t border-slate-900 relative">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                            <TrendingUp className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Maksimum Satış Hızı</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Leadlerin saniyeler içinde doğru danışmana atanması ve yapay zeka destekli takip hatırlatmaları ile satış dönüşüm oranlarınızı %40 artırın.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all group">
                            <Shield className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Şeffaf Nakit Akışı</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Senetler, ara ödemeler ve gecikmiş tahsilatlar... Finansal tabloyu Excel karmaşasından kurtarıp anlık, reel verilere dönüştürün.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all group">
                            <Users className="text-purple-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Broker Ekosistemi</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Dış acenteleri sisteminize güvenle dahil edin. Karmaşık hakediş süreçlerini otomatiğe bağlayın ve stok güvenliğini sağlayın.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Detailed Feature Breakdown */}
            <section className="py-24 bg-slate-950/50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Detaylı Fonksiyonel Kapasite</h2>
                        <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6">
                                <Globe size={16} /> B2B BROKER BULUTU
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-6 leading-tight">Dış Satış Ağınızı Tek Merkezden Yönetin</h3>
                            <p className="text-lg text-slate-400 mb-8">
                                Proje satışlarının %60'ından fazlası dış brokerlar üzerinden döner. NovoxCRM ile broker ağınızı kontrol altına alın.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Broker Başvuru & Onay Portali",
                                    "Özelleştirilebilir Broker Lead Formları",
                                    "Anlık Stok ve Fiyat Listesi Paylaşımı",
                                    "Brokerlara Özel Pazarlama Materyalleri (PDF, Katalog)",
                                    "Otomatik Komisyon ve Hakediş Hesaplama Motoru"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                                <Image
                                    src="/images/broker-portal-final.png"
                                    alt="Novox Broker Portal"
                                    fill
                                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100 transition-transform"
                                />
                                <div className="absolute top-4 left-4 p-2 bg-blue-600 rounded-lg text-xs font-bold text-white z-10">BROKER PANELİ v2.4</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-16 items-center flex-row-reverse">
                        <div className="order-2 md:order-1 bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="aspect-video bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                                <Image
                                    src="/images/operational-speed-final.png"
                                    alt="Novox Operational Dashboard"
                                    fill
                                    className="object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 scale-105 group-hover:scale-100 transition-transform"
                                />
                                <div className="absolute top-4 left-4 p-2 bg-emerald-600 rounded-lg text-xs font-bold text-white z-10">SPEED ENGINE v3.0</div>
                            </div>
                        </div>
                        <div className="order-1 md:order-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold mb-6">
                                <Zap size={16} /> OPERASYONEL HIZ
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-6 leading-tight">Yüksek Trafikli Satış Ofisleri İçin Hızlı Çözümler</h3>
                            <p className="text-lg text-slate-400 mb-8">
                                Lansman dönemlerinde saniyelerin önemi vardır. NovoxCRM operasyonun her aşamasını hızlandırır.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Hızlı Lead Giriş Ekranı (Ajans & Çağrı Merkezi İçin)",
                                    "WhatsApp Entegrasyonu: Tek tıkla konuşma başlatma ve kayıt",
                                    "Ödeme Planı Sihirbazı: Saniyeler içinde ödeme planı kurgulama",
                                    "Dijital Sözleşme Yönetimi: Form doldurur gibi sözleşme hazırlama",
                                    "Satış Sonrası Müşteri Portali: Ödeme takibi ve tapu süreci"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <CRMLifecycle />

            {/* B2B Broker Process Section */}
            <section className="py-24 border-t border-slate-900 bg-slate-950/40 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold mb-6">
                            BROKER AĞI YÖNETİMİ
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">B2B Broker İş Modeli Döngüsü</h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Dış broker ve acentelerinizi sisteminize güvenle entegre edin, satış gücünüzü projenizin sınırlarının ötesine taşıyın.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-16 items-center flex-row-reverse">
                        <div className="order-2 lg:order-1 space-y-4">
                            {[
                                { title: "Başvuru", desc: "Brokerın sisteme kayıt olması ve kurumsal belgelerini iletmesi." },
                                { title: "Onay & Yetki", desc: "Satış ofisinin brokerı doğrulaması ve sisteme giriş yetkisi vermesi." },
                                { title: "Portal Erişimi", desc: "Brokerın güncel stok, fiyat ve pazarlama dokümanlarına erişmesi." },
                                { title: "Lead Gönderimi", desc: "Brokerın kendi müşterisini (potansiyel alıcı) sisteme kaydetmesi." },
                                { title: "Şeffaf Takip", desc: "Brokerın gönderdiği lejantın hangi aşamada olduğunu anlık izlemesi." },
                                { title: "Satış & Hakediş", desc: "Satış kapandığında komisyonun otomatik hesaplanıp onaylanması." }
                            ].map((step, idx) => (
                                <div key={idx} className="flex items-center gap-4 group">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 font-bold text-sm group-hover:bg-purple-600 group-hover:text-white group-hover:border-purple-500 transition-all">
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-purple-500/30 hover:bg-slate-800/40 transition-all">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-bold text-white">{step.title}</h4>
                                            {idx < 5 && <ArrowRight className="h-3 w-3 text-slate-600" />}
                                        </div>
                                        <p className="text-sm text-slate-400">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="order-1 lg:order-2 relative aspect-square">
                            <Image
                                src="/images/b2b-broker-cycle.png"
                                alt="B2B Broker İş Modeli Döngüsü"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Module Mapping Preview */}
            <section className="py-24 bg-slate-950/40">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-12">Bütünleşik Ekosistem</h2>
                    <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto opacity-60">
                        {["Müşteri Yönetimi", "Stok Kontrol", "Broker Portali", "Ödeme Sihirbazı", "Dijital Sözleşme", "Finans & Tahsilat", "Raporlama & BI"].map((mod, i) => (
                            <span key={i} className="px-4 py-2 rounded-full border border-slate-800 text-sm text-slate-400">{mod}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTO / CEO Perspective Table */}
            <section className="py-24 border-t border-slate-900">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Teknik & Stratejik Avantajlar</h2>
                        <p className="text-slate-500 italic">Yönetim Kurulu Sunumunuz İçin Hazır Veriler</p>
                    </div>

                    <div className="max-w-4xl mx-auto overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 backdrop-blur-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-900/80">
                                    <th className="p-6 text-white font-bold border-b border-slate-800">Kriter</th>
                                    <th className="p-6 text-white font-bold border-b border-slate-800">Geleneksel Yazılım</th>
                                    <th className="p-6 text-blue-400 font-bold border-b border-slate-800">NovoxCRM</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                    <td className="p-6 text-slate-300 font-medium">Veri Güvenliği</td>
                                    <td className="p-6 text-slate-500">Lokal Sunucu / Manuel Yedek</td>
                                    <td className="p-6 text-emerald-400">Bulut Tabanlı / 256-bit SSL / Otomatik Yedek</td>
                                </tr>
                                <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                    <td className="p-6 text-slate-300 font-medium">Mobilite</td>
                                    <td className="p-6 text-slate-500">Sadece Ofis Bilgisayarı</td>
                                    <td className="p-6 text-emerald-400">Tam Mobil Uyumlu (Telefon, Tablet, Web)</td>
                                </tr>
                                <tr className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                                    <td className="p-6 text-slate-300 font-medium">Entegrasyon</td>
                                    <td className="p-6 text-slate-500">Kapalı Devre</td>
                                    <td className="p-6 text-emerald-400">WhatsApp, Mail, SMS, ERP API Desteği</td>
                                </tr>
                                <tr className="hover:bg-slate-800/20 transition-colors">
                                    <td className="p-6 text-slate-300 font-medium">Kullanım Kolaylığı</td>
                                    <td className="p-6 text-slate-500">Karmaşık / Eğitim Şart</td>
                                    <td className="p-6 text-emerald-400">Modern UX / 1 Saatte Adaptasyon</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 container mx-auto px-4">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
                        Şimdi Dijital Dönüşümü Başlatın
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto relative z-10">
                        Ücretsiz demo talep edin ve projenize özel çözüm haritasını beraber çıkaralım.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <LeadCaptureModal
                            title="Demo Randevusu Oluşturun"
                            description="Projenize özel demo sunumu için uygun olduğunuz zamanı planlayalım."
                            resourceName="SolutionsPage_Bottom_Demo"
                        >
                            <Button size="lg" className="bg-white text-blue-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                                DEMO RANDEVUSU ALIN
                            </Button>
                        </LeadCaptureModal>
                        <Button size="lg" variant="link" className="text-white h-14 px-8" asChild>
                            <Link href="/">Anasayfaya Dön</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
