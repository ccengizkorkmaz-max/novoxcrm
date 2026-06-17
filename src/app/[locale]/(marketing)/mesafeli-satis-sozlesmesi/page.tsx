import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Mesafeli Satış Sözleşmesi | NOVO CRM',
    description: 'BTPROSES Teknoloji Danışmanlık Ltd.Şti. SaaS yazılım hizmetleri için mesafeli satış sözleşmesi.',
};

export default function MesafeliSatisSozlesmesiPage() {
    return (
        <div className="py-24 bg-slate-950 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Mesafeli Satış Sözleşmesi
                    </h1>

                    <div className="text-slate-400 space-y-8 leading-relaxed">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">
                                Son Güncelleme: 18 Mayıs 2026
                            </p>
                        </div>

                        <p className="text-lg">
                            İşbu sözleşme, BTPROSES Teknoloji Danışmanlık Ltd.Şti. tarafından sunulan yazılım (SaaS) hizmetlerinin elektronik ortamda satın alınmasına ilişkin tarafların hak ve yükümlülüklerini düzenler.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                Taraflar
                            </h2>
                            <div className="pl-11 space-y-4">
                                <div>
                                    <h3 className="text-slate-300 font-semibold mb-1">1.1. SATICI (Hizmet Sağlayıcı)</h3>
                                    <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                        <li><strong>Unvanı:</strong> BTPROSES Teknoloji Danışmanlık Ltd.Şti.</li>
                                        <li><strong>Adres:</strong> Burhaniye Mh. Üsküdar - İstanbul 34676</li>
                                        <li><strong>İletişim:</strong> melis@btproses.com</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-slate-300 font-semibold mb-1">1.2. ALICI (Müşteri)</h3>
                                    <p className="text-slate-400">
                                        Site üzerinden NOVO CRM veya ilgili yazılım hizmetlerini (SaaS) satın alan, bilgileri ödeme sayfasında ve faturada belirtilen gerçek veya tüzel kişi.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                Sözleşmenin Konusu
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">
                                İşbu sözleşmenin konusu, ALICI'nın SATICI'ya ait internet sitesi üzerinden elektronik ortamda siparişini yaptığı ve nitelikleri ile satış fiyatı belirtilen "Bulut Tabanlı Yazılım (SaaS)" hizmetinin satışı ve kullanım koşulları ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">03</span>
                                Hizmetin Teslimi ve Kullanım Şekli
                            </h2>
                            <p className="pl-11 text-slate-400 space-y-2">
                                Söz konusu hizmet fiziksel bir ürün olmayıp, internet üzerinden erişilen bir yazılım aboneliğidir (SaaS). Ödemenin başarılı bir şekilde gerçekleşmesinin ardından ALICI'ya sisteme giriş yapabilmesi için gerekli olan hesap bilgileri elektronik e-posta yoluyla iletilir. Hizmetin ifası (teslimi) anında gerçekleşmiş sayılır. ALICI, satın aldığı paket kapsamındaki özellikleri belirtilen lisans süresi boyunca kullanma hakkına sahip olur.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">04</span>
                                Cayma Hakkı ve İstisnalar
                            </h2>
                            <div className="pl-11 text-slate-400 space-y-3">
                                <p>
                                    Mesafeli Sözleşmeler Yönetmeliği madde 15/1-ğ uyarınca "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler" cayma hakkının istisnaları arasındadır.
                                </p>
                                <p className="font-semibold text-slate-300">
                                    SATICI tarafından sunulan SaaS (Hizmet olarak Yazılım) çözümü, ALICI'nın ödeme anında anında erişimine açılan, elektronik ortamda ifa edilen bir hizmet olduğundan, ALICI'nın standart olarak CAYMA HAKKI BULUNMAMAKTADIR. 
                                </p>
                                <p>
                                    Bununla birlikte SATICI, müşteri memnuniyeti kapsamında inisiyatif kullanarak belirli bir deneme süresi içinde talep edilen iadeleri "Teslimat ve İade Şartları" belgesinde belirtilen koşullarla kabul edebilir.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">05</span>
                                Gizlilik ve Kişisel Veriler
                            </h2>
                            <p className="pl-11 text-slate-400">
                                ALICI tarafından işbu sözleşmede belirtilen bilgiler ile ödeme yapmak amacı ile SATICI'ya bildirdiği bilgiler, SATICI tarafından 3. şahıslarla paylaşılmayacaktır. Detaylı bilgi için "Gizlilik Sözleşmesi" sayfamızı inceleyebilirsiniz. Sisteme girilen Müşteri (ALICI) verileri BTPROSES güvencesi altında bulut sunucularda saklanır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">06</span>
                                Yetkili Mahkeme
                            </h2>
                            <p className="pl-11 text-slate-400">
                                İşbu sözleşmenin uygulanmasında, Gümrük ve Ticaret Bakanlığınca ilan edilen değere kadar Alıcının yerleşim yerindeki Tüketici Hakem Heyetleri ile İstanbul (Anadolu) Mahkemeleri ve İcra Daireleri yetkilidir. Tüzel kişi (kurumsal) alımlarında Türk Ticaret Kanunu hükümleri geçerlidir.
                            </p>
                        </section>

                        <section className="pt-8 border-t border-slate-800 mt-12">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">07</span>
                                Kabul Beyanı
                            </h2>
                            <p className="pl-11 mb-2 text-slate-400 italic">
                                Siparişin gerçekleşmesi durumunda ALICI işbu sözleşmenin tüm koşullarını okuduğunu, anladığını ve elektronik ortamda kabul ettiğini beyan eder.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
