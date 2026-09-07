import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// 1. Data rows for Sheet 1 (Sonlandirilmis_Satislar)
const sampleSalesData = [
  {
    "Musteri_Ad_Soyad": "Murat Demir",
    "Telefon": "0532 111 22 33",
    "Eposta": "murat.demir@gmail.com",
    "TCKN_VergiNo": "12345678901",
    "Musteri_Kaynagi": "Referans / Tavsiye",
    "Proje_Adi": "NOVO PARK 4 KOCAELİ",
    "Blok_No": "A Blok",
    "Unite_No": "Daire 14",
    "Unite_Tipi": "2+1",
    "Satis_Tarihi": "2024-03-15",
    "Sozlesme_No": "SZL-2024-042",
    "Satis_Bedeli": 4500000,
    "Para_Birimi": "TRY",
    "Odeme_Turu": "Peşin",
    "Pesinat_Tutari": 4500000,
    "Tahsil_Edilen_Toplam": 4500000,
    "Taksit_Sayisi": 0,
    "Ilk_Taksit_Tarihi": "",
    "Taksit_Araligi_Ay": "",
    "Satis_Temsilcisi": "Burak Kotaman",
    "Aciklama_Notlar": "Tamamı peşin kapatıldı, tapu devri yapıldı."
  },
  {
    "Musteri_Ad_Soyad": "Ayşe Kaya",
    "Telefon": "0542 222 33 44",
    "Eposta": "ayse.kaya@outlook.com",
    "TCKN_VergiNo": "23456789012",
    "Musteri_Kaynagi": "Ofis Ziyareti",
    "Proje_Adi": "NOVO CITY İZMİR",
    "Blok_No": "B Blok",
    "Unite_No": "Daire 28",
    "Unite_Tipi": "3+1",
    "Satis_Tarihi": "2024-05-10",
    "Sozlesme_No": "SZL-2024-068",
    "Satis_Bedeli": 6800000,
    "Para_Birimi": "TRY",
    "Odeme_Turu": "Vadeli",
    "Pesinat_Tutari": 2000000,
    "Tahsil_Edilen_Toplam": 3600000,
    "Taksit_Sayisi": 12,
    "Ilk_Taksit_Tarihi": "2024-06-15",
    "Taksit_Araligi_Ay": 1,
    "Satis_Temsilcisi": "Aytuğ Dikbaşer",
    "Aciklama_Notlar": "Peşinat ödendi, ilk 4 taksit tahsil edildi. Kalan 8 taksit vadeli tahsilat takviminde."
  },
  {
    "Musteri_Ad_Soyad": "Eren Teknoloji A.Ş. (Yetkili: Selim Eren)",
    "Telefon": "0555 333 44 55",
    "Eposta": "muhasebe@erentech.com",
    "TCKN_VergiNo": "0123456789",
    "Musteri_Kaynagi": "Acenta / Broker",
    "Proje_Adi": "NOVO PARK MONTENEGRO",
    "Blok_No": "A Blok",
    "Unite_No": "102",
    "Unite_Tipi": "1+1",
    "Satis_Tarihi": "2024-06-20",
    "Sozlesme_No": "SZL-2024-091",
    "Satis_Bedeli": 120000,
    "Para_Birimi": "EUR",
    "Odeme_Turu": "Vadeli",
    "Pesinat_Tutari": 40000,
    "Tahsil_Edilen_Toplam": 60000,
    "Taksit_Sayisi": 8,
    "Ilk_Taksit_Tarihi": "2024-07-20",
    "Taksit_Araligi_Ay": 1,
    "Satis_Temsilcisi": "Selin Korkmaz",
    "Aciklama_Notlar": "Montenegro yatırımı. Euro bazlı sözleşme, her ay 10.000 EUR taksit."
  },
  {
    "Musteri_Ad_Soyad": "Mehmet Çetin",
    "Telefon": "0533 444 55 66",
    "Eposta": "mehmet.cetin@gmail.com",
    "TCKN_VergiNo": "34567890123",
    "Musteri_Kaynagi": "Instagram Reklamı",
    "Proje_Adi": "Panorama Residence",
    "Blok_No": "1. Etap",
    "Unite_No": "Daire 5",
    "Unite_Tipi": "3+1",
    "Satis_Tarihi": "2024-07-01",
    "Sozlesme_No": "SZL-2024-114",
    "Satis_Bedeli": 7500000,
    "Para_Birimi": "TRY",
    "Odeme_Turu": "Peşin",
    "Pesinat_Tutari": 7500000,
    "Tahsil_Edilen_Toplam": 7500000,
    "Taksit_Sayisi": 0,
    "Ilk_Taksit_Tarihi": "",
    "Taksit_Araligi_Ay": "",
    "Satis_Temsilcisi": "Burak Aydın",
    "Aciklama_Notlar": "Banka havalesi ile tek seferde ödendi."
  },
  {
    "Musteri_Ad_Soyad": "Fatma Şahin",
    "Telefon": "0544 555 66 77",
    "Eposta": "fatma.sahin@hotmail.com",
    "TCKN_VergiNo": "45678901234",
    "Musteri_Kaynagi": "Web Formu",
    "Proje_Adi": "NOVO PARK VISTA",
    "Blok_No": "A Blok",
    "Unite_No": "A-12",
    "Unite_Tipi": "Villa",
    "Satis_Tarihi": "2024-08-15",
    "Sozlesme_No": "SZL-2024-150",
    "Satis_Bedeli": 12000000,
    "Para_Birimi": "TRY",
    "Odeme_Turu": "Vadeli",
    "Pesinat_Tutari": 3000000,
    "Tahsil_Edilen_Toplam": 3000000,
    "Taksit_Sayisi": 24,
    "Ilk_Taksit_Tarihi": "2024-09-15",
    "Taksit_Araligi_Ay": 1,
    "Satis_Temsilcisi": "Aytül Genç",
    "Aciklama_Notlar": "24 ay şirket içi vadeli villa satışı. 3 Milyon peşinat tahsil edildi."
  },
  {
    "Musteri_Ad_Soyad": "Ali Öztürk",
    "Telefon": "0530 666 77 88",
    "Eposta": "ali.ozturk@gmail.com",
    "TCKN_VergiNo": "56789012345",
    "Musteri_Kaynagi": "Doğrudan Arama",
    "Proje_Adi": "NOVO PARK 1 ETİLİ",
    "Blok_No": "C Blok",
    "Unite_No": "Daire 8",
    "Unite_Tipi": "2+1",
    "Satis_Tarihi": "2024-09-01",
    "Sozlesme_No": "SZL-2024-185",
    "Satis_Bedeli": 5100000,
    "Para_Birimi": "TRY",
    "Odeme_Turu": "Vadeli",
    "Pesinat_Tutari": 1500000,
    "Tahsil_Edilen_Toplam": 2100000,
    "Taksit_Sayisi": 18,
    "Ilk_Taksit_Tarihi": "2024-10-01",
    "Taksit_Araligi_Ay": 1,
    "Satis_Temsilcisi": "Serkan Genç",
    "Aciklama_Notlar": "Peşinat + ilk 3 taksit ödendi. Kalan taksitler aylık düzenli ödeniyor."
  }
];

// 2. Guide sheet data (Rehber_ve_Kurallar)
const guideData = [
  {
    "Kolon Adı": "Musteri_Ad_Soyad",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Müşterinin adı soyadı veya tüzel şirket ünvanı.",
    "Örnek Değer": "Ahmet Yılmaz veya Demir İnşaat A.Ş."
  },
  {
    "Kolon Adı": "Telefon",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Telefon",
    "Açıklama & Kurallar": "Müşterinin birincil iletişim numarası. Sistemde bu telefon varsa müşteri bulunur ve satış o müşteriye bağlanır; yoksa sistem otomatik yeni müşteri kartı açar.",
    "Örnek Değer": "0532 123 45 67 veya +90 532 123 4567"
  },
  {
    "Kolon Adı": "Eposta",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "E-Posta",
    "Açıklama & Kurallar": "Müşteri e-posta adresi. Varsa müşteri profiline işlenir.",
    "Örnek Değer": "ahmet@gmail.com"
  },
  {
    "Kolon Adı": "TCKN_VergiNo",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Sayısal / Metin",
    "Açıklama & Kurallar": "11 haneli TCKN veya 10 haneli Vergi Kimlik Numarası.",
    "Örnek Değer": "12345678901"
  },
  {
    "Kolon Adı": "Musteri_Kaynagi",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Müşterinin şirkete ilk geldiği kanal. CEO Pazarlama ROI analizinde görünür.",
    "Örnek Değer": "Referans / Tavsiye, Ofis Ziyareti, Sahibinden, Meta Reklamı"
  },
  {
    "Kolon Adı": "Proje_Adi",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Satışın yapıldığı proje adı. 'Mevcut_Projeler_ve_Ekip' sayfasındaki isimlerle birebir uyumlu olmalıdır.",
    "Örnek Değer": "NOVO PARK 4 KOCAELİ, NOVO CITY İZMİR"
  },
  {
    "Kolon Adı": "Blok_No",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Ünitenin bulunduğu blok veya etap bilgisi.",
    "Örnek Değer": "A Blok, B Blok, 1. Etap, Villa-1"
  },
  {
    "Kolon Adı": "Unite_No",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Satılan bağımsız bölüm / daire / kapı numarası. Proje envanterinde eşleşirse ünitenin durumu 'Satıldı (Sold)' olarak güncellenir.",
    "Örnek Değer": "Daire 14, 102, B-05"
  },
  {
    "Kolon Adı": "Unite_Tipi",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Daire oda tipi veya gayrimenkul türü.",
    "Örnek Değer": "1+1, 2+1, 3+1, 4+1 Dubleks, Villa, Ticari Dükkan"
  },
  {
    "Kolon Adı": "Satis_Tarihi",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Tarih",
    "Açıklama & Kurallar": "Satışın / sözleşmenin imzalandığı tarih (YYYY-AA-GG veya GG.AA.YYYY). CEO raporlarında cironun kaydedileceği dönemi belirler.",
    "Örnek Değer": "2024-05-15 veya 15.05.2024"
  },
  {
    "Kolon Adı": "Sozlesme_No",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Dışarıdaki sözleşme veya dosya numarası. Boş bırakılırsa sistem otomatik 'SZL-YYYY-XXXX' üretir.",
    "Örnek Değer": "SZL-2024-042"
  },
  {
    "Kolon Adı": "Satis_Bedeli",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Sayısal (Tutar)",
    "Açıklama & Kurallar": "KDV dahil nihai anlaşma / satış tutarı. Nokta veya virgül kullanmadan düz sayı girin.",
    "Örnek Değer": "4500000"
  },
  {
    "Kolon Adı": "Para_Birimi",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Seçim",
    "Açıklama & Kurallar": "Satışın para birimi. Boş bırakılırsa 'TRY' kabul edilir.",
    "Örnek Değer": "TRY, USD, EUR, GBP"
  },
  {
    "Kolon Adı": "Odeme_Turu",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Seçim",
    "Açıklama & Kurallar": "Yalnızca 'Peşin' veya 'Vadeli' yazılmalıdır. Peşin satışlarda taksit planı açılmaz, satış bedelinin tamamı tahsil edilmiş sayılır.",
    "Örnek Değer": "Peşin veya Vadeli"
  },
  {
    "Kolon Adı": "Pesinat_Tutari",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Sayısal (Tutar)",
    "Açıklama & Kurallar": "Satış anında alınan peşinat tutarı. Peşin satışlarda Satış Bedeline eşit olmalıdır. Vadeli satışlarda alınan ilk peşinat yazılır.",
    "Örnek Değer": "1500000"
  },
  {
    "Kolon Adı": "Tahsil_Edilen_Toplam",
    "Zorunlu mu?": "EVET",
    "Veri Tipi": "Sayısal (Tutar)",
    "Açıklama & Kurallar": "Bugüne kadar şirketin kasasına fiilen girmiş toplam nakit (Peşinat + Ödenmiş Taksitler toplamı). Peşin satışta Satış Bedeline eşittir.",
    "Örnek Değer": "2500000"
  },
  {
    "Kolon Adı": "Taksit_Sayisi",
    "Zorunlu mu?": "Vadeli ise EVET",
    "Veri Tipi": "Tamsayı",
    "Açıklama & Kurallar": "Vadeli satışlarda kalan bakiyenin kaç eşit taksite bölündüğü. Peşin satışlarda 0 yazın.",
    "Örnek Değer": "12 veya 24 veya 36"
  },
  {
    "Kolon Adı": "Ilk_Taksit_Tarihi",
    "Zorunlu mu?": "Vadeli ise EVET",
    "Veri Tipi": "Tarih",
    "Açıklama & Kurallar": "Vadeli satışlarda 1. taksitin vadesi. Sistem bu tarihten itibaren her ay için otomatik taksit planı üretir.",
    "Örnek Değer": "2024-06-15 veya 15.06.2024"
  },
  {
    "Kolon Adı": "Taksit_Araligi_Ay",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Tamsayı",
    "Açıklama & Kurallar": "Taksitlerin kaç ayda bir ödeneceği. Boş bırakılırsa her ay (1) kabul edilir.",
    "Örnek Değer": "1 (Aylık) veya 3 (Üç Aylık)"
  },
  {
    "Kolon Adı": "Satis_Temsilcisi",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Satışı gerçekleştiren danışmanın adı soyadı. 'Mevcut_Projeler_ve_Ekip' sayfasından seçebilirsiniz.",
    "Örnek Değer": "Burak Kotaman, Aytuğ Dikbaşer"
  },
  {
    "Kolon Adı": "Aciklama_Notlar",
    "Zorunlu mu?": "HAYIR",
    "Veri Tipi": "Metin",
    "Açıklama & Kurallar": "Satış, müşteri veya ödeme planı ile ilgili ek özel notlar.",
    "Örnek Değer": "Lansman özel kampanyası. Müşteri tapusunu teslim aldı."
  }
];

// 3. Current Projects and Sales Reps Reference Sheet
const referenceProjectsAndTeam = [
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK 4 KOCAELİ", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO CITY İZMİR", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK MONTENEGRO", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK 1 ETİLİ", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "Panorama Residence", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK VISTA", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK VİVA KÖRFEZ", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "Marina Tower", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "Yeşilvadi Evleri", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "Göl Konakları", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Aktif Projeler", "Tanım / İsim": "NOVO PARK 2 YALOVA", "Not": "Sistemde kayıtlı proje" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Burak Kotaman", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Aytuğ Dikbaşer", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Selin Korkmaz", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Burak Aydın", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Aytül Genç", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Serkan Genç", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Zeynep Çelik", "Not": "Satış Ekibi" },
  { "Kategori": "Satış Danışmanları / Temsilciler", "Tanım / İsim": "Ahmet Yılmaz", "Not": "Satış Ekibi" }
];

// Create Workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Main Data Template
const wsSales = XLSX.utils.json_to_sheet(sampleSalesData);
wsSales['!cols'] = [
  { wch: 26 }, // Musteri_Ad_Soyad
  { wch: 18 }, // Telefon
  { wch: 26 }, // Eposta
  { wch: 16 }, // TCKN_VergiNo
  { wch: 22 }, // Musteri_Kaynagi
  { wch: 24 }, // Proje_Adi
  { wch: 12 }, // Blok_No
  { wch: 14 }, // Unite_No
  { wch: 12 }, // Unite_Tipi
  { wch: 14 }, // Satis_Tarihi
  { wch: 16 }, // Sozlesme_No
  { wch: 16 }, // Satis_Bedeli
  { wch: 12 }, // Para_Birimi
  { wch: 14 }, // Odeme_Turu
  { wch: 16 }, // Pesinat_Tutari
  { wch: 20 }, // Tahsil_Edilen_Toplam
  { wch: 14 }, // Taksit_Sayisi
  { wch: 16 }, // Ilk_Taksit_Tarihi
  { wch: 16 }, // Taksit_Araligi_Ay
  { wch: 20 }, // Satis_Temsilcisi
  { wch: 45 }  // Aciklama_Notlar
];
XLSX.utils.book_append_sheet(wb, wsSales, "Sonlandirilmis_Satislar");

// Sheet 2: Guide & Rules
const wsGuide = XLSX.utils.json_to_sheet(guideData);
wsGuide['!cols'] = [
  { wch: 22 }, // Kolon Adı
  { wch: 16 }, // Zorunlu mu?
  { wch: 16 }, // Veri Tipi
  { wch: 65 }, // Açıklama & Kurallar
  { wch: 35 }  // Örnek Değer
];
XLSX.utils.book_append_sheet(wb, wsGuide, "Rehber_ve_Kurallar");

// Sheet 3: Projects & Team Reference
const wsRef = XLSX.utils.json_to_sheet(referenceProjectsAndTeam);
wsRef['!cols'] = [
  { wch: 30 }, // Kategori
  { wch: 30 }, // Tanım / İsim
  { wch: 25 }  // Not
];
XLSX.utils.book_append_sheet(wb, wsRef, "Mevcut_Projeler_ve_Ekip");

// Ensure target dir
const outputDir = path.resolve('public/templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'NovoCRM_Gecmis_Satislar_Yukleme_Sablonu.xlsx');
XLSX.writeFile(wb, outputPath);
console.log('SUCCESS: Excel template generated at:', outputPath);
console.log('File size:', fs.statSync(outputPath).size, 'bytes');
