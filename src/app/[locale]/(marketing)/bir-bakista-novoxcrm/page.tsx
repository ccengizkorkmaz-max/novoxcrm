'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Building2, Download, ArrowLeft, CheckCircle2, Shield, Zap, LayoutDashboard, Calculator, Users2, PieChart } from 'lucide-react'

export default function GuidePage() {
    const t = useTranslations('Guide')
    const ts = useTranslations('SolutionSection')

    const sections = [
        {
            title: "1. Yönetici Özeti: \"Bütünleşik Mimari\"",
            content: "Novo CRM sadece bir CRM değildir; inşaat ve gayrimenkul sektörleri için özel olarak tasarlanmış bir Proje Odaklı Satış ve Stok İşletim Sistemidir.",
            points: [
                "Temel Sorun: Dağınık Excel dosyaları ve veri adacıkları.",
                "Novo Çözümü: Lead'den Tapu teslimine kadar tek veri kaynağı."
            ],
            icon: Shield
        },
        {
            title: "2. Uçtan Uca Satış Döngüsü",
            content: "Gerçek dünyadaki gayrimenkul satış yolculuğunun her adımını dijitalleştiriyoruz.",
            points: [
                "Kontak & Aday Yönetimi",
                "Fizibilite & Teklif Hazırlama",
                "Rezervasyon & Opsiyon Takibi",
                "Sözleşme & Tahsilat Yönetimi"
            ],
            icon: Zap
        },
        {
            title: "3. Akıllı Stok Yönetimi",
            content: "Sadece Satıldı/Satılık bilgisinden fazlasını, tüm teknik detaylarla takip edin.",
            points: [
                "Kat, Cephe ve Manzara detayları",
                "Toplu ünite oluşturma araçları",
                "Gerçek zamanlı doluluk grafikleri"
            ],
            icon: LayoutDashboard
        }
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-300 selection:bg-blue-500/30">
            {/* Header / Nav (Hidden on print) */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-4 print:hidden">
                <div className="container mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white font-bold text-xl">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        Novo CRM
                    </Link>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white">
                            <Link href="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('backToHome')}
                            </Link>
                        </Button>
                        <Button size="sm" onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <Download className="mr-2 h-4 w-4" />
                            {t('downloadPDF')}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 md:py-24">
                {/* Hero Section */}
                <div className="text-center mb-20 print:mb-12">
                    <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-300 mb-6">
                        ✨ {t('badge')}
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        {t('title')}
                    </h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                        {t('description')}
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-2 gap-8 print:grid-cols-1">
                    {sections.map((section, idx) => (
                        <div key={idx} className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[60px] rounded-full group-hover:bg-blue-600/10 transition-colors" />

                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                                    <section.icon size={24} />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                                <p className="text-slate-400 mb-6 leading-relaxed">
                                    {section.content}
                                </p>
                                <ul className="space-y-3">
                                    {section.points.map((point, pIdx) => (
                                        <li key={pIdx} className="flex items-start gap-3">
                                            <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                            <span className="text-sm">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}

                    {/* Comparison Table / Summary */}
                    <div className="md:col-span-2 p-8 rounded-3xl bg-blue-600/5 border border-blue-500/20 print:border-slate-300 print:bg-white print:text-black">
                        <h2 className="text-2xl font-bold text-white mb-8 text-center print:text-black">Neden Novo CRM?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400 mb-2">+%35</div>
                                <div className="text-sm text-slate-500">Satış Ofisi Verimliliği</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400 mb-2">0 Hata</div>
                                <div className="text-sm text-slate-500">Çift Ünite Satış Riski</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400 mb-2">7/24</div>
                                <div className="text-sm text-slate-500">Canlı Stok Takibi</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer */}
                <div className="hidden print:block mt-20 pt-8 border-t border-slate-200 text-center text-xs text-slate-500">
                    <p>© 2026 Novo CRM. Tüm hakları saklıdır. | www.novoxcrm.com | info@novoxcrm.com</p>
                </div>
            </main>

            {/* Global Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .bg-slate-950, .bg-slate-900\/50, .bg-blue-600\/5 {
                        background: white !important;
                    }
                    .text-white, .text-slate-300, .text-slate-400, .text-blue-300 {
                        color: black !important;
                    }
                    .border-slate-800, .border-slate-700, .border-blue-500\/20 {
                        border-color: #e2e8f0 !important;
                    }
                    h1, h2, h3 {
                        color: black !important;
                    }
                    header, button, .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}
