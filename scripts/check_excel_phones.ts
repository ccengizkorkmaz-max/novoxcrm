import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function standardizeTRPhone(input: any): string | null {
    if (!input) return null;
    let digits = String(input).replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('5')) return digits;
    if (digits.length === 11 && digits.startsWith('05')) return digits.substring(1);
    if (digits.length === 12 && digits.startsWith('905')) return digits.substring(2);
    if (digits.length >= 13 && digits.includes('905')) {
        const index = digits.indexOf('5');
        if (index !== -1 && digits.substring(index).length === 10) return digits.substring(index);
    }
    if (digits.length === 10) return digits;
    return null;
}

async function run() {
    console.log("Veritabanındaki müşteriler okunuyor...");
    const allPhones = new Set<string>();
    let page = 0;
    while(true) {
        const { data } = await supabase.from('customers').select('phone').range(page*1000, (page+1)*1000-1);
        if (!data || data.length === 0) break;
        data.forEach(c => {
            if (c.phone) {
                const std = standardizeTRPhone(c.phone);
                if (std) allPhones.add(std);
            }
        });
        page++;
    }
    console.log(`Sistemde toplam ${allPhones.size} benzersiz telefon numarası bulundu.\n`);

    const filePath = 'c:\\NOVOCRM\\2026 NOVO META ADS_POTANSİYEL MÜŞTERİLER.xlsx';
    console.log(`Excel dosyası okunuyor: ${filePath}...`);
    const workbook = XLSX.readFile(filePath);
    
    const missingRecords = [];
    const results: any = {};
    let totalExcelRecords = 0;
    let totalVarolan = 0;

    for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        if (!rows || rows.length === 0) continue;

        let phoneIdx = -1;
        let nameIdx = -1;
        
        // Find phone and name columns in header
        const firstRow = rows[0].map(cell => String(cell).toLowerCase().trim());
        firstRow.forEach((header, idx) => {
            if (['telefon', 'phone', 'tel', 'mobile', 'cep', 'gsm'].some(k => header.includes(k))) {
                phoneIdx = idx;
            } else if (['ad', 'isim', 'soyad', 'name', 'full name'].some(k => header.includes(k))) {
                if (nameIdx === -1) nameIdx = idx;
            }
        });

        // if header not found, guess by looking at 2nd/3rd row columns
        if (phoneIdx === -1 && rows.length > 1) {
             for(let i=0; i<rows[1].length; i++) {
                 const std = standardizeTRPhone(rows[1][i]);
                 if (std) { phoneIdx = i; break; }
             }
        }
        if (phoneIdx === -1 && rows.length > 2) {
             for(let i=0; i<rows[2].length; i++) {
                 const std = standardizeTRPhone(rows[2][i]);
                 if (std) { phoneIdx = i; break; }
             }
        }

        // Just use the first column as name if we couldn't find one but found a phone
        if (nameIdx === -1 && phoneIdx > 0) nameIdx = phoneIdx - 1;

        let sheetTotal = 0;
        let sheetFound = 0;
        let sheetMissing = 0;

        let startIndex = 1;
        if (phoneIdx !== -1 && !standardizeTRPhone(rows[1]?.[phoneIdx])) {
            startIndex = 2;
        }

        for (let i = startIndex; i < rows.length; i++) {
            const row = rows[i];
            const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : null;
            if (!rawPhone) continue;
            
            const stdPhone = standardizeTRPhone(rawPhone);
            if (!stdPhone) continue;

            sheetTotal++;
            totalExcelRecords++;
            if (allPhones.has(stdPhone)) {
                sheetFound++;
                totalVarolan++;
            } else {
                sheetMissing++;
                const rawName = nameIdx !== -1 ? row[nameIdx] : 'İsimsiz';
                missingRecords.push({
                    "Ad Soyad": rawName,
                    "Telefon (Orijinal)": rawPhone,
                    "Telefon (Standart)": stdPhone,
                    "Kaynak Sayfa": sheetName,
                    "Orijinal Satır": i + 1
                });
            }
        }

        results[sheetName] = { total: sheetTotal, found: sheetFound, missing: sheetMissing };
    }

    // Export missing records to Excel
    if (missingRecords.length > 0) {
        const outFilePath = 'c:\\NOVOCRM\\OLMAYAN_MUSTERILER.xlsx';
        const outWorkbook = XLSX.utils.book_new();
        const outWorksheet = XLSX.utils.json_to_sheet(missingRecords);
        XLSX.utils.book_append_sheet(outWorkbook, outWorksheet, "Sistemde Olmayanlar");
        XLSX.writeFile(outWorkbook, outFilePath);
        console.log(`\nBAŞARILI: Sistemde bulunmayan ${missingRecords.length} kayıt '${outFilePath}' dosyasına kaydedildi!`);
    }

    console.log("\n========================= SONUÇ =========================");
    for (const [sheet, stats] of Object.entries(results)) {
        console.log(`Sayfa: "${sheet}"`);
        console.log(`  Excel'deki Toplam Telefon Sayısı  : ${(stats as any).total}`);
        console.log(`  Sistemimizde KAYDI BULUNAN        : ${(stats as any).found}`);
        console.log(`  Sistemimizde OLMAYAN (HİÇ DÜŞMEMİŞ) : ${(stats as any).missing}`);
        console.log("---------------------------------------------------------");
    }
    console.log(`\nGENEL TOPLAM: ${totalExcelRecords} numara incelendi, sistemde ${totalVarolan} tanesi bulundu.`);
    console.log("=========================================================");
}
run().catch(console.error);
