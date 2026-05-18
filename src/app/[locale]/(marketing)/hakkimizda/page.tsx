import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Hakkımızda | NOVO CRM',
    description: 'BTPROSES Teknoloji Danışmanlık Ltd.Şti. ve NOVO CRM hakkında kurumsal bilgiler.',
};

export default function HakkimizdaPage() {
    return (
        <div className="py-24 bg-slate-950 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Hakkımızda
                    </h1>

                    <div className="text-slate-400 space-y-8 leading-relaxed">
                        
                        <p className="text-lg text-slate-300 font-medium">
                            BTPROSES Teknoloji Danışmanlık Ltd.Şti., dijital dönüşüm ve yazılım çözümleri üreten yenilikçi bir teknoloji şirketidir. 
                        </p>

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
                                NOVO CRM Nedir?
                            </h2>
                            <p className="pl-11 text-slate-400">
                                NOVO CRM, inşaat firmaları, proje geliştiriciler ve büyük ölçekli gayrimenkul ofisleri için özel olarak tasarlanmış bulut tabanlı bir müşteri ilişkileri yönetimi (CRM) platformudur. Müşteri adayı (Lead) aşamasından, kapora ve senetli ödeme planlarına kadar tüm satış hunisini dijitalleştirir. İşletmelerin Excel tablolarından kurtulup tamamen entegre ve ölçülebilir bir yapıya geçmelerini sağlar.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">03</span>
                                Kurumsal Bilgiler
                            </h2>
                            <div className="pl-11 space-y-2 text-slate-400">
                                <p><strong>Firma Ünvanı:</strong> BTPROSES Teknoloji Danışmanlık Ltd.Şti.</p>
                                <p><strong>Merkez Adresi:</strong> Burhaniye mh. Reşit Bey Sok. No:6 Üsküdar / İstanbul</p>
                                <p><strong>E-posta:</strong> info@btproses.com</p>
                                <p><strong>Faaliyet Alanı:</strong> Yazılım Geliştirme, SaaS (Software as a Service), Teknoloji Danışmanlığı</p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
