import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Teslimat ve İade Şartları | NOVO CRM',
    description: 'BTPROSES Teknoloji Danışmanlık Ltd.Şti. SaaS hizmetleri için teslimat ve iade şartları.',
};

export default function TeslimatVeIadePage() {
    return (
        <div className="py-24 bg-slate-950 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Teslimat ve İade Şartları
                    </h1>

                    <div className="text-slate-400 space-y-8 leading-relaxed">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">
                                Son Güncelleme: 18 Mayıs 2026
                            </p>
                        </div>

                        <p className="text-lg">
                            BTPROSES Teknoloji Danışmanlık Ltd.Şti. ("Firma") tarafından sunulan SaaS (Hizmet olarak Yazılım) çözümlerinin satın alımına yönelik teslimat süreçleri ve iade/iptal koşulları aşağıda detaylandırılmıştır.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                Teslimat Şartları
                            </h2>
                            <div className="pl-11 text-slate-400 space-y-3">
                                <p>
                                    Satın aldığınız ürün fiziki bir ürün olmayıp, tamamen internet üzerinden erişilen <strong>Bulut Tabanlı Bir Yazılım Hizmetidir (SaaS)</strong>.
                                </p>
                                <p>
                                    Ödeme işleminizin kredi kartı veya diğer lisanslı elektronik ödeme yöntemleri (iyzico vb.) üzerinden başarılı bir şekilde tamamlanmasının ardından, hesabınız sistem tarafından <strong>otomatik olarak anında</strong> aktif hale getirilir.
                                </p>
                                <p>
                                    Sisteme giriş için gerekli olan yetkilendirme bilgileri, sipariş esnasında girmiş olduğunuz e-posta adresine eşzamanlı olarak gönderilir. Bu e-posta ile birlikte hizmetin <strong>"Teslimatı (İfası)"</strong> gerçekleşmiş sayılır. Kurulum veya kargo bekleme süresi bulunmamaktadır.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                İade ve İptal Şartları
                            </h2>
                            <div className="pl-11 text-slate-400 space-y-3">
                                <p>
                                    Mesafeli Sözleşmeler Yönetmeliği'nin 15. Maddesinin 1. Fıkrasının (ğ) bendi uyarınca; <strong>"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler"</strong> cayma hakkı kapsamı dışındadır.
                                </p>
                                <p className="font-semibold text-slate-300">
                                    Yazılımımız anında kullanılmaya başlanan bir hizmet olduğundan yasal olarak İADE HAKKI BULUNMAMAKTADIR.
                                </p>
                                <p>
                                    Ancak firmamız %100 müşteri memnuniyetini esas alır. Bu sebeple yasal zorunluluğumuz bulunmamasına rağmen, yeni satın alımlarda sistemin size uygun olmadığını düşünürseniz ilk <strong>7 gün içinde</strong> geçerli bir neden sunarak koşullu iade talebinde bulunabilirsiniz. Bu durumda, tahsis edilen sunucu/kurulum kaynak kullanım bedelleri kesilerek kalan tutar iade edilebilir. Bu işlem tamamen firmamızın inisiyatifindedir.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">03</span>
                                Abonelik İptali
                            </h2>
                            <p className="pl-11 text-slate-400">
                                Satın aldığınız lisans süresi (Örn: 1 Yıllık) dolduğunda, lisansınızı yenilememe hakkına sahipsiniz. Hizmeti yenilemediğiniz takdirde sözleşmeniz kendiliğinden sona erer. Devam eden mevcut bir aboneliğin dönem ortasında iptal edilmesi durumunda <strong>kullanılmayan ayların/günlerin ücret iadesi yapılmaz</strong>. Hizmeti dönem sonuna kadar kullanmaya devam edebilirsiniz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">04</span>
                                Sistem Kesintileri ve SLA
                            </h2>
                            <p className="pl-11 text-slate-400">
                                Yazılım kaynaklı sistemsel büyük arızalar veya Firmamızın kontrolü dışındaki veri merkezi (datacenter) kaynaklı 48 saati aşan kesintisiz erişim problemlerinde, müşteri o ayki faturasının iadesini veya süresine ek süre eklenmesini talep edebilir.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-slate-800 mt-12">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">05</span>
                                Bize Ulaşın
                            </h2>
                            <p className="pl-11 mb-2 text-slate-400">
                                İade/İptal veya teslimatla ilgili tüm soru ve talepleriniz için bize ulaşabilirsiniz:
                            </p>
                            <p className="pl-11 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">melis@btproses.com</p>
                            <p className="pl-11 mt-2 text-slate-400">BTPROSES Teknoloji Danışmanlık Ltd.Şti.</p>
                            <p className="pl-11 text-sm text-slate-500">Burhaniye Mh. Üsküdar - İstanbul 34676</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
