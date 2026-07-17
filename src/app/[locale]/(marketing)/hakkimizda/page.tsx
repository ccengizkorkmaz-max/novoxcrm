import type { Metadata } from "next";
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host";

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders();
    const brandName = await getBrandNameFromHost(host);
    return {
        title: 'Hakkımızda',
        description: `BTPROSES Teknoloji Danışmanlık Ltd.Şti. ve ${brandName} hakkında kurumsal bilgiler.`,
    };
}

export default async function HakkimizdaPage() {
    const host = await getHostFromHeaders();
    const brandName = await getBrandNameFromHost(host);
    const isOikos = brandName === 'Oikos CRM';

    return (
        <div className="py-24 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className={
                    isOikos 
                        ? "bg-white p-8 md:p-12 rounded-3xl border border-[#E2F0EC] shadow-xl" 
                        : "bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl"
                }>
                    <h1 className={
                        isOikos
                            ? "text-3xl md:text-4xl font-extrabold text-[#085041] mb-8"
                            : "text-3xl md:text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500"
                    }>
                        Hakkımızda
                    </h1>

                    <div className={isOikos ? "text-slate-700 space-y-8 leading-relaxed" : "text-slate-400 space-y-8 leading-relaxed"}>
                        
                        <p className={isOikos ? "text-lg text-slate-800 font-medium" : "text-lg text-slate-300 font-medium"}>
                            BTPROSES Teknoloji Danışmanlık Ltd.Şti., dijital dönüşüm ve yazılım çözümleri üreten yenilikçi bir teknoloji şirketidir. 
                        </p>

                        {isOikos ? (
                            // Completely custom Oikos CRM product information
                            <>
                                <section>
                                    <h2 className="text-xl font-bold text-[#085041] mb-4 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                        Vizyonumuz
                                    </h2>
                                    <p className="pl-11 text-slate-600">
                                        Gayrimenkul acenteleri ve bağımsız emlak danışmanlarının günlük operasyonlarını, müşteri takiplerini ve portföy yönetimlerini yapay zeka desteğiyle kolaylaştırarak satış hızlarını ve kazançlarını artırmaktır.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-bold text-[#085041] mb-4 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                        Oikos CRM Nedir?
                                    </h2>
                                    <p className="pl-11 text-slate-600">
                                        Oikos CRM, emlak ofisleri, acenteler ve bağımsız gayrimenkul danışmanları için özel olarak geliştirilmiş yapay zeka destekli pratik bir CRM platformudur. WhatsApp entegrasyonu, otomatik müşteri skorlama, akıllı portföy eşleştirme ve sesli AI asistanı (Maya) gibi modern araçlarla danışmanların rutin iş yükünü %60 azaltır. Emlak profesyonellerinin sahada hızlı aksiyon almalarını ve müşteri ilişkilerini en yüksek verimle yönetmelerini sağlar.
                                    </p>
                                </section>
                            </>
                        ) : (
                            // Default Novo/Novox CRM product information
                            <>
                                <section>
                                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                        Vizyonumuz
                                    </h2>
                                    <p className="pl-11 text-slate-400">
                                        Özellikle gayrimenkul ve inşaat sektöründe, karmaşık satış süreçlerini, müşteri takiplerini ve finansal operasyonları tek bir çatı altında toplayarak işletmelerin büyümesini hızlandıracak küresel standartlarda yazılım ürünleri (SaaS) geliştirmektir.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                        <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                        Novo CRM Nedir?
                                    </h2>
                                    <p className="pl-11 text-slate-400">
                                        Novo CRM, inşaat firmaları, proje geliştiriciler ve büyük ölçekli gayrimenkul ofisleri için özel olarak tasarlanmış bulut tabanlı bir müşteri ilişkileri yönetimi (CRM) platformudur. Müşteri adayı (Lead) aşamasından, kapora ve senetli ödeme planlarına kadar tüm satış hunisini dijitalleştirir. İşletmelerin Excel tablolarından kurtulup tamamen entegre ve ölçülebilir bir yapıya geçmelerini sağlar.
                                    </p>
                                </section>
                            </>
                        )}

                        <section>
                            <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                <span className={
                                    isOikos
                                        ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"
                                        : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"
                                }>03</span>
                                Kurumsal Bilgiler
                            </h2>
                            <div className={isOikos ? "pl-11 space-y-2 text-slate-600" : "pl-11 space-y-2 text-slate-400"}>
                                <p><strong className={isOikos ? "text-slate-800" : "text-slate-200"}>Firma Ünvanı:</strong> BTPROSES Teknoloji Danışmanlık Ltd.Şti.</p>
                                <p><strong className={isOikos ? "text-slate-800" : "text-slate-200"}>Merkez Adresi:</strong> Burhaniye Mh. Üsküdar - İstanbul 34676</p>
                                <p><strong className={isOikos ? "text-slate-800" : "text-slate-200"}>E-posta:</strong> melis@btproses.com</p>
                                <p><strong className={isOikos ? "text-slate-800" : "text-slate-200"}>Faaliyet Alanı:</strong> Yazılım Geliştirme, SaaS (Software as a Service), Teknoloji Danışmanlığı</p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
