import type { Metadata } from "next";
import Image from 'next/image'
import { CheckCircle2, TrendingUp, Users, Shield, Zap, LayoutDashboard, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

export const metadata: Metadata = {
    title: "İnşaat Firmaları için CRM | Proje Satış ve Stok Yönetimi – NovoxCRM",
    description: "İnşaat firmalarına özel CRM yazılımı. Proje bazlı satış takibi, daire envanteri ve ödeme planı NovoxCRM'de.",
};

export default function InsaatCRMPage() {
    return (
        <div className="bg-slate-950 min-h-screen pt-24 pb-20">
            <section className="container mx-auto px-4 py-16 text-center">
                <div className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 mb-8">
                    İnşaat Sektörüne Özel Çözüm
                </div>
                <h1 className="text-4xl md:text-7xl font-bold mb-8 text-white tracking-tight leading-tight">
                    İnşaat Firmaları için <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                        Uçtan Uca Satış CRM
                    </span>
                </h1>
                <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
                    İnşaat projelerinde satış süreçleri, klasik CRM sistemleriyle yönetilemeyecek kadar karmaşıktır. NovoxCRM, inşaat firmalarının proje satışlarını tek panelden yönetmesini sağlar.
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                    <LeadCaptureModal
                        title="İnşaat CRM Demo"
                        description="Projenizin satışlarını nasıl dijitalleştirebileceğimizi konuşalım."
                        resourceName="InsaatCRM_Hero_Demo"
                    >
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-8 text-lg rounded-full">
                            Detaylı Bilgi Alın
                        </Button>
                    </LeadCaptureModal>
                </div>
            </section>

            <section className="py-24 border-t border-slate-900 relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">İnşaat CRM Neden Gereklidir?</h2>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="flex gap-4 p-6 rounded-3xl bg-slate-900/50 border border-slate-800">
                                <LayoutDashboard className="text-emerald-500 shrink-0" size={32} />
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Proje Bazlı Satış ve Stok</h3>
                                    <p className="text-slate-400">Daire bazlı stok durumu, satıldı/opsiyonlu ayrımı ve interaktif lejant yönetimi.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-6 rounded-3xl bg-slate-900/50 border border-slate-800">
                                <Database className="text-blue-500 shrink-0" size={32} />
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Daire Envanteri Yönetimi</h3>
                                    <p className="text-slate-400">Brüt/net metrekare, yön, kat ve teknik özelliklerin daire bazlı dijital kaydı.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-6 rounded-3xl bg-slate-900/50 border border-slate-800">
                                <Shield className="text-purple-500 shrink-0" size={32} />
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Ödeme Planı Takibi</h3>
                                    <p className="text-slate-400">Peşinat, ara ödeme ve taksitlerin proje bazlı otomatik hesaplanması ve takibi.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                            <h3 className="text-2xl font-bold text-white mb-6">Satış Ofisi & Broker Entegrasyonu</h3>
                            <p className="text-slate-400 mb-6 italic">
                                "Broker ağları ile çalışan inşaat firmaları için özel geliştirilen broker portalı sayesinde, yetkilendirme ve satış takibi güvenli şekilde yapılır."
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Acente bazlı yetkilendirme",
                                    "Gerçek zamanlı fiyat listesi paylaşımı",
                                    "Lead koruma ve müşteri çakışma önleme",
                                    "Hakediş ve komisyon raporlaması"
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

            <section className="py-24 bg-slate-950/50 border-t border-slate-900 text-center">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-12">İnşaat Satışlarınızı Dijitalleştirin</h2>
                    <div className="max-w-4xl mx-auto p-12 rounded-[40px] bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/20">
                        <p className="text-xl text-slate-400 mb-8">
                            Excel listelerinden kurtulun, tüm projelerinizi tek bir akıllı platform üzerinden yönetin.
                        </p>
                        <LeadCaptureModal
                            title="Şimdi Başlayın"
                            description="İnşaat CRM çözümümüzü incelemek için bir demo randevusu alın."
                            resourceName="InsaatCRM_Bottom_CTA"
                        >
                            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white h-14 px-10 rounded-full font-bold">
                                ŞİMDİ DEMO ALIN
                            </Button>
                        </LeadCaptureModal>
                    </div>
                </div>
            </section>
        </div>
    )
}
