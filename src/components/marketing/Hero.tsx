import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ChevronRight, PlayCircle } from 'lucide-react'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

export function Hero() {
    return (
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-950">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="container relative z-10 mx-auto px-4 text-center">
                {/* Badge */}
                <div className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-300 mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="flex h-2 w-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
                    İnşaat ve Gayrimenkul Sektörü İçin Özel CRM
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-8 leading-[1.1]">
                    Dijital Pazarlamadan Satış Ofisine <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 drop-shadow-[0_0_25px_rgba(52,211,153,0.3)]">
                        Tam Saha Hakimiyet
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="max-w-4xl mx-auto text-xl text-slate-400 mb-10 leading-relaxed">
                    Pazarlama bütçenizi verimli kullanın, müşteri kazanma araçlarını güçlendirin. <span className="text-white font-bold">NovoxCRM</span>; konut satışından stok takibine, broker ağ yönetiminden finansal raporlamaya kadar inşaat projelerinin tüm dinamiklerini tek merkezden yönetmek ve satış hacminizi artırmak için tasarlandı.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <LeadCaptureModal
                        title="Ücretsiz Tanıtım ve Demo"
                        description="Projenizin satışlarını nasıl dijitalleştirebileceğimizi göstermek için bir uzmanımız sizinle iletişime geçecek."
                        resourceName="Hero_Demo_Request"
                    >
                        <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-900/40 group">
                            <span className="flex items-center font-bold">
                                Hemen Dijitalleşin
                                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </LeadCaptureModal>

                    <Button size="lg" variant="ghost" className="h-14 px-8 text-lg rounded-full text-slate-300 hover:text-white hover:bg-white/5 border border-slate-800" asChild>
                        <Link href="/solutions" className="flex items-center">
                            Sistem Detaylarını İncele
                        </Link>
                    </Button>
                </div>

                <div className="relative mx-auto max-w-6xl mt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                    <div className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-2 shadow-[0_0_50px_rgba(37,99,235,0.15)] backdrop-blur-xl ring-1 ring-white/10 overflow-hidden group">
                        {/* Interactive Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        <div className="rounded-xl overflow-hidden bg-slate-950/50 shadow-inner">
                            <img
                                src="/images/dashboard-preview-v2.png"
                                alt="NovoxCRM Dashboard View"
                                className="w-full h-auto object-cover opacity-95 group-hover:opacity-100 transition-all duration-700 group-hover:scale-[1.01]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
