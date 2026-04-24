const fs = require('fs');
const tr = JSON.parse(fs.readFileSync('./messages/tr.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));

tr.PricingSection = {
    title: "Şeffaf Fiyatlandırma",
    description: "Gizli maliyet yok. 14 gün ücretsiz deneyin, kredi kartı gerekmez.",
    popularTag: "En Popüler",
    monthly: "Aylık",
    yearly: "Yıllık",
    yearlySave: "%17 Tasarruf",
    perUser: "kullanıcı başına",
    bottomNote: "Tüm planlar 14 gün ücretsiz deneme içerir. İstediğiniz zaman iptal edebilirsiniz. Fiyatlara KDV dahil değildir.",
    plans: {
        starter: {
            name: "Starter",
            price: "₺999",
            yearlyPrice: "₺829",
            period: "/ay",
            description: "Küçük emlak ofisleri ve butik satış ekipleri için temel CRM.",
            features: [
                "CRM & Satış Pipeline",
                "Proje & Envanter Yönetimi (2 proje)",
                "Müşteri Kartları & Aktiviteler",
                "Teklif & Sözleşme Oluşturma",
                "Temel Dashboard & Raporlar",
                "5 Kullanıcıya Kadar",
                "E-posta Bildirimleri"
            ],
            cta: "Ücretsiz Deneyin"
        },
        professional: {
            name: "Professional",
            price: "₺1.999",
            yearlyPrice: "₺1.659",
            period: "/ay",
            description: "AI destekli satış, WhatsApp ve finans yönetimi ile büyüyen ekipler için.",
            features: [
                "Starter dahil her şey",
                "AI Satış Co-Pilot",
                "Akıllı Mülk Eşleştirme (AI)",
                "WhatsApp Entegrasyonu",
                "SMS Gönderimi",
                "Finans & HR Modülü",
                "Sınırsız Proje",
                "Gelişmiş Raporlar",
                "500 AI Kredi/Ay"
            ],
            cta: "Ücretsiz Deneyin"
        },
        business: {
            name: "Business",
            price: "₺3.499",
            yearlyPrice: "₺2.799",
            period: "/ay",
            description: "AI sesli arama, outreach otomasyonu ve broker ağı yönetimi ile tam güç.",
            features: [
                "Professional dahil her şey",
                "Outreach Otomasyon Motoru",
                "AI Sesli Arama (Vapi)",
                "WhatsApp Outreach",
                "Broker Ağı Yönetimi",
                "Komisyon Planları",
                "Lead Pool & Leaderboard",
                "2.000 AI Kredi/Ay",
                "Öncelikli Destek"
            ],
            cta: "Ücretsiz Deneyin"
        },
        enterprise: {
            name: "Enterprise",
            price: "Özel Teklif",
            yearlyPrice: "Özel Teklif",
            period: "",
            description: "Holding yapıları, çoklu marka ve 50+ kullanıcı için özel çözüm.",
            features: [
                "Business dahil her şey",
                "White-Label (Kendi Markanız)",
                "Özel AI Model Eğitimi",
                "ERP & API Entegrasyonları",
                "SLA Garantisi (%99.9)",
                "Sınırsız AI Kredi",
                "Özel Sunucu Seçeneği",
                "Sınırsız Kullanıcı",
                "Dedicated Account Manager"
            ],
            cta: "İletişime Geçin"
        }
    }
};

en.PricingSection = {
    title: "Transparent Pricing",
    description: "No hidden costs. Try free for 14 days, no credit card required.",
    popularTag: "Most Popular",
    monthly: "Monthly",
    yearly: "Yearly",
    yearlySave: "Save 17%",
    perUser: "per user",
    bottomNote: "All plans include a 14-day free trial. Cancel anytime. Prices exclude VAT.",
    plans: {
        starter: {
            name: "Starter",
            price: "$29",
            yearlyPrice: "$24",
            period: "/mo",
            description: "Essential CRM for small real estate offices and boutique sales teams.",
            features: [
                "CRM & Sales Pipeline",
                "Project & Inventory Management (2 projects)",
                "Customer Cards & Activities",
                "Offers & Contract Creation",
                "Basic Dashboard & Reports",
                "Up to 5 Users",
                "Email Notifications"
            ],
            cta: "Start Free Trial"
        },
        professional: {
            name: "Professional",
            price: "$59",
            yearlyPrice: "$49",
            period: "/mo",
            description: "AI-powered sales, WhatsApp and finance management for growing teams.",
            features: [
                "Everything in Starter",
                "AI Sales Co-Pilot",
                "Smart Property Matching (AI)",
                "WhatsApp Integration",
                "SMS Messaging",
                "Finance & HR Module",
                "Unlimited Projects",
                "Advanced Reports",
                "500 AI Credits/Month"
            ],
            cta: "Start Free Trial"
        },
        business: {
            name: "Business",
            price: "$99",
            yearlyPrice: "$79",
            period: "/mo",
            description: "Full power with AI voice calls, outreach automation and broker management.",
            features: [
                "Everything in Professional",
                "Outreach Automation Engine",
                "AI Voice Calls (Vapi)",
                "WhatsApp Outreach",
                "Broker Network Management",
                "Commission Plans",
                "Lead Pool & Leaderboard",
                "2,000 AI Credits/Month",
                "Priority Support"
            ],
            cta: "Start Free Trial"
        },
        enterprise: {
            name: "Enterprise",
            price: "Custom",
            yearlyPrice: "Custom",
            period: "",
            description: "Custom solution for holding companies, multi-brand and 50+ users.",
            features: [
                "Everything in Business",
                "White-Label (Your Brand)",
                "Custom AI Model Training",
                "ERP & API Integrations",
                "SLA Guarantee (99.9%)",
                "Unlimited AI Credits",
                "Dedicated Server Option",
                "Unlimited Users",
                "Dedicated Account Manager"
            ],
            cta: "Contact Us"
        }
    }
};

fs.writeFileSync('./messages/tr.json', JSON.stringify(tr, null, 4), 'utf8');
fs.writeFileSync('./messages/en.json', JSON.stringify(en, null, 4), 'utf8');
console.log('Done');
