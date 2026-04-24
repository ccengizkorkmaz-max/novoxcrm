/**
 * Add completely missing translation keys (not in either file)
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'messages', 'en.json');
const trPath = path.join(__dirname, '..', 'messages', 'tr.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const tr = JSON.parse(fs.readFileSync(trPath, 'utf-8'));

function setNestedValue(obj, keyPath, value) {
    const parts = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

// Keys missing in BOTH files — provide EN and TR values
const missingKeys = {
    // Activities
    "Activities.type.OfficeMeeting": { en: "Office Meeting", tr: "Ofis Toplantısı" },
    "Activities.type.OnlineMeeting": { en: "Online Meeting", tr: "Online Toplantı" },
    "Activities.status.Planned": { en: "Planned", tr: "Planlandı" },
    "Activities.status.Overdue": { en: "Overdue", tr: "Gecikmiş" },
    "Activities.filters.leadStatuses": { en: "Lead Statuses", tr: "Aday Durumları" },
    "Activities.tabs.calendar": { en: "Calendar", tr: "Takvim" },
    "Activities.actions.delete": { en: "Delete", tr: "Sil" },
    "Activities.form.owner": { en: "Owner", tr: "Sorumlu" },
    "Activities.form.selectOwner": { en: "Select Owner", tr: "Sorumlu Seçin" },
    "Activities.form.search": { en: "Search...", tr: "Ara..." },
    "Activities.form.noResults": { en: "No results found.", tr: "Sonuç bulunamadı." },
    "Activities.form.priority": { en: "Priority", tr: "Öncelik" },
    "Activities.form.priorityLow": { en: "Low", tr: "Düşük" },
    "Activities.form.priorityMedium": { en: "Medium", tr: "Orta" },
    "Activities.form.priorityHigh": { en: "High", tr: "Yüksek" },
    "Activities.form.priorityUrgent": { en: "Urgent", tr: "Acil" },
    "Activities.form.reminder": { en: "Reminder", tr: "Hatırlatma" },
    "Activities.topic.Project Interest": { en: "Project Interest", tr: "Proje İlgisi" },

    // BrokerFinances
    "BrokerFinances.table.status.Standart": { en: "Standard", tr: "Standart" },
    "BrokerFinances.stats.countPaymentRecords": { en: "Payment Records", tr: "Ödeme Kayıtları" },
    "BrokerFinances.stats.activeCount": { en: "Active Count", tr: "Aktif Sayısı" },

    // Campaigns
    "Campaigns.actions.endConfirmTitle": { en: "End Campaign", tr: "Kampanyayı Sonlandır" },
    "Campaigns.cancel": { en: "Cancel", tr: "İptal" },
    "Campaigns.actions.ending": { en: "Ending...", tr: "Sonlandırılıyor..." },
    "Campaigns.actions.endConfirmAction": { en: "Yes, End Campaign", tr: "Evet, Sonlandır" },
    "Campaigns.allProjects": { en: "All Projects", tr: "Tüm Projeler" },

    // CommissionSettings
    "CommissionSettings.rateValue": { en: "Rate Value", tr: "Oran Değeri" },
    "CommissionSettings.tiers.deleteConfirmTitle": { en: "Delete Tier", tr: "Kademeyi Sil" },
    "CommissionSettings.cancel": { en: "Cancel", tr: "İptal" },
    "CommissionSettings.deleting": { en: "Deleting...", tr: "Siliniyor..." },
    "CommissionSettings.deleteConfirmAction": { en: "Yes, Delete", tr: "Evet, Sil" },
    "CommissionSettings.unitRules.deleteConfirmTitle": { en: "Delete Unit Rule", tr: "Ünite Kuralını Sil" },

    // BrokerLevels
    "BrokerLevels.deleteConfirmTitle": { en: "Delete Level", tr: "Seviyeyi Sil" },
    "BrokerLevels.cancel": { en: "Cancel", tr: "İptal" },
    "BrokerLevels.deleting": { en: "Deleting...", tr: "Siliniyor..." },
    "BrokerLevels.deleteConfirmAction": { en: "Yes, Delete", tr: "Evet, Sil" },

    // Customers
    "Customers.createModal.submitting": { en: "Saving...", tr: "Kaydediliyor..." },
    "Customers.deleteConfirmTitle": { en: "Delete Customer", tr: "Müşteriyi Sil" },
    "Customers.cancel": { en: "Cancel", tr: "İptal" },
    "Customers.deleting": { en: "Deleting...", tr: "Siliniyor..." },
    "Customers.deleteConfirmAction": { en: "Yes, Delete", tr: "Evet, Sil" },

    // CRM
    "CRM.filters.onlyTodayLeads": { en: "Show Today's Leads Only", tr: "Sadece Bugünkü Lead'ler" },
    "CRM.newSale.createdSuccess": { en: "Sale created successfully.", tr: "Satış başarıyla oluşturuldu." },
    "CRM.actions.leadDetails": { en: "Lead Details", tr: "Talep Detayları" },

    // Deposits
    "Deposits.confirm.delete": { en: "Are you sure you want to delete this deposit?", tr: "Bu kaporayı silmek istediğinize emin misiniz?" },
    "Deposits.messages.deleted": { en: "Deposit deleted successfully.", tr: "Kapora başarıyla silindi." },
    "Deposits.actions.delete": { en: "Delete", tr: "Sil" },

    // Settings
    "Settings.tabs.ai": { en: "AI Settings", tr: "AI Ayarları" },
    "Settings.templates.dialog.updating": { en: "Updating...", tr: "Güncelleniyor..." },
    "Settings.templates.dialog.creating": { en: "Creating...", tr: "Oluşturuluyor..." },
    "Settings.templates.dialog.deleteTitle": { en: "Delete Template", tr: "Şablonu Sil" },
    "Settings.cancel": { en: "Cancel", tr: "İptal" },
    "Settings.deleting": { en: "Deleting...", tr: "Siliniyor..." },
    "Settings.deleteConfirmAction": { en: "Yes, Delete", tr: "Evet, Sil" },

    // Settings permissions
    "Settings.roles.permissions.categories.general": { en: "General", tr: "Genel" },
    "Settings.roles.permissions.categories.crm": { en: "CRM", tr: "CRM" },
    "Settings.roles.permissions.categories.inventory": { en: "Inventory", tr: "Envanter" },
    "Settings.roles.permissions.categories.management": { en: "Management", tr: "Yönetim" },
    "Settings.roles.permissions.viewDashboard": { en: "View Dashboard", tr: "Dashboard Görüntüle" },
    "Settings.roles.permissions.viewSales": { en: "View Sales", tr: "Satışları Görüntüle" },
    "Settings.roles.permissions.editSales": { en: "Edit Sales", tr: "Satışları Düzenle" },
    "Settings.roles.permissions.assignLeads": { en: "Assign Leads", tr: "Lead Ata" },
    "Settings.roles.permissions.claimLeads": { en: "Claim Leads", tr: "Lead Sahiplen" },
    "Settings.roles.permissions.viewInventory": { en: "View Inventory", tr: "Envanteri Görüntüle" },
    "Settings.roles.permissions.editPrices": { en: "Edit Prices", tr: "Fiyat Düzenle" },
    "Settings.roles.permissions.viewHR": { en: "View HR", tr: "İK Görüntüle" },
    "Settings.roles.permissions.exportExcel": { en: "Export to Excel", tr: "Excel'e Aktar" },
    "Settings.roles.permissions.descriptions.viewDashboard.allowed": { en: "Can view all dashboard data", tr: "Tüm dashboard verilerini görebilir" },
    "Settings.roles.permissions.descriptions.viewDashboard.partial": { en: "Can view limited dashboard data", tr: "Sınırlı dashboard verilerini görebilir" },
    "Settings.roles.permissions.descriptions.viewSales.allowed": { en: "Can view all sales data", tr: "Tüm satış verilerini görebilir" },
    "Settings.roles.permissions.descriptions.viewSales.partial": { en: "Can view only own sales", tr: "Yalnızca kendi satışlarını görebilir" },
    "Settings.roles.permissions.descriptions.editSales.allowed": { en: "Can edit all sales", tr: "Tüm satışları düzenleyebilir" },
    "Settings.roles.permissions.descriptions.editSales.partial": { en: "Can edit only own sales", tr: "Yalnızca kendi satışlarını düzenleyebilir" },
    "Settings.roles.permissions.descriptions.assignLeads.allowed": { en: "Can assign leads to team members", tr: "Ekip üyelerine lead atayabilir" },
    "Settings.roles.permissions.descriptions.assignLeads.denied": { en: "Cannot assign leads", tr: "Lead atayamaz" },
    "Settings.roles.permissions.descriptions.claimLeads.allowed": { en: "Can claim unassigned leads", tr: "Atanmamış lead'leri sahiplenebilir" },
    "Settings.roles.permissions.descriptions.viewInventory.allowed": { en: "Can view all inventory", tr: "Tüm envanteri görebilir" },
    "Settings.roles.permissions.descriptions.manageSettings.allowed": { en: "Can manage system settings", tr: "Sistem ayarlarını yönetebilir" },

    // Teams
    "Teams.deleting": { en: "Deleting...", tr: "Siliniyor..." },

    // Guide
    "Guide.backToHome": { en: "Back to Home", tr: "Ana Sayfaya Dön" },
    "Guide.downloadPDF": { en: "Download PDF", tr: "PDF İndir" },
    "Guide.badge": { en: "COMPREHENSIVE GUIDE", tr: "KAPSAMLI REHBER" },
    "Guide.title": { en: "Novo CRM at a Glance", tr: "Bir Bakışta Novo CRM" },
    "Guide.description": { en: "Everything you need to know about Novo CRM in one page.", tr: "Novo CRM hakkında bilmeniz gereken her şey tek sayfada." },

    // Broker apply
    "Broker.apply.messages.codeSent": { en: "Verification code sent to your email.", tr: "Doğrulama kodu e-postanıza gönderildi." },
    "Broker.apply.messages.success": { en: "Your application has been successfully submitted.", tr: "Başvurunuz başarıyla gönderildi." },
    "Broker.apply.success.message": { en: "Your application has been received. We will contact you soon.", tr: "Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz." },
    "Broker.apply.success.back": { en: "Back to Home", tr: "Ana Sayfaya Dön" },

    // Contracts.status (wrong namespace usage in contract-list.tsx)
    "Contracts.status.contractNo": { en: "Contract No", tr: "Sözleşme No" },
    "Contracts.status.date": { en: "Date", tr: "Tarih" },
    "Contracts.status.customer": { en: "Customer", tr: "Müşteri" },
    "Contracts.status.projectUnit": { en: "Project / Unit", tr: "Proje / Ünite" },
    "Contracts.status.amount": { en: "Amount", tr: "Tutar" },
    "Contracts.status.status": { en: "Status", tr: "Durum" },
    "Contracts.status.actions": { en: "Actions", tr: "İşlemler" },
    "Contracts.status.details": { en: "Details", tr: "Detaylar" },
    "Contracts.status.noResults": { en: "No results found.", tr: "Sonuç bulunamadı." },
    "Contracts.status.empty": { en: "No contracts found.", tr: "Sözleşme bulunamadı." },
    "Contracts.table.empty": { en: "No contracts found.", tr: "Sözleşme bulunamadı." },
    "Contracts.table.noResults": { en: "No results found.", tr: "Sonuç bulunamadı." },

    // Offers
    "Offers.table.search": { en: "Search offers...", tr: "Teklif ara..." },
    "Offers.dialog.records": { en: "Records", tr: "Kayıtlar" },
    "Offers.dialog.savingProposal": { en: "Saving proposal...", tr: "Teklif kaydediliyor..." },
    "Offers.dialog.approveConfirmTitle": { en: "Approve Offer", tr: "Teklifi Onayla" },
    "Offers.dialog.approving": { en: "Approving...", tr: "Onaylanıyor..." },
    "Offers.dialog.approveConfirmAction": { en: "Yes, Approve", tr: "Evet, Onayla" },
    "Offers.dialog.depositAmountInfo": { en: "Deposit Amount", tr: "Kapora Tutarı" },
    "Offers.dialog.cancel": { en: "Cancel", tr: "İptal" },
    "Offers.dialog.save": { en: "Save", tr: "Kaydet" },
    "Offers.dialog.addPlan": { en: "Add Payment Plan", tr: "Ödeme Planı Ekle" },
    "Offers.dialog.removePlan": { en: "Remove", tr: "Kaldır" },
    "Offers.dialog.startPlan": { en: "Start Payment Plan", tr: "Ödeme Planı Başlat" },

    // QuickCRM
    "QuickCRM.activityOnlineMeeting": { en: "Online Meeting", tr: "Online Toplantı" },
    "QuickCRM.activityOfficeMeeting": { en: "Office Meeting", tr: "Ofis Toplantısı" },

    // Dashboard
    "Dashboard.status.prospect": { en: "Prospect", tr: "Fırsat" },

    // Sidebar
    "Sidebar.settings": { en: "Settings", tr: "Ayarlar" },

    // Inventory
    "Inventory.types.Villa": { en: "Villa", tr: "Villa" },
    "Inventory.types.Commercial": { en: "Commercial", tr: "Ticari Alan" },

    // SolutionSection
    "SolutionSection.cards.leads.title": { en: "Automatic Lead Capture", tr: "Otomatik Lead Yakalama" },
    "SolutionSection.cards.leads.features": {
        en: ["Facebook Lead Ads integration", "Webform & Email automation", "In the sales funnel within seconds", "Zero data loss guarantee"],
        tr: ["Facebook Lead Ads entegrasyonu", "Webform & E-posta otomasyonu", "Saniyeler içinde satış hunisinde", "Sıfır veri kaybı garantisi"]
    },
};

let enCount = 0, trCount = 0;

for (const [key, values] of Object.entries(missingKeys)) {
    setNestedValue(en, key, values.en);
    setNestedValue(tr, key, values.tr);
    enCount++;
    trCount++;
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 4) + '\n', 'utf-8');
fs.writeFileSync(trPath, JSON.stringify(tr, null, 4) + '\n', 'utf-8');

console.log(`✅ Added ${enCount} keys to en.json and ${trCount} keys to tr.json`);
