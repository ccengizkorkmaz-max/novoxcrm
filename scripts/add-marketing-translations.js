const fs = require('fs');
const tr = JSON.parse(fs.readFileSync('./messages/tr.json','utf8'));
const en = JSON.parse(fs.readFileSync('./messages/en.json','utf8'));

tr.PlatformPower = {
    badge: "Platform Gücü",
    title: "Sadece bir CRM değil.",
    titleHighlight: "Eksiksiz Satış Platformu.",
    description: "Novo CRM, inşaat ve gayrimenkul sektörü için tasarlanmış en kapsamlı dijital satış platformudur. AI destekli sesli arama, WhatsApp otomasyonu ve broker ağı yönetimi ile sektörde benzersiz bir konumdadır.",
    stats: {
        modules: "Entegre Modül",
        modulesDesc: "CRM, Finans, HR, Outreach, Brokerage...",
        aiEngines: "AI Motor",
        aiEnginesDesc: "Chat, Match, Voice, TTS, Insights",
        channels: "İletişim Kanalı",
        channelsDesc: "AI Call, WhatsApp, SMS, E-posta",
        seoPages: "Aktif Sayfa",
        seoPagesDesc: "SEO optimize, çok dilli platform"
    },
    channelsTitle: "Tüm İletişim Kanalları Tek Platformda",
    channelsDesc: "Müşterilerinize tercih ettikleri kanaldan ulaşın — hepsi AI destekli.",
    channelNames: {
        aiCall: "AI Sesli Arama",
        whatsapp: "WhatsApp",
        sms: "SMS",
        email: "E-posta"
    },
    allAiPowered: "Tüm kanallar AI ile güçlendirilmiştir"
};

tr.OutreachShowcase = {
    badge: "Outreach Otomasyon",
    title: "Müşteriye ulaşmak için",
    titleHighlight: "tek bir tıklama yeterli.",
    description: "Satış ekibiniz müşteri peşinde koşmasın. AI asistanlarınız otomatik olarak arasın, WhatsApp mesajı göndersin, SMS ile hatırlatsın. Siz sadece ilgilenen müşteriyle ilgilenin.",
    steps: {
        segment: { title: "Hedef Kitle", desc: "Dinamik filtrelerle segment oluştur" },
        aiCall: { title: "AI Arama", desc: "Yapay zeka otomatik arasın" },
        whatsapp: { title: "WhatsApp", desc: "Template mesaj gönder" },
        sms: { title: "SMS", desc: "Kısa mesaj ile hatırlat" },
        wait: { title: "Bekle", desc: "Akıllı zamanlama ile bekle" },
        convert: { title: "Dönüştür", desc: "İlgilenen müşteriyi yakala" }
    },
    features: {
        workflow: "Sürükle-bırak akış tasarımı",
        aiVoice: "Türkçe AI sesli asistan",
        schedule: "Çalışma saati kontrolü",
        retry: "Akıllı yeniden deneme",
        branch: "Koşullu dallanma",
        realtime: "Anlık sonuç takibi"
    }
};

en.PlatformPower = {
    badge: "Platform Power",
    title: "Not just a CRM.",
    titleHighlight: "A Complete Sales Platform.",
    description: "Novo CRM is the most comprehensive digital sales platform designed for the construction and real estate industry. Uniquely positioned with AI-powered voice calls, WhatsApp automation, and broker network management.",
    stats: {
        modules: "Integrated Modules",
        modulesDesc: "CRM, Finance, HR, Outreach, Brokerage...",
        aiEngines: "AI Engines",
        aiEnginesDesc: "Chat, Match, Voice, TTS, Insights",
        channels: "Communication Channels",
        channelsDesc: "AI Call, WhatsApp, SMS, Email",
        seoPages: "Active Pages",
        seoPagesDesc: "SEO optimized, multilingual platform"
    },
    channelsTitle: "All Channels in One Platform",
    channelsDesc: "Reach your customers through their preferred channel \u2014 all AI-powered.",
    channelNames: {
        aiCall: "AI Voice Call",
        whatsapp: "WhatsApp",
        sms: "SMS",
        email: "Email"
    },
    allAiPowered: "All channels are powered by AI"
};

en.OutreachShowcase = {
    badge: "Outreach Automation",
    title: "One click to reach",
    titleHighlight: "every customer.",
    description: "Your sales team should not chase leads. Let AI assistants auto-call, send WhatsApp messages, and SMS reminders. You only deal with interested prospects.",
    steps: {
        segment: { title: "Audience", desc: "Create segments with dynamic filters" },
        aiCall: { title: "AI Call", desc: "Let AI make the call" },
        whatsapp: { title: "WhatsApp", desc: "Send template messages" },
        sms: { title: "SMS", desc: "Remind via text message" },
        wait: { title: "Wait", desc: "Smart scheduling and delays" },
        convert: { title: "Convert", desc: "Capture interested leads" }
    },
    features: {
        workflow: "Drag-and-drop flow builder",
        aiVoice: "Turkish AI voice assistant",
        schedule: "Working hours control",
        retry: "Smart retry logic",
        branch: "Conditional branching",
        realtime: "Real-time tracking"
    }
};

fs.writeFileSync('./messages/tr.json', JSON.stringify(tr, null, 4), 'utf8');
fs.writeFileSync('./messages/en.json', JSON.stringify(en, null, 4), 'utf8');
console.log('Done');
