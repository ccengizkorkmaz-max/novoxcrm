import type { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Gizlilik Sözleşmesi ve KVKK Aydınlatma Metni | NOVO CRM',
    description: 'BTPROSES Teknoloji Danışmanlık Ltd.Şti. veri gizliliği ve Kişisel Verilerin Korunması Kanunu aydınlatma metni.',
};

export default function GizlilikSozlesmesiPage() {
    return (
        <div className="py-24 bg-slate-950 min-h-screen">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-slate-900/50 backdrop-blur-sm p-8 md:p-12 rounded-3xl border border-slate-800 shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        Gizlilik Sözleşmesi ve KVKK
                    </h1>

                    <div className="text-slate-400 space-y-8 leading-relaxed">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">
                                Son Güncelleme: 18 Mayıs 2026
                            </p>
                        </div>

                        <p className="text-lg">
                            BTPROSES Teknoloji Danışmanlık Ltd.Şti. olarak, kişisel verilerinizin güvenliğine ve gizliliğine son derece önem vermekteyiz. Bu metin, sitemizi ziyaret eden veya hizmetlerimizden faydalanan kullanıcıların kişisel verilerinin nasıl işlendiği ve korunduğu hakkında bilgilendirme amacı taşımaktadır.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">01</span>
                                Hangi Verileri Topluyoruz?
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">Hizmetlerimizden yararlanmanız esnasında aşağıdaki veri türleri toplanabilir:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>Kimlik ve İletişim Bilgileri (Ad, Soyad, Telefon, E-posta vb.)</li>
                                <li>Fatura ve Ödeme Bilgileri (Vergi No, Adres bilgisi) Kredi kartı verileriniz asla sunucularımızda saklanmaz, lisanslı ödeme altyapısı (iyzico) tarafından güvence altındadır.</li>
                                <li>Kullanım ve Log Verileri (Sistem erişim saatleri, IP adresi, cihaz bilgisi)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">02</span>
                                Kişisel Verilerin İşlenme Amacı
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">Toplanan kişisel verileriniz 6698 sayılı KVKK kapsamında aşağıdaki amaçlarla işlenmektedir:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>SaaS hizmetlerimizin sağlanması, sözleşme süreçlerinin yürütülmesi ve kullanıcı hesaplarının yönetimi.</li>
                                <li>Teknik destek hizmetlerinin sağlanması.</li>
                                <li>Yasal zorunlulukların yerine getirilmesi (Fatura kesimi, mali yükümlülükler vb.)</li>
                                <li>Kullanıcı deneyiminin iyileştirilmesi ve güvenliğin sağlanması.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">03</span>
                                Veri Güvenliği
                            </h2>
                            <p className="pl-11 text-slate-400">
                                Verileriniz yetkisiz erişim, kayıp veya değiştirilmeye karşı 256-bit SSL şifreleme ve modern bulut güvenlik protokolleri kullanılarak korunmaktadır. Sunucularımız düzenli olarak sızma testlerine ve güvenlik denetimlerine tabi tutulmaktadır.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">04</span>
                                Verilerin Üçüncü Kişilerle Paylaşımı
                            </h2>
                            <p className="pl-11 text-slate-400">
                                Firmamız, elde ettiği kişisel verileri hiçbir şekilde üçüncü kişilere satmaz veya ticari amaçla paylaşmaz. Sadece hukuki zorunluluklar gereği resmi makamlar veya hizmetin ifası için zorunlu olan altyapı sağlayıcıları (örn: ödeme kuruluşu iyzico, bulut sunucu sağlayıcıları) ile KVKK kuralları çerçevesinde paylaşılabilir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">05</span>
                                Kullanıcı Hakları (KVKK Madde 11)
                            </h2>
                            <p className="mb-4 pl-11 text-slate-400">KVKK uyarınca sahip olduğunuz haklar:</p>
                            <ul className="list-disc pl-16 space-y-2 text-slate-300">
                                <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
                                <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme,</li>
                                <li>Kişisel verilerin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,</li>
                                <li>İşlenmesini gerektiren sebeplerin ortadan kalkması hâlinde silinmesini veya yok edilmesini isteme.</li>
                            </ul>
                        </section>

                        <section className="pt-8 border-t border-slate-800">
                            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter">06</span>
                                İletişim
                            </h2>
                            <p className="pl-11 mb-2 text-slate-400">Bu gizlilik sözleşmesi ve veri taleplerinizle ilgili bizimle iletişime geçebilirsiniz:</p>
                            <p className="pl-11 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">info@btproses.com</p>
                            <p className="pl-11 mt-2 text-slate-400">BTPROSES Teknoloji Danışmanlık Ltd.Şti.</p>
                            <p className="pl-11 text-sm text-slate-500">Burhaniye Mh. Üsküdar - İstanbul 34676</p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
