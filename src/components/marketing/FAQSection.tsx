
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
    {
        question: "Mevcut Excel verilerimi aktarabilir miyim?",
        answer: "Evet! Excel şablonumuzla mevcut müşteri datanızı, stok listenizi ve aktif satışlarınızı toplu olarak sisteme yükleyebilirsiniz. Ekibimiz bu süreçte size destek olmaktadır."
    },
    {
        question: "Kurulum süreci ne kadar sürer?",
        answer: "NovoxCRM bulut tabanlı bir sistemdir, kurulum gerektirmez. Hesabınız açıldığı an kullanmaya başlayabilirsiniz. Personelinizin eğitimi ve tam adaptasyon genellikle 1-2 iş günü sürer."
    },
    {
        question: "Verilerimiz ne kadar güvende?",
        answer: "Verileriniz 256-bit SSL şifreleme ile korunur ve günlük olarak otomatik yedeklenir. Bankacılık standartlarında güvenlik önlemleri ile KVKK uyumlu bir altyapı sunuyoruz."
    },
    {
        question: "Sistemi kullanmak için teknik bilgi gerekiyor mu?",
        answer: "Hayır. Arayüzümüz, herhangi bir teknik bilgiye ihtiyaç duymadan, satış danışmanlarının ve yöneticilerin kolayca kullanabileceği şekilde tasarlanmıştır."
    },
    {
        question: "Mobil uygulamanız var mı?",
        answer: "Evet, tüm cihazlarla uyumlu responsive (mobil uyumlu) arayüzümüz sayesinde telefon veya tabletinizden sisteme erişebilir, sahada veya ofis dışında işlerinizi yönetebilirsiniz."
    },
    {
        question: "Özel bir rapor veya özellik isteyebilir miyiz?",
        answer: "Enterprise paketimizde kurumunuza özel geliştirmeler ve raporlamalar yapabiliyoruz. İhtiyaçlarınızı analiz edip size özel çözümler sunabiliriz."
    }
]

export function FAQSection() {
    return (
        <section className="py-24 bg-slate-950 relative border-t border-slate-900" id="faq">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-12 gap-12">
                    <div className="md:col-span-4">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Aklınızda Soru <br /> <span className="text-blue-500">Kalmasın</span>
                        </h2>
                        <p className="text-slate-400 mb-8">
                            Sıkça sorulan soruları sizin için derledik. Başka bir sorunuz varsa bizimle iletişime geçmekten çekinmeyin.
                        </p>
                    </div>

                    <div className="md:col-span-8">
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 rounded-xl px-4 bg-slate-900/30 data-[state=open]:bg-slate-900/80 data-[state=open]:border-blue-500/30 transition-all duration-200">
                                    <AccordionTrigger className="text-white hover:text-blue-400 hover:no-underline text-left text-lg font-medium py-6">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-slate-400 text-base pb-6 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
}
