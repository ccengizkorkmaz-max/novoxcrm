const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    envFileContent.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && rest.length > 0) {
            envConfig[key.trim()] = rest.join('=').trim().replace(/['"]/g, '');
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function normalizePhone(phoneStr) {
    if (!phoneStr) return '';
    let p = String(phoneStr).replace(/\D/g, '');
    if (p.startsWith('90')) p = p.slice(2);
    if (p.startsWith('0')) p = p.slice(1);
    return p;
}

async function fetchAll(table, selectStr) {
    let allData = [];
    let start = 0;
    const limit = 1000;
    while(true) {
        const { data, error } = await supabase.from(table).select(selectStr).range(start, start + limit - 1);
        if (error) { console.error(error); break; }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < limit) break;
        start += limit;
    }
    return allData;
}

async function processExcel() {
    console.log('Loading Excel file...');
    const excelPath = path.resolve(__dirname, '1 Mart 2026-08.04.xlsx');
    
    if (!fs.existsSync(excelPath)) {
        console.error('Excel file not found:', excelPath);
        return;
    }
    
    const workbook = xlsx.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    console.log(`Read ${data.length} records from Excel.`);
    
    let phoneCol = null;
    let nameCol = null;
    let emailCol = null;
    
    if (data.length > 0) {
        const keys = Object.keys(data[0]);
        phoneCol = keys.find(k => k.toLowerCase().includes('telefon') || k.toLowerCase().includes('phone') || k.toLowerCase().includes('tel') || k.toLowerCase() === 'gsm');
        nameCol = keys.find(k => k.toLowerCase().includes('ad') || k.toLowerCase().includes('isim') || k.toLowerCase().includes('name') || k.toLowerCase().includes('müşteri'));
        emailCol = keys.find(k => k.toLowerCase().includes('e-posta') || k.toLowerCase().includes('eposta') || k.toLowerCase().includes('email'));
    }
    
    console.log(`Identified Columns -> Phone: ${phoneCol}, Name: ${nameCol}, Email: ${emailCol}`);

    console.log('Fetching customers from DB...');
    let customers = await fetchAll('customers', 'id, full_name, phone, email');

    console.log('Fetching broker_leads from DB...');
    let leads = await fetchAll('broker_leads', 'id, full_name, phone, email');

    const existingPhones = new Set();
    const existingEmails = new Set();
    
    const addToSets = (item) => {
        if (item.phone) {
            existingPhones.add(normalizePhone(item.phone));
        }
        if (item.email) {
            existingEmails.add(item.email.toLowerCase().trim());
        }
    };
    
    customers.forEach(addToSets);
    leads.forEach(addToSets);

    console.log(`Loaded ${customers.length} customers and ${leads.length} broker_leads.`);
    console.log(`Unique existing phones: ${existingPhones.size}, existing emails: ${existingEmails.size}`);

    const existingRecords = [];
    const newRecords = [];

    let checkedCount = 0;
    
    data.forEach(row => {
        if (!row) return;
        
        let rowPhone = phoneCol ? String(row[phoneCol] || '') : '';
        let rowEmail = emailCol ? String(row[emailCol] || '') : '';
        let rowName = nameCol ? String(row[nameCol] || '') : '';
        
        let normalizedPhone = normalizePhone(rowPhone);
        let normalizedEmail = rowEmail.toLowerCase().trim();
        
        let exists = false;
        
        if (normalizedPhone && existingPhones.has(normalizedPhone)) {
            exists = true;
        } else if (normalizedEmail && existingEmails.has(normalizedEmail)) {
            exists = true;
        }
        
        const record = {
            Name: rowName,
            Phone: rowPhone,
            NormalizedPhone: normalizedPhone,
            Email: rowEmail,
            ...row
        };
        
        if (!rowPhone && !rowEmail && !rowName && Object.keys(row).length <= 2) return;
        checkedCount++;
        
        if (exists) {
            existingRecords.push(record);
        } else {
            newRecords.push(record);
        }
    });

    console.log(`\n--- SUMMARY ---`);
    console.log(`Total valid records checked: ${checkedCount}`);
    console.log(`Records already in DB: ${existingRecords.length}`);
    console.log(`Records NOT in DB (New): ${newRecords.length}`);

    if (newRecords.length > 0) {
        console.log('\n--- NEW RECORDS (Sample of 10) ---');
        newRecords.slice(0, 10).forEach(r => {
            console.log(`Name: ${r.Name}, Phone: ${r.Phone}, Email: ${r.Email}`);
        });
    }
    
    const newRecordsPath = path.resolve(__dirname, 'missing_leads_from_excel.json');
    fs.writeFileSync(newRecordsPath, JSON.stringify(newRecords, null, 2));
    
    // Also save as an artifact
    const artifactPath = path.resolve(__dirname, 'missing_leads_from_excel.csv');
    let csvHeader = "Name,Phone,Email\n";
    let csvContent = csvHeader + newRecords.map(r => `"${r.Name || ''}","${r.Phone || ''}","${r.Email || ''}"`).join('\n');
    fs.writeFileSync(artifactPath, "\uFEFF" + csvContent, 'utf8'); // BOM for excel
    
    console.log(`\nSaved full list of ${newRecords.length} new records to ${newRecordsPath}.`);
}

processExcel().catch(console.error);
