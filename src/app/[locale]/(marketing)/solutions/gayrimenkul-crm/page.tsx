import type { Metadata } from "next";
import Image from 'next/image'
import { CheckCircle2, TrendingUp, Users, Shield, Zap, Globe, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

export const metadata: Metadata = {
    title: "Gayrimenkul CRM Yazılımı | Konut Projeleri için Satış Takibi – NovoxCRM",
    description: "Gayrimenkul firmaları için özel CRM çözümü. Konut projelerinde müşteri, stok ve broker yönetimini NovoxCRM ile dijitalleştirin.",
};

export default function GayrimenkulCRMPage() {
    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-8">
                    Gayrimenkul Firmaları için Özel Çözüm
                </div>
                <h1 className="text-4xl md:text-7xl font-bold mb-8 text-white tracking-tight leading-tight">
                    Gayrimenkul Firmaları için <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                        Modern CRM Yazılımı
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    Gayrimenkul CRM, konut projeleri üreten ve satan firmaların müşteri, satış ve stok süreçlerini tek merkezden yönetmesini sağlayan yazılım çözümleridir.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    <LeadCaptureModal
                        title="Ücretsiz Tanıtım ve Demo"
                        description="Satışlarınızı nasıl artırabileceğimizi göstermek için bir uzmanımız sizinle iletişime geçecek."
                        resourceName="GayrimenkulCRM_Hero_Demo"
                    >
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-8 text-lg rounded-full">
                            Hemen Başlayın
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            <section className="py-24 border-t border-slate-900 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Neden NovoxCRM?</h2>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-blue-500/30 transition-all group">
                            <TrendingUp className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Proje Bazlı Takip</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Her proje için ayrı stok, fiyat ve satış süreci tanımlayın. Karmaşayı ortadan kaldırın.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all group">
                            <Zap className="text-emerald-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Anlık Stok Durumu</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Dairelerin satıldı, opsiyonlu veya rezerve durumlarını anlık olarak tüm ekibinizle paylaşın.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 transition-all group">
                            <Users className="text-purple-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                            <h3 className="text-2xl font-bold text-white mb-4">Broker Yönetimi</h3>
                            <p className="text-slate-400 leading-relaxed">
                                Dış acenteleri güvenle sisteme dahil edin, komisyon ve satış süreçlerini otomatikleştirin.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-24 bg-slate-950/50 border-t border-slate-900">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-12 text-center">Konut Projeleri için CRM Avantajları</h2>
                        <ul className="grid md:grid-cols-2 gap-8">
                            {[
                                "Proje bazlı müşteri takibi ve segmentasyonu",
                                "Daire & stok durumunun interaktif lejant üzerinden takibi",
                                "Satış temsilcisi ve broker performans analizi",
                                "Ödeme planı ve sözleşme süreçlerinin dijitalleşmesi",
                                "Finansal nakit akışının anlık raporlanması",
                                "Mobil uyumlu yapısıyla sahadan erişim"
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800">
                                    <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-1" />
                                    <span className="text-slate-300">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="py-24 container mx-auto px-4 text-center">
                <div className="p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Gayrimenkul Satışlarını Artırmaya Hazır Mısınız?</h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        NovoxCRM ile tanışın, projelerinizi dijital dünyada daha verimli yönetin.
                    </p>
                    <div className="flex justify-center gap-6">
                        <LeadCaptureModal
                            title="Ücretsiz Demo İsteyin"
                            description="Gayrimenkul CRM çözümlerimizi size özel bir sunumla anlatalım."
                            resourceName="GayrimenkulCRM_Bottom_CTA"
                        >
                            <Button size="lg" className="bg-white text-blue-900 hover:bg-slate-100 h-14 px-10 rounded-full font-bold">
                                DEMO ALIN
                            </Button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </section>
        </div>
    )
}
