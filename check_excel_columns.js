const XLSX = require('xlsx');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
    console.log('Kullanım: node check_excel_columns.js "C:\\path\\to\\file.xlsx"');
    process.exit(1);
}

const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

if (data.length === 0) {
    console.log('❌ Dosya boş veya okunamadı.');
    process.exit(1);
}

console.log('\n📊 Excel Sütun Adları (1. satır):');
Object.keys(data[0]).forEach(col => {
    console.log(`   "${col}"`);
});

console.log('\n📋 İlk 2 satır örnek:');
data.slice(0, 2).forEach((row, i) => {
    console.log(`\n  Satır ${i + 1}:`, JSON.stringify(row, null, 2));
});
