/**
 * Fix English values in tr.json to proper Turkish
 */
const fs = require('fs');
const path = require('path');

const trPath = path.join(__dirname, '..', 'messages', 'tr.json');
const tr = JSON.parse(fs.readFileSync(trPath, 'utf-8'));

function setNestedValue(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

const translations = {
    // Inventory.status.Stock was "Stock" (English) 
    "Inventory.status.Stock": "Stok",

    // Settings permissions (copied from EN)
    "Settings.roles.permissions.viewAllSales": "Tüm Satışları Görüntüle",
    "Settings.roles.permissions.createSales": "Satış Oluştur",

    // Broker apply (copied from EN)
    "Broker.apply.success.codeSent": "Doğrulama kodu e-postanıza gönderildi.",
    "Broker.apply.success.success": "Başvurunuz başarıyla gönderildi.",

    // BrokerCampaigns (entire section copied from EN)
    "BrokerCampaigns.title": "Teşvik ve Bonus Kampanyaları",
    "BrokerCampaigns.description": "Broker performansını artırmak için aktif ve gelecek kampanyaları yönetin.",
    "BrokerCampaigns.newCampaign": "Yeni Kampanya Oluştur",
    "BrokerCampaigns.activeCampaigns": "Aktif Kampanyalar",
    "BrokerCampaigns.totalDistributed": "Toplam Dağıtılan",
    "BrokerCampaigns.pastPassive": "Geçmiş / Pasif",
    "BrokerCampaigns.tabs.active": "Aktif Kampanyalar",
    "BrokerCampaigns.tabs.passive": "Geçmiş / Pasif",
    "BrokerCampaigns.pastCampaigns.title": "Geçmiş Kampanyalar",
    "BrokerCampaigns.pastCampaigns.description": "Süresi dolmuş veya sonlandırılmış kampanyalar.",
    "BrokerCampaigns.table.name": "Kampanya Adı",
    "BrokerCampaigns.table.project": "Proje",
    "BrokerCampaigns.table.typeTarget": "Tür / Hedef",
    "BrokerCampaigns.table.bonusValue": "Bonus Değeri",
    "BrokerCampaigns.table.dateRange": "Tarih Aralığı",
    "BrokerCampaigns.table.status": "Durum",
    "BrokerCampaigns.table.actions": "İşlemler",
    "BrokerCampaigns.table.allProjects": "Tüm Projeler",
    "BrokerCampaigns.table.empty": "Bu listede kampanya bulunamadı.",
    "BrokerCampaigns.types.Visits": "Ziyaret",
    "BrokerCampaigns.types.Volume": "Hacim",
    "BrokerCampaigns.types.Unit Sales": "Ünite Satışı",
    "BrokerCampaigns.types.Special": "Özel Bonus",
    "BrokerCampaigns.labels.target": "Hedef",
    "BrokerCampaigns.form.title": "Yeni Teşvik Kampanyası",
    "BrokerCampaigns.form.description": "Brokerleri motive etmek için yeni bir ödül veya bonus programı başlatın.",
    "BrokerCampaigns.form.basicInfo": "Temel Bilgiler",
    "BrokerCampaigns.form.name": "Kampanya Adı *",
    "BrokerCampaigns.form.namePlaceholder": "Örn: Bahar Lansmanı Özel Bonus",
    "BrokerCampaigns.form.terms": "Açıklama / Koşullar",
    "BrokerCampaigns.form.termsPlaceholder": "Kampanya detaylarını ve katılım koşullarını girin...",
    "BrokerCampaigns.form.project": "Geçerli Proje",
    "BrokerCampaigns.form.type": "Kampanya Türü",
    "BrokerCampaigns.form.select": "Seçiniz",
    "BrokerCampaigns.form.targetReward": "Hedef ve Ödül",
    "BrokerCampaigns.form.bonusAmount": "Bonus Tutarı *",
    "BrokerCampaigns.form.targetCount": "Hedef Sayısı (Opsiyonel)",
    "BrokerCampaigns.form.targetCountPlaceholder": "Örn: 3 satış",
    "BrokerCampaigns.form.startDate": "Başlangıç Tarihi",
    "BrokerCampaigns.form.endDate": "Bitiş Tarihi",
    "BrokerCampaigns.form.cancel": "İptal",
    "BrokerCampaigns.form.submit": "Kampanyayı Yayınla",
    "BrokerCampaigns.form.errors.required": "Lütfen gerekli alanları doldurun.",
    "BrokerCampaigns.form.success": "Kampanya başarıyla oluşturuldu.",
    "BrokerCampaigns.form.editTitle": "Kampanyayı Düzenle",
    "BrokerCampaigns.form.editDesc": "{name} kampanyasının detaylarını güncelleyin.",
    "BrokerCampaigns.form.update": "Güncelle",
    "BrokerCampaigns.form.updateSuccess": "Kampanya güncellendi.",
    "BrokerCampaigns.status.active": "Aktif",
    "BrokerCampaigns.status.passive": "Pasif",
    "BrokerCampaigns.actions.confirmEnd": "Bu kampanyayı sonlandırmak istediğinize emin misiniz?",
    "BrokerCampaigns.actions.successEnd": "Kampanya sonlandırıldı.",
    "BrokerCampaigns.actions.menuTitle": "İşlemler",
    "BrokerCampaigns.actions.edit": "Düzenle",
    "BrokerCampaigns.actions.end": "Kampanyayı Sonlandır",
};

let count = 0;
for (const [key, value] of Object.entries(translations)) {
    setNestedValue(tr, key, value);
    count++;
}

fs.writeFileSync(trPath, JSON.stringify(tr, null, 4) + '\n', 'utf-8');
console.log(`✅ Updated ${count} Turkish translations in tr.json`);
