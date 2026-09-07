'use client'

import React from 'react'
import Link from 'next/link'
import { 
    ArrowLeft, 
    Printer, 
    Compass, 
    Coins, 
    CreditCard, 
    PhoneCall, 
    Flame, 
    TrendingUp, 
    Building2, 
    Briefcase, 
    ShieldAlert, 
    Target, 
    CheckCircle2, 
    Calendar, 
    Clock, 
    Layers, 
    Sparkles 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function CeoFunnelGuidePage() {
    return (
        <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-500 text-slate-800">
            {/* Top Bar / Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-3">
                    <Link href="/reports/ceo-funnel">
                        <Button variant="outline" size="sm" className="rounded-xl gap-2 text-slate-700 hover:text-indigo-600">
                            <ArrowLeft className="h-4 w-4" />
                            Kokpite Geri Dön
                        </Button>
                    </Link>
                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-3 py-1">
                        Yönetici El Kitapçığı & Kılavuz
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={() => window.print()} 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl gap-2 border-slate-300 print:hidden"
                    >
                        <Printer className="h-4 w-4 text-slate-600" />
                        Sayfayı Yazdır / PDF
                    </Button>
                </div>
            </div>

            {/* Executive Cover Banner */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-8 md:p-12 rounded-3xl shadow-xl relative overflow-hidden space-y-4 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs tracking-wider uppercase">
                    <Compass className="h-4 w-4" />
                    Stratejik Karar Destek Dokümanı
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                    CEO Satış Hunisi & Gelir Projeksiyonu <br className="hidden sm:inline" />
                    <span className="text-indigo-300">Yönetici Okuma Rehberi</span>
                </h1>
                <p className="text-slate-300 text-sm md:text-base max-w-3xl leading-relaxed">
                    Bu doküman, NovoCRM <strong>CEO Satış Hunisi Kokpiti</strong> üzerindeki yüzlerce dinamik veriyi 
                    boğulmadan, 5 dakikada şirketinizin <strong>nakit akışı</strong>, <strong>gelecek cirosu</strong>, 
                    <strong>satış ekibinin operasyonel eforu</strong> ve <strong>riskli kaçakları</strong> açısından nasıl yorumlayacağınızı özetler.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-indigo-200">
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Clock className="h-3.5 w-3.5 text-amber-300" /> Okuma Süresi: 4 Dakika
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-300" /> Canlı Supabase Realtime Destekli
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                        <Calendar className="h-3.5 w-3.5 text-cyan-300" /> 12 Aylık Tahsilat Projeksiyonu
                    </span>
                </div>
            </div>

            {/* Section 1: The 10-Second Executive Glance */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">1</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        10 Saniyelik Bakış: Ekrana İlk Girdiğinizde Ne Görmelisiniz?
                    </h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                    Bir CEO olarak karmaşık tabloları tek tek incelemek zorunda değilsiniz. Sayfanın en üstündeki 
                    <strong> 3 Senaryolu Finansal Projeksiyon</strong> ve <strong>Ana KPI Kartları</strong> şirketinizin anlık kalp grafiğidir:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <Card className="border-slate-200 rounded-2xl bg-slate-50/50">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">1. Kasa Garantisi</span>
                            <CardTitle className="text-base font-black text-slate-800">Muhafazakar Senaryo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-xs text-slate-600 space-y-1.5">
                            <p><strong>Cevapladığı Soru:</strong> <em>&quot;Piyasa yarın dursa, kasaya asgari ne kadar ciro girer?&quot;</em></p>
                            <p className="text-slate-500">Kesinleşen satışlar + opsiyonların %70&apos;i + mevcut tekliflerin sadece %30&apos;u baz alınır. Nakit bütçenizi bu rakamın altına asla düşürmeyin.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-indigo-300 rounded-2xl bg-indigo-50/40 relative shadow-sm">
                        <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase">Hedef Ciro</div>
                        <CardHeader className="p-4 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">2. İstatistiksel Beklenti</span>
                            <CardTitle className="text-base font-black text-indigo-950">Ağırlıklı Beklenen Ciro</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-xs text-slate-700 space-y-1.5">
                            <p><strong>Cevapladığı Soru:</strong> <em>&quot;Normal şartlar altında ay/dönem sonunda kaç para ciro yaparız?&quot;</em></p>
                            <p className="text-slate-600">Opsiyonların %85&apos;i, tekliflerin %60&apos;ı ve sunumların %35&apos;i gibi matematiksel olasılıklarla ağırlıklandırılmış <strong>en gerçekçi ciro projeksiyonudur</strong>.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 rounded-2xl bg-slate-50/50">
                        <CardHeader className="p-4 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-teal-600">3. Tavan Kapasite</span>
                            <CardTitle className="text-base font-black text-slate-800">İyimser / Agresif Senaryo</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-xs text-slate-600 space-y-1.5">
                            <p><strong>Cevapladığı Soru:</strong> <em>&quot;Satış ekibi maksimum performans gösterirse ulaşılabilecek tavan ne?&quot;</em></p>
                            <p className="text-slate-500">Opsiyonların %95&apos;i ve tekliflerin %80&apos;inin başarıyla kapatıldığı senaryodur. Prim ve büyüme hedeflerini planlamak için kullanılır.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Section 2: Core KPI Cards Meaning */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">2</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        5 Temel KPI Kartı Nasıl Yorumlanır?
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                            <Layers className="h-4 w-4 text-indigo-600" />
                            <span>Aktif Satış Hunisi Değeri (Pipeline)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Müşteriye teklif verilmiş veya opsiyonlanmış, henüz sonucu belli olmamış <strong>sıcak para havuzudur</strong>. 
                            Bu rakam hedef cironuzun en az <strong>3 ila 4 katı</strong> büyüklüğünde olmalıdır. Eğer bu havuz küçülüyorsa, 1 ay sonra cironuz düşecek demektir.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                            <Coins className="h-4 w-4 text-emerald-600" />
                            <span>Gerçekleşen Ciro vs. Toplanan Kapora</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            <strong>Gerçekleşen Ciro:</strong> Sözleşmesi imzalanmış veya satışı kesinleşmiş kesin gelir.<br />
                            <strong>Kaporalar:</strong> Müşterilerin üniteyi ayırtmak için yatırdığı güvence bedelidir. Kaporalar doğrudan finansal gelir projeksiyonuna dahil edilir.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                            <Target className="h-4 w-4 text-purple-600" />
                            <span>Uçtan Uca Dönüşüm Oranı (%)</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Kapıdan giren 100 reklam lead&apos;inden kaçının tapu/sözleşme aşamasına ulaştığını gösterir. 
                            Gayrimenkul ve lüks konutta <strong>%1.5 ile %3.5 arası</strong> sağlıklı kabul edilir. %1&apos;in altı pazarlama kalitesizliği veya danışman takip eksikliğine işaret eder.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2">
                        <div className="flex items-center gap-2 font-black text-slate-900">
                            <CreditCard className="h-4 w-4 text-amber-600" />
                            <span>Sözleşmeli Portföy & Tahsilat İlerlemesi</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            Şirketinizin bugüne kadar yaptığı tüm vadeli sözleşmelerin toplam bedeli ve bu bedelin <strong>yüzde kaçının kasaya fiilen girdiği</strong> özetlenir.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 3: Navigation Tabs Explained */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">3</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Detaylı İnceleme Sekmeleri (Hangi Durumda Nereye Bakmalı?)
                    </h2>
                </div>

                <div className="space-y-3">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-start">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-sm">Sözleşmeli Nakit Akışı & Taksitler (12 Aylık Projeksiyon)</h3>
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Finans & CFO</Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Şirketin önümüzdeki 12 ay boyunca sözleşmelerden kasaya girmesi garanti olan taksit takvimini Recharts sütun grafiğiyle gösterir. 
                                <strong>Vadesi Geçmiş Riskli Alacaklar Radarı</strong>, hangi müşterinin kaç gündür taksitini aksattığını doğrudan listeler; anında tahsilat aksiyonu alabilirsiniz.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-start">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                            <PhoneCall className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-sm">Satış Aktiviteleri & Ekip Nabzı</h3>
                                <Badge className="bg-blue-100 text-blue-800 text-[10px]">Saha & Operasyon</Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                <em>&quot;Ekip sahada gerçekten aktif mi?&quot;</em> sorusunu yanıtlar. Bugün kaç telefon görüşmesi, kaç müşteri randevusu ve kaç proje gezisi yapıldığını anlık sayar. 
                                <strong>İhmal Edilen Sıcak Fırsatlar Radarı</strong>, teklif verilip 5+ gündür aranmayan müşterileri kırmızı alarmla listeler.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-start">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <Flame className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-sm">Kritik Büyük Fırsatlar Radarı (Whale Deals)</h3>
                                <Badge className="bg-amber-100 text-amber-800 text-[10px]">Doğrudan CEO Takibi</Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Şirketin dönem cirosunu tek başına %20-30 oranında etkileyebilecek en yüksek tutarlı 10 teklifi listeler. 
                                Bu müşterilerle CEO veya Satış Direktörünün bizzat iletişime geçmesi kapanış oranını ikiye katlar.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-start">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-sm">Darboğaz & Kayıp Analizi</h3>
                                <Badge className="bg-rose-100 text-rose-800 text-[10px]">Huni Kaçakları</Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Müşterilerin en çok hangi aşamada (Sunum sonrası mı, Teklif sonrası mı?) elendiğini ve en yaygın kayıp sebeplerini (Fiyat, Lokasyon, Rakip, Bütçe Yetersizliği) gösterir.
                            </p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col md:flex-row gap-4 items-start">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                            <Target className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-900 text-sm">Pazarlama / Kaynak ROI</h3>
                                <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">Reklam Verimliliği</Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Meta Ads, Google Ads, Sahibinden, Doğrudan Referans vb. kanalların getirdiği lead&apos;lerin kaç paraya dönüştüğünü gösterir. Boşa reklam bütçesi harcamayı engeller.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Section 4: CEO 5-Minute Weekly Routine */}
            <section className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm">4</div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        CEO İçin 5 Dakikalık Haftalık Rutin Kontrol Listesi
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-indigo-950 text-white space-y-3">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                            <Calendar className="h-4 w-4" />
                            Pazartesi Sabahı (09:00 - 09:05)
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                            <li><strong>Ağırlıklı Beklenen Ciro:</strong> Ay sonu hedefinden ne kadar uzaktayız?</li>
                            <li><strong>Bu Ayın Vadesi Gelen Taksitleri:</strong> Bu ay kasaya girmesi gereken sözleşmeli para ne kadar?</li>
                            <li><strong>Büyük Fırsatlar (Whale Deals):</strong> Bu hafta hangi 3 büyük masayı kapatmalıyız?</li>
                        </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Cuma Akşamı (17:30 - 17:35)
                        </div>
                        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                            <li><strong>Satış Aktiviteleri Nabzı:</strong> Bu hafta toplam kaç müşteri ziyareti ve randevusu gerçekleşti?</li>
                            <li><strong>İhmal Edilen Müşteriler:</strong> 5 gündür aranmayan sıcak teklif var mı?</li>
                            <li><strong>Gecikmiş Alacaklar:</strong> Vadesi dolup ödenmeyen taksitler için muhasebe arandı mı?</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Bottom Actions */}
            <div className="text-center pt-6 pb-12">
                <Link href="/reports/ceo-funnel">
                    <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl px-8 shadow-lg shadow-indigo-600/20">
                        Anladım, CEO Kokpitine Geç
                    </Button>
                </Link>
            </div>
        </div>
    )
}
