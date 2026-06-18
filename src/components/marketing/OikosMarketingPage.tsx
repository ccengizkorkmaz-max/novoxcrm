"use client"

import { useState, useEffect } from 'react'
import { captureMarketingLead } from '@/app/broker/actions'
import { toast } from 'sonner'

export function OikosMarketingPage() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    // Listen for Navbar's contact button click
    useEffect(() => {
        const handler = () => setIsModalOpen(true)
        window.addEventListener('oikos-open-contact', handler)
        return () => window.removeEventListener('oikos-open-contact', handler)
    }, [])

    // Form inputs state
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        type: '',
        subject: '',
        message: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target
        // Map id from HTML to field name
        const fieldMap: Record<string, string> = {
            'f-name': 'name',
            'f-company': 'company',
            'f-email': 'email',
            'f-phone': 'phone',
            'f-type': 'type',
            'f-subject': 'subject',
            'f-message': 'message'
        }
        const fieldName = fieldMap[id] || id
        setFormData(prev => ({ ...prev, [fieldName]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.email) {
            toast.error('Lütfen ad soyad ve e-posta alanlarını doldurun.')
            return
        }

        setLoading(true)
        const submitData = new FormData()
        submitData.append('full_name', formData.name)
        submitData.append('email', formData.email)
        submitData.append('company', formData.company)
        submitData.append('phone', formData.phone)
        submitData.append(
            'resource',
            `Oikos CRM Anasayfa İletişim Formu (Tür: ${formData.type || 'Belirtilmedi'}, Konu: ${formData.subject || 'Belirtilmedi'}, Mesaj: ${formData.message || 'Boş'})`
        )

        try {
            const result = await captureMarketingLead(submitData)
            if (result.error) {
                toast.error(result.error)
            } else {
                setIsSubmitted(true)
                toast.success('Mesajınız başarıyla iletildi!')
            }
        } catch (error) {
            toast.error('İletişim formu gönderilirken bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        // Reset state after transition
        setTimeout(() => {
            setIsSubmitted(false)
            setFormData({
                name: '',
                company: '',
                email: '',
                phone: '',
                type: '',
                subject: '',
                message: ''
            })
        }, 300)
    }

    return (
        <div className="bg-[#F4FAF8] text-[#1A1A1A] font-sans antialiased min-h-screen">
            {/* HERO */}
            <section className="bg-[#04342C] text-white pt-36 pb-20 px-4 md:px-10 text-center relative overflow-hidden">
                {/* Background light spot */}
                <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[radial-gradient(ellipse,rgba(29,158,117,0.2)_0%,transparent_70%)] pointer-events-none z-0" />
                
                <div className="relative z-10 max-w-5xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-[#085041]/50 border border-[#5DCAA5]/30 rounded-full px-4 py-1.5 mb-8 text-[#9FE1CB] text-xs font-semibold uppercase tracking-wider">
                        <span>🏠 Gayrimenkul geliştirme şirketleri & ulusal/uluslararası emlak ağları için AI CRM</span>
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-white max-w-2xl mx-auto leading-tight mb-6">
                        Müşteri yolculuğunu <em className="text-[#EF9F27] not-italic font-normal">uçtan uca</em> yapay zeka ile yönetin
                    </h1>
                    
                    <p className="text-base md:text-lg text-[#9FE1CB] max-w-xl mx-auto mb-10 leading-relaxed">
                        Oikos CRM, gayrimenkul geliştirme şirketleri ve ulusal/uluslararası emlak ağları için tasarlandı. İlk temastan satış kapanışına kadar tüm müşteri iletişimini — neredeyse insan müdahanesine gerek kalmadan — AI ile yönetir.
                    </p>
                    
                    <div className="flex flex-wrap gap-4 justify-center mb-16">
                        <button 
                            className="bg-[#EF9F27] hover:bg-[#FAC775] text-[#412402] px-8 py-3.5 rounded-lg text-base font-semibold transition-colors cursor-pointer"
                            onClick={() => setIsModalOpen(true)}
                        >
                            İletişime geçin →
                        </button>
                        <button 
                            className="bg-transparent hover:bg-[#085041]/40 border border-[#5DCAA5]/35 text-[#9FE1CB] px-6 py-3.5 rounded-lg text-base transition-colors cursor-pointer"
                            onClick={() => document.querySelector('#journey')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Nasıl çalışır?
                        </button>
                    </div>

                    {/* DASHBOARD MOCKUP */}
                    <div className="bg-[#085041] border border-[#0F6E56] rounded-2xl max-w-xl mx-auto overflow-hidden shadow-2xl shadow-black/40">
                        <div className="bg-[#0F6E56] px-4 py-3 flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#E24B4A]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#EF9F27]"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-[#1D9E75]"></div>
                            <span className="text-xs text-[#9FE1CB] font-mono ml-2 tracking-wide">Oikos CRM · Genel Bakış</span>
                        </div>
                        <div className="p-5 grid grid-cols-3 gap-3 bg-[#085041]">
                            <div className="bg-[#04342C] rounded-xl p-4 text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">148</div>
                                <div className="text-[10px] md:text-xs text-[#5DCAA5] mt-1 font-medium">Aktif müşteri</div>
                            </div>
                            <div className="bg-[#04342C] rounded-xl p-4 text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">37</div>
                                <div className="text-[10px] md:text-xs text-[#5DCAA5] mt-1 font-medium">Açık teklif</div>
                            </div>
                            <div className="bg-[#04342C] rounded-xl p-4 text-center">
                                <div className="text-xl md:text-2xl font-bold text-white">%82</div>
                                <div className="text-[10px] md:text-xs text-[#5DCAA5] mt-1 font-medium">Kapanma oranı</div>
                            </div>
                        </div>
                        <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#085041]">
                            <div className="bg-[#04342C] rounded-xl p-4 text-left">
                                <div className="text-sm font-semibold text-white mb-1">Ahmet Yılmaz</div>
                                <div className="text-xs text-[#5DCAA5]">3+1 · Kadıköy · 4.2M TL</div>
                                <div className="inline-flex items-center gap-1 bg-[#0F6E56] rounded-full px-2.5 py-0.5 mt-2.5 text-[10px] font-medium text-[#EF9F27]">
                                    <span>⚡ AI: %91 kapanma</span>
                                </div>
                            </div>
                            <div className="bg-[#04342C] rounded-xl p-4 text-left">
                                <div className="text-sm font-semibold text-white mb-1">Selin Kaya</div>
                                <div className="text-xs text-[#5DCAA5]">2+1 · Beşiktaş · 6.8M TL</div>
                                <div className="inline-flex items-center gap-1 bg-[#0F6E56] rounded-full px-2.5 py-0.5 mt-2.5 text-[10px] font-medium text-[#EF9F27]">
                                    <span>⚡ AI: %74 kapanma</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section className="py-16 md:py-24 px-4 md:px-10 max-w-5xl mx-auto" id="ozellikler">
                <div className="text-xs font-bold text-[#085041] tracking-[0.2em] mb-4">ÖZELLİKLER</div>
                <h2 className="text-2xl md:text-4xl font-medium text-[#1A1A1A] mb-4">Gayrimenkule özel her şey tek yerde</h2>
                <p className="text-sm md:text-base text-gray-500 max-w-xl mb-12">
                    Genel CRM'lerin sektörünüze uymayan özelliklerine para ödemek yerine, Oikos ile ihtiyacınız olan her şeye sahip olun.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#E1F5EE]">🏠</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Portföy yönetimi</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Tüm mülklerinizi, fiyat geçmişini ve pazar değerini tek ekranda takip edin.</p>
                    </div>
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#E1F5EE]">👥</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Müşteri profili</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Her müşterinin tercihlerini, bütçesini ve davranış geçmişini anlayan akıllı profiller.</p>
                        <div className="inline-flex items-center gap-1 bg-[#FAEEDA] rounded-full px-2.5 py-0.5 mt-3 text-[10px] font-semibold text-[#5D3308]">
                            <span>⚡ AI destekli</span>
                        </div>
                    </div>
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#FAEEDA]">📈</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Satış tahmini</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Yapay zeka, piyasa verileri ve müşteri davranışlarına göre kapanma olasılığını hesaplar.</p>
                        <div className="inline-flex items-center gap-1 bg-[#FAEEDA] rounded-full px-2.5 py-0.5 mt-3 text-[10px] font-semibold text-[#5D3308]">
                            <span>⚡ AI destekli</span>
                        </div>
                    </div>
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#E1F5EE]">📅</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Randevu & takip</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Otomatik hatırlatmalar, görev yönetimi ve müşteri iletişim geçmişi tek panelde.</p>
                    </div>
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#FAEEDA]">📍</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Bölge analizi</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Semt bazlı fiyat trendleri, kira getirileri ve yatırım potansiyeli analizleri.</p>
                        <div className="inline-flex items-center gap-1 bg-[#FAEEDA] rounded-full px-2.5 py-0.5 mt-3 text-[10px] font-semibold text-[#5D3308]">
                            <span>⚡ AI destekli</span>
                        </div>
                    </div>
                    <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 hover:shadow-lg hover:border-[#085041]/30 transition-all">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 bg-[#E1F5EE]">📄</div>
                        <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">Teklif & sözleşme</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">Tek tıkla teklif oluşturma, dijital imza ve belge yönetimi entegrasyonu.</p>
                    </div>
                </div>
            </section>

            {/* AI SECTION */}
            <section className="bg-[#04342C] py-16 md:py-24 px-4 md:px-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-xs font-bold text-[#5DCAA5] tracking-[0.2em] mb-4">YAPAY ZEKA</div>
                    <h2 className="text-2xl md:text-4xl font-medium text-white mb-4">Oikos AI — sektörü anlayan zekâ</h2>
                    <p className="text-sm md:text-base text-[#9FE1CB] max-w-xl mb-12">
                        Gayrimenkul verisiyle eğitilmiş modellerimiz, size sadece veri göstermez — ne yapmanız gerektiğini söyler.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#085041] border border-[#0F6E56] rounded-2xl p-6">
                            <div className="text-3xl mb-4">🧠</div>
                            <h3 className="text-base font-semibold text-white mb-2">Müşteri eşleştirme</h3>
                            <p className="text-xs md:text-sm text-[#5DCAA5] leading-relaxed">Yeni ilan geldiğinde AI, portföyünüzdeki en uygun müşteriyi anında önerir.</p>
                        </div>
                        <div className="bg-[#085041] border border-[#0F6E56] rounded-2xl p-6">
                            <div className="text-3xl mb-4">📊</div>
                            <h3 className="text-base font-semibold text-white mb-2">Fiyat önerisi</h3>
                            <p className="text-xs md:text-sm text-[#5DCAA5] leading-relaxed">Piyasa verisi ve benzer satışları analiz ederek optimum fiyat aralığı belirler.</p>
                        </div>
                        <div className="bg-[#085041] border border-[#0F6E56] rounded-2xl p-6">
                            <div className="text-3xl mb-4">💬</div>
                            <h3 className="text-base font-semibold text-white mb-2">Akıllı takip</h3>
                            <p className="text-xs md:text-sm text-[#5DCAA5] leading-relaxed">Müşteri davranışına göre en iyi iletişim zamanını ve mesajını önerir.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* JOURNEY */}
            <section className="bg-[#04342C] border-t border-[#085041] py-16 md:py-24 px-4 md:px-10" id="journey">
                <div className="max-w-5xl mx-auto">
                    <div className="text-xs font-bold text-[#5DCAA5] tracking-[0.2em] mb-4">MÜŞTERI JOURNEY</div>
                    <h2 className="text-2xl md:text-4xl font-medium text-white mb-4">
                        İlk temastan kapanışa <em className="text-[#EF9F27] not-italic font-normal">tamamen otomatik</em>
                    </h2>
                    <p className="text-sm md:text-base text-[#9FE1CB] max-w-xl mb-16">
                        Oikos, müşteri yolculuğunun her adımında devreye girer. Ekibiniz yalnızca kritik anlarda müdahale eder — geri kalanını AI yönetir.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 relative mb-12">
                        {/* Connecting Line */}
                        <div className="absolute top-7 left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#0F6E56] via-[#1D9E75] to-[#EF9F27] hidden md:block z-0" />

                        <div className="text-center flex flex-col items-center px-2 relative z-10">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-[#085041] border-2 border-[#1D9E75] text-white">🎯</div>
                            <div className="text-xs font-semibold text-white mb-1.5 leading-snug mt-3">Lead yakalama</div>
                            <div className="text-[10px] md:text-xs text-[#5DCAA5] leading-normal">Web, sosyal medya ve referans kanallarından otomatik lead toplama</div>
                            <div className="inline-flex items-center gap-1 bg-[#EF9F27]/15 border border-[#EF9F27]/30 rounded-lg px-2 py-0.5 mt-2.5 text-[9px] font-semibold text-[#EF9F27]">
                                <span>⚡ AI sınıflandırma</span>
                            </div>
                        </div>

                        <div className="text-center flex flex-col items-center px-2 relative z-10">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-[#085041] border-2 border-[#1D9E75] text-white">📬</div>
                            <div className="text-xs font-semibold text-white mb-1.5 leading-snug mt-3">Otomatik ilk temas</div>
                            <div className="text-[10px] md:text-xs text-[#5DCAA5] leading-normal">Müşteri profiline göre kişiselleştirilmiş ilk iletişim anında başlar</div>
                            <div className="inline-flex items-center gap-1 bg-[#EF9F27]/15 border border-[#EF9F27]/30 rounded-lg px-2 py-0.5 mt-2.5 text-[9px] font-semibold text-[#EF9F27]">
                                <span>⚡ AI mesajlaşma</span>
                            </div>
                        </div>

                        <div className="text-center flex flex-col items-center px-2 relative z-10">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-[#085041] border-2 border-[#1D9E75] text-white">🔄</div>
                            <div className="text-xs font-semibold text-white mb-1.5 leading-snug mt-3">Akıllı besleme</div>
                            <div className="text-[10px] md:text-xs text-[#5DCAA5] leading-normal">Davranışa göre tetiklenen içerik, hatırlatmalar ve mülk önerileri</div>
                            <div className="inline-flex items-center gap-1 bg-[#EF9F27]/15 border border-[#EF9F27]/30 rounded-lg px-2 py-0.5 mt-2.5 text-[9px] font-semibold text-[#EF9F27]">
                                <span>⚡ AI takip</span>
                            </div>
                        </div>

                        <div className="text-center flex flex-col items-center px-2 relative z-10">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-[#412402] border-2 border-[#EF9F27] text-white font-mono">📋</div>
                            <div className="text-xs font-semibold text-white mb-1.5 leading-snug mt-3">Teklif & müzakere</div>
                            <div className="text-[10px] md:text-xs text-[#5DCAA5] leading-normal">Otomatik teklif hazırlama, fiyat önerisi ve müzakere desteği</div>
                            <div className="inline-flex items-center gap-1 bg-[#EF9F27]/15 border border-[#EF9F27]/30 rounded-lg px-2 py-0.5 mt-2.5 text-[9px] font-semibold text-[#EF9F27]">
                                <span>⚡ AI fiyatlama</span>
                            </div>
                        </div>

                        <div className="text-center flex flex-col items-center px-2 relative z-10">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-[#412402] border-2 border-[#EF9F27] text-white font-mono">🔑</div>
                            <div className="text-xs font-semibold text-white mb-1.5 leading-snug mt-3">Kapanış & sonrası</div>
                            <div className="text-[10px] md:text-xs text-[#5DCAA5] leading-normal">Sözleşme, teslim ve satış sonrası ilişki yönetimi</div>
                            <div className="inline-flex items-center gap-1 bg-[#EF9F27]/15 border border-[#EF9F27]/30 rounded-lg px-2 py-0.5 mt-2.5 text-[9px] font-semibold text-[#EF9F27]">
                                <span>⚡ AI takip</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
                        <div className="bg-[#085041]/50 border border-[#1D9E75]/25 rounded-2xl p-6">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">📬 Otomatik takip & besleme</h4>
                            <p className="text-xs md:text-sm text-[#9FE1CB] leading-relaxed">
                                Müşteri bir mülkü incelediğinde, AI davranışını analiz eder ve doğru zamanda doğru içeriği otomatik olarak iletir. Ekibiniz haberdar olmadan yüzlerce müşteri takibi paralel yürür.
                            </p>
                            <span className="text-[10px] font-semibold text-[#EF9F27] mt-3 block">⚡ Ortalama yanıt süresi: 3 dakika → sıfır</span>
                        </div>
                        <div className="bg-[#085041]/50 border border-[#1D9E75]/25 rounded-2xl p-6">
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">📋 Teklif & müzakere süreci</h4>
                            <p className="text-xs md:text-sm text-[#9FE1CB] leading-relaxed">
                                Piyasa verisi, müşteri bütçesi ve benzer satışları analiz eden AI, gerçekçi teklif aralıkları önerir. Müzakere geçmişi otomatik kaydedilir, kritik anlarda satış ekibine bildirim gider.
                            </p>
                            <span className="text-[10px] font-semibold text-[#EF9F27] mt-3 block">⚡ Teklif hazırlama süresi: saatlerden dakikalara</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEDEN OIKOS */}
            <section className="py-16 md:py-24 px-4 md:px-10 max-w-5xl mx-auto" id="neden-oikos">
                <div className="text-xs font-bold text-[#085041] tracking-[0.2em] mb-4">NEDEN OIKOS</div>
                <h2 className="text-2xl md:text-4xl font-medium text-[#1A1A1A] mb-4">Sektörde bir ilk: insan gibi düşünen CRM</h2>
                <p className="text-sm md:text-base text-gray-500 max-w-xl mb-12">
                    Genel CRM araçları veri saklar. Oikos, müşteri ilişkisini yönetir. Fark, sadece özellik listesinde değil — iş modelinizin merkezinde.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-[#085041] text-white border border-[#085041] rounded-2xl p-6">
                        <div className="text-2xl mb-3">🤖</div>
                        <h3 className="text-base font-semibold text-white mb-2">Sektöre özel AI modeli</h3>
                        <p className="text-xs md:text-sm text-[#9FE1CB] leading-relaxed">
                            Genel amaçlı AI değil — gayrimenkul sektörünün dinamikleriyle, fiyat döngüleriyle ve müşteri davranış kalıplarıyla eğitilmiş özel model.
                        </p>
                    </div>
                    <div className="bg-[#F4FAF8] border border-[#D8F0E8] rounded-2xl p-6">
                        <div className="text-2xl mb-3 text-[#085041]">⚡</div>
                        <h3 className="text-base font-semibold text-[#085041] mb-2">Sıfır gecikmeli müşteri iletişimi</h3>
                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            Lead sisteme girdiği andan itibaren AI devralır. Hafta sonları, mesai dışı, tatil — müşteri her zaman anında yanıt alır.
                        </p>
                    </div>
                    <div className="bg-[#F4FAF8] border border-[#D8F0E8] rounded-2xl p-6">
                        <div className="text-2xl mb-3 text-[#085041]">📊</div>
                        <h3 className="text-base font-semibold text-[#085041] mb-2">Gayrimenkul geliştirme odaklı portföy zekâsı</h3>
                        <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                            Yüzlerce bağımsız birimi olan projelerde her müşteriye en uygun birimi önerir, fiyat optimizasyonu yapar, satış hızını artırır.
                        </p>
                    </div>
                    <div className="bg-[#085041] text-white border border-[#085041] rounded-2xl p-6">
                        <div className="text-2xl mb-3">🔗</div>
                        <h3 className="text-base font-semibold text-white mb-2">Emlak ağları için merkezi yönetim</h3>
                        <p className="text-xs md:text-sm text-[#9FE1CB] leading-relaxed">
                            Onlarca şubeden gelen müşteri verisi tek platformda konsolide olur. Merkez ofis, tüm journey'leri gerçek zamanlı görür ve yönetir.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 border border-[#D8F0E8] rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-[#FFF8F8] p-6 border-b md:border-b-0 md:border-r border-[#D8F0E8]">
                        <div className="text-xs font-bold text-[#A32D2D] tracking-wider mb-4 uppercase">Geleneksel CRM</div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#FADADB] last:border-b-0 text-xs md:text-sm text-gray-600">
                            <span className="text-[#A32D2D] font-bold mr-1">✗</span> Manuel veri girişi ve takip
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#FADADB] last:border-b-0 text-xs md:text-sm text-gray-600">
                            <span className="text-[#A32D2D] font-bold mr-1">✗</span> Mesai dışı müşteri kayıpları
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#FADADB] last:border-b-0 text-xs md:text-sm text-gray-600">
                            <span className="text-[#A32D2D] font-bold mr-1">✗</span> Genel iletişim şablonları
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#FADADB] last:border-b-0 text-xs md:text-sm text-gray-600">
                            <span className="text-[#A32D2D] font-bold mr-1">✗</span> Reaktif satış yaklaşımı
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#FADADB] last:border-b-0 text-xs md:text-sm text-gray-600">
                            <span className="text-[#A32D2D] font-bold mr-1">✗</span> Ekip büyüdükçe kaos artar
                        </div>
                    </div>
                    <div className="bg-[#F4FAF8] p-6">
                        <div className="text-xs font-bold text-[#085041] tracking-wider mb-4 uppercase">Oikos CRM</div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#D8F0E8] last:border-b-0 text-xs md:text-sm text-[#085041] font-semibold">
                            <span className="text-[#085041] font-bold mr-1">✓</span> AI otomatik veri zenginleştirme
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#D8F0E8] last:border-b-0 text-xs md:text-sm text-[#085041] font-semibold">
                            <span className="text-[#085041] font-bold mr-1">✓</span> 7/24 kesintisiz müşteri iletişimi
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#D8F0E8] last:border-b-0 text-xs md:text-sm text-[#085041] font-semibold">
                            <span className="text-[#085041] font-bold mr-1">✓</span> Her müşteriye özel kişiselleştirilmiş mesaj
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#D8F0E8] last:border-b-0 text-xs md:text-sm text-[#085041] font-semibold">
                            <span className="text-[#085041] font-bold mr-1">✓</span> Proaktif AI önerileri ve tahminler
                        </div>
                        <div className="flex items-start gap-2 py-2.5 border-b border-[#D8F0E8] last:border-b-0 text-xs md:text-sm text-[#085041] font-semibold">
                            <span className="text-[#085041] font-bold mr-1">✓</span> Büyüdükçe daha akıllı hale gelir
                        </div>
                    </div>
                </div>
            </section>

            {/* HEDEF SEKTÖR */}
            <section className="bg-[#F4FAF8] py-16 md:py-24 px-4 md:px-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-xs font-bold text-[#085041] tracking-[0.2em] mb-4">KİME ÖZEL</div>
                    <h2 className="text-2xl md:text-4xl font-medium text-[#1A1A1A] mb-4">Gayrimenkul geliştirme şirketleri ve emlak ağları için tasarlandı</h2>
                    <p className="text-sm md:text-base text-gray-500 max-w-xl mb-12">
                        Oikos, ölçeği büyük ve müşteri hacmi yüksek gayrimenkul organizasyonlarının ihtiyaçlarına göre şekillendirildi.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 md:p-8">
                            <div className="w-12 h-12 rounded-xl bg-[#E1F5EE] flex items-center justify-center text-2xl mb-5">🏗️</div>
                            <h3 className="text-lg md:text-xl font-semibold text-[#085041] mb-3">Gayrimenkul geliştirme şirketleri</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Yüzlerce bağımsız birimi olan projelerde satış sürecini AI ile yönetin. Her alıcıya özel journey, otomatik teklif süreci ve anlık portföy analizi.
                            </p>
                            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
                                <li className="flex items-center gap-2">✓ Proje bazlı satış takibi ve tahmin</li>
                                <li className="flex items-center gap-2">✓ Otomatik alıcı-birim eşleştirme</li>
                                <li className="flex items-center gap-2">✓ Ön satış & rezervasyon yönetimi</li>
                                <li className="flex items-center gap-2">✓ Çok kanallı müşteri iletişimi</li>
                                <li className="flex items-center gap-2">✓ Satış ofisi & CRM entegrasyonu</li>
                            </ul>
                        </div>
                        <div className="bg-white border border-[#D8F0E8] rounded-2xl p-6 md:p-8">
                            <div className="w-12 h-12 rounded-xl bg-[#E1F5EE] flex items-center justify-center text-2xl mb-5">🏢</div>
                            <h3 className="text-lg md:text-xl font-semibold text-[#085041] mb-3">Ulusal & uluslararası emlak ağları</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                                Tüm şubelerinizi tek platformda yönetin. Merkezi görünürlük, standart süreçler ve şube bazlı performans analizleriyle ağınızı büyütün.
                            </p>
                            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
                                <li className="flex items-center gap-2">✓ Çok şubeli merkezi yönetim</li>
                                <li className="flex items-center gap-2">✓ Danışman performans takibi</li>
                                <li className="flex items-center gap-2">✓ Şubeler arası lead yönlendirme</li>
                                <li className="flex items-center gap-2">✓ Standart journey şablonları</li>
                                <li className="flex items-center gap-2">✓ Gerçek zamanlı raporlama</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="bg-white py-16 md:py-24 px-4 md:px-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-xs font-bold text-[#085041] tracking-[0.2em] mb-4">NASIL ÇALIŞIR</div>
                    <h2 className="text-2xl md:text-4xl font-medium text-[#1A1A1A] mb-8">3 adımda başlayın</h2>
                    <div className="divide-y divide-[#E8F5F0]">
                        <div className="flex gap-5 py-6 items-start">
                            <div className="w-9 h-9 rounded-full bg-[#085041] text-[#9FE1CB] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">01</div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1A1A1A] mb-1.5">Portföyünüzü aktarın</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">Mevcut mülk ve müşteri verilerinizi Excel, CSV veya entegrasyon yoluyla dakikalar içinde aktarın. AI verilerinizi otomatik kategorize eder.</p>
                            </div>
                        </div>
                        <div className="flex gap-5 py-6 items-start">
                            <div className="w-9 h-9 rounded-full bg-[#085041] text-[#9FE1CB] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">02</div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1A1A1A] mb-1.5">AI modelinizi eğitin</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">Geçmiş satış verilerinizle kişiselleştirilmiş AI modeliniz oluşturulur. Ne kadar çok veri, o kadar doğru tahmin.</p>
                            </div>
                        </div>
                        <div className="flex gap-5 py-6 items-start">
                            <div className="w-9 h-9 rounded-full bg-[#085041] text-[#9FE1CB] text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">03</div>
                            <div>
                                <h3 className="text-base font-semibold text-[#1A1A1A] mb-1.5">Satışlarınızı büyütün</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">Akıllı öneriler, otomatik takipler ve bölge analizleriyle daha az çabayla daha fazla satış kapatın.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* FINAL CTA */}
            <section className="bg-[#085041] py-16 md:py-20 px-4 md:px-10 text-center text-white relative">
                <div className="max-w-3xl mx-auto relative z-10">
                    <h2 className="text-2xl md:text-4xl font-medium mb-4 leading-tight">
                        Gayrimenkulde <em className="text-[#EF9F27] not-italic font-normal">AI avantajını</em> ilk siz kullanın
                    </h2>
                    <p className="text-sm md:text-base text-[#9FE1CB] mb-8 max-w-xl mx-auto leading-relaxed">
                        Oikos CRM hakkında bilgi almak ve ürünü yakından tanımak için bizimle iletişime geçin.
                    </p>
                    <button 
                        className="bg-[#EF9F27] hover:bg-[#FAC775] text-[#412402] px-8 py-3.5 rounded-lg text-base font-semibold transition-colors cursor-pointer"
                        onClick={() => setIsModalOpen(true)}
                    >
                        İletişime geçin →
                    </button>
                </div>
            </section>

            {/* İLETİŞİM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <button 
                            className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center font-bold border-none cursor-pointer transition-colors"
                            onClick={closeModal}
                        >
                            ✕
                        </button>
                        
                        {!isSubmitted ? (
                            <form onSubmit={handleSubmit} className="p-6 md:p-8">
                                <h3 className="text-xl md:text-2xl font-bold text-[#085041] mb-2">Oikos CRM hakkında bilgi alın</h3>
                                <p className="text-sm text-gray-500 mb-6">Formu doldurun, ekibimiz en kısa sürede sizinle iletişime geçsin.</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ad Soyad *</label>
                                        <input 
                                            type="text" 
                                            id="f-name"
                                            required 
                                            placeholder="Adınız Soyadınız" 
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Şirket / Ofis adı</label>
                                        <input 
                                            type="text" 
                                            id="f-company"
                                            placeholder="Şirket adı" 
                                            value={formData.company}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-posta *</label>
                                        <input 
                                            type="email" 
                                            id="f-email"
                                            required 
                                            placeholder="ornek@sirket.com" 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Telefon</label>
                                        <input 
                                            type="tel" 
                                            id="f-phone"
                                            placeholder="+90 5xx xxx xx xx" 
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Şirket türü</label>
                                    <select 
                                        id="f-type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="Bireysel danışman">Bireysel danışman</option>
                                        <option value="Gayrimenkul ofisi">Gayrimenkul ofisi</option>
                                        <option value="Franchise / Zincir ofis">Franchise / Zincir ofis</option>
                                        <option value="Kurumsal / Holding">Kurumsal / Holding</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Konu</label>
                                    <select 
                                        id="f-subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all"
                                    >
                                        <option value="">Seçiniz...</option>
                                        <option value="Ürün hakkında bilgi almak istiyorum">Ürün hakkında bilgi almak istiyorum</option>
                                        <option value="Fiyatlandırma hakkında bilgi almak istiyorum">Fiyatlandırma hakkında bilgi almak istiyorum</option>
                                        <option value="Teknik entegrasyon sorusu">Teknik entegrasyon sorusu</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mesajınız</label>
                                    <textarea 
                                        id="f-message"
                                        placeholder="Bize iletmek istediğiniz konu veya sorunuzu yazın..." 
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-[#D8F0E8] focus:border-[#085041] rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-[#085041] transition-all min-h-[80px] resize-y"
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-3 bg-[#085041] hover:bg-[#0F6E56] text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? 'Gönderiliyor...' : 'Gönder →'}
                                </button>
                            </form>
                        ) : (
                            <div className="p-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-[#E1F5EE] text-[#085041] rounded-full flex items-center justify-center mx-auto text-3xl">✓</div>
                                <h4 className="text-xl font-bold text-[#085041]">Mesajınız alındı!</h4>
                                <p className="text-sm text-gray-600 leading-relaxed max-w-sm mx-auto">
                                    En kısa sürede sizinle iletişime geçeceğiz.<br />Oikos CRM ekibi olarak teşekkür ederiz.
                                </p>
                                <button 
                                    onClick={closeModal} 
                                    className="mt-6 px-6 py-2 bg-[#085041] hover:bg-[#0F6E56] text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                                >
                                    Kapat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
