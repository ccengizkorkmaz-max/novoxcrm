import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export function CRMLifecycle() {
    return (
        <section id="process-flow" className="py-24 bg-slate-900/20 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold mb-6">
                        UÇTAN UCA YÖNETİM
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">CRM Core Süreç Döngüsü</h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Ham kontaktan imzalı sözleşmeye kadar tüm gayrimenkul satış döngüsünü tek bir platform üzerinden, kopukluk yaşamadan yönetin.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="relative aspect-square">
                        <Image
                            src="/images/crm-process-cycle.png"
                            alt="CRM Core Süreç Döngüsü"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="space-y-4">
                        {[
                            { title: "Kontak", desc: "Ham datanın (telefon, mail) sisteme ilk girişi ve KVKK onayı." },
                            { title: "Lead", desc: "Nitelikli hale gelen, projenizle ilgilenen potansiyel müşteri." },
                            { title: "Fırsat", desc: "Sıcak takip, ofis ziyareti ve sunum aşamasındaki adaylar." },
                            { title: "Teklif", desc: "Resmi ödeme planı ve daire bazlı fiyat teklifinin sunulması." },
                            { title: "Opsiyon", desc: "Dairenin geçici olarak rezerve edilmesi ve kapora süreci." },
                            { title: "Satış", desc: "Tahsilat planının onaylanması ve satış kaydının kesinleşmesi." },
                            { title: "Sözleşme", desc: "Dijital veya fiziki imza ile mülkiyet sürecinin tamamlanması." }
                        ].map((step, idx) => (
                            <div key={idx} className="flex items-center gap-4 group">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-all">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 hover:bg-slate-800/40 transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-white">{step.title}</h4>
                                        {idx < 6 && <ArrowRight className="h-3 w-3 text-slate-600" />}
                                    </div>
                                    <p className="text-sm text-slate-400">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
