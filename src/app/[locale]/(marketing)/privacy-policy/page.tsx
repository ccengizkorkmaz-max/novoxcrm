import type { Metadata } from "next";
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host";

export async function generateMetadata(
    props: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await props.params;
    const host = await getHostFromHeaders();
    const brandName = await getBrandNameFromHost(host);
    const isTr = locale === 'tr';

    return {
        title: isTr ? `Gizlilik Politikası | ${brandName}` : `Privacy Policy | ${brandName}`,
        description: isTr 
            ? `${brandName} web sitesi ve CRM platformu için gizlilik politikası ve kişisel verilerin korunması bilgilendirmesi.`
            : `Privacy Policy for ${brandName} website and CRM SaaS platform.`,
    };
}

export default async function PrivacyPolicyPage(props: { params: Promise<{ locale: string }> }) {
    const { locale } = await props.params;
    const host = await getHostFromHeaders();
    const brandName = await getBrandNameFromHost(host);
    const isOikos = brandName === 'Oikos CRM';
    const isTr = locale === 'tr';

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
                        {isTr ? `${brandName} Gizlilik Politikası` : `${brandName} Privacy Policy`}
                    </h1>

                    <div className={isOikos ? "text-slate-700 space-y-8 leading-relaxed" : "text-slate-400 space-y-8 leading-relaxed"}>
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest italic">
                                {isTr ? "Yürürlük Tarihi: 17 Temmuz 2026" : "Effective Date: July 17, 2026"}
                            </p>
                        </div>

                        {isTr ? (
                            // Turkish Content
                            <>
                                <p className="text-lg">
                                    Bu Gizlilik Politikası, {brandName} (&quot;biz&quot;, &quot;bizim&quot; veya &quot;bize&quot;) web sitemizi ve bulut tabanlı CRM platformumuzu kullandığınızda bilgilerinizin nasıl toplandığını, işlendiğini ve korunduğunu açıklar.
                                </p>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>01</span>
                                        Topladığımız Bilgiler
                                    </h2>
                                    <p className="mb-4 pl-11">Sistemimizi kullandığınızda aşağıdaki veri türlerini toplayabiliriz:</p>
                                    <ul className="list-disc pl-16 space-y-2">
                                        <li>Kayıt bilgileri (ad, soyad, e-posta adresi, telefon numarası).</li>
                                        <li>Şirket ve unvan bilgileri.</li>
                                        <li>Müşteri etkileşim verileri ve CRM kayıtları.</li>
                                        <li>Cihaz bilgisi, IP adresi ve kullanım analizleri gibi teknik veriler.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>02</span>
                                        Bilgilerin Kullanımı
                                    </h2>
                                    <p className="mb-4 pl-11">Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:</p>
                                    <ul className="list-disc pl-16 space-y-2">
                                        <li>{brandName} hizmetlerini sağlamak ve operasyonları sürdürmek.</li>
                                        <li>Uygulama performansını iyileştirmek ve kullanıcı deneyimini kişiselleştirmek.</li>
                                        <li>Destek taleplerinizi yanıtlamak ve müşteri hizmetleri sunmak.</li>
                                        <li>Yasal yükümlülüklere uyum sağlamak.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>03</span>
                                        Veri Paylaşımı ve Gizlilik
                                    </h2>
                                    <p className="pl-11">
                                        Kullanıcılarımızın kişisel verilerini kesinlikle satmayız, kiralamayız veya ticaretini yapmayız. Veriler, yalnızca yasal zorunluluk durumlarında veya hizmet sağlayıcı iş ortaklarımızla gizlilik sözleşmeleri kapsamında paylaşılabilir.
                                    </p>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>04</span>
                                        KVKK Haklarınız
                                    </h2>
                                    <p className="pl-11">
                                        6698 sayılı KVKK kapsamında, verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme hakkına sahipsiniz. Haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
                                    </p>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>05</span>
                                        Veri Güvenliği
                                    </h2>
                                    <p className="pl-11">
                                        Verilerinizi yetkisiz erişim, kayıp veya ifşaya karşı korumak için en son teknik ve idari güvenlik önlemlerini (SSL, veri şifreleme vb.) uyguluyoruz.
                                    </p>
                                </section>

                                <section className="pt-8 border-t border-slate-800">
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>06</span>
                                        İletişim Bilgileri
                                    </h2>
                                    <p className="pl-11 mb-2">Gizlilik politikası ile ilgili tüm sorularınız için:</p>
                                    <p className="pl-11 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">melis@btproses.com</p>
                                </section>
                            </>
                        ) : (
                            // English Content
                            <>
                                <p className="text-lg">
                                    This Privacy Policy describes how {brandName} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects, uses, and protects information when you use our website and cloud-based CRM platform.
                                </p>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>01</span>
                                        Information We Collect
                                    </h2>
                                    <p className="mb-4 pl-11">We may collect the following types of information:</p>
                                    <ul className="list-disc pl-16 space-y-2">
                                        <li>Registration details (name, email address, phone number).</li>
                                        <li>Company and job title information.</li>
                                        <li>Customer interaction logs and CRM records.</li>
                                        <li>Technical data such as device type, IP address, and usage logs.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>02</span>
                                        How We Use Information
                                    </h2>
                                    <p className="mb-4 pl-11">We use collected information to:</p>
                                    <ul className="list-disc pl-16 space-y-2">
                                        <li>Provide and operate the {brandName} services and features.</li>
                                        <li>Improve system performance and customize user experience.</li>
                                        <li>Respond to inquiries and provide customer support.</li>
                                        <li>Comply with legal obligations.</li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>03</span>
                                        Data Sharing
                                    </h2>
                                    <p className="pl-11">
                                        We do not sell, trade, or rent users&apos; personal information. Data is only shared when legally required or with authorized service providers under strict confidentiality agreements.
                                    </p>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>04</span>
                                        Data Security
                                    </h2>
                                    <p className="pl-11">
                                        We implement advanced technical and organizational measures (such as SSL encryption and role-based permissions) to protect your information against unauthorized access, loss, or disclosure.
                                    </p>
                                </section>

                                <section>
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>05</span>
                                        Your Rights
                                    </h2>
                                    <p className="pl-11">
                                        You have the right to request access, correction, or deletion of your personal data at any time.
                                    </p>
                                </section>

                                <section className="pt-8 border-t border-slate-800">
                                    <h2 className={isOikos ? "text-xl font-bold text-[#085041] mb-4 flex items-center" : "text-xl font-bold text-slate-200 mb-4 flex items-center"}>
                                        <span className={isOikos ? "w-8 h-8 rounded-full bg-[#085041]/10 text-[#085041] flex items-center justify-center mr-3 text-sm font-mono tracking-tighter" : "w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mr-3 text-sm font-mono tracking-tighter"}>06</span>
                                        Contact Information
                                    </h2>
                                    <p className="pl-11 mb-2">If you have any questions about this Privacy Policy, you may contact us at:</p>
                                    <p className="pl-11 font-bold text-xl text-blue-400 hover:text-blue-300 transition-colors">melis@btproses.com</p>
                                </section>
                            </>
                        )}

                        <div className="pt-4">
                            <p className="text-sm italic text-slate-500 pl-11">
                                {isTr 
                                    ? "Bu Gizlilik Politikasını güncelleme hakkımız saklıdır. Güncellemeler yukarıdaki yürürlük tarihi değiştirilerek belirtilir."
                                    : "We reserve the right to update this Privacy Policy at any time. Updates will be reflected by revising the effective date above."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
