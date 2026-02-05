const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const EXCEL_FILE_NAME = 'Kontaklar - Tüm Kontaklar.xlsx';
const TENANT_ID = '89b2829e-fc21-477e-8fd8-9f9f0c587e81';
const USER_ID = '60925a94-8539-484d-843d-a11ae0e00ddd'; // Cengiz Korkmaz profile

// --- LOAD ENVIRONMENT ---
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
    envContent.split('\n')
        .filter(line => line.includes('='))
        .map(line => line.split('=').map(s => s.trim()))
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// --- UTILS ---
function standardizeTRPhone(input) {
    if (!input) return null;
    let digits = String(input).replace(/\D/g, '');

    if (digits.length === 10 && digits.startsWith('5')) {
        return digits;
    } else if (digits.length === 11 && digits.startsWith('05')) {
        return digits.substring(1);
    } else if (digits.length === 12 && digits.startsWith('905')) {
        return digits.substring(2);
    } else if (digits.length >= 13 && digits.includes('905')) {
        const index = digits.indexOf('5');
        if (index !== -1 && digits.substring(index).length === 10) {
            return digits.substring(index);
        }
    }
    if (digits.length === 10) return digits;
    return null;
}

function convertExcelDate(excelDate) {
    if (!excelDate) return new Date().toISOString();
    if (typeof excelDate === 'number' && excelDate > 20000) {
        const date = new Date((excelDate - 25569) * 86400 * 1000);
        return date.toISOString();
    }
    const d = new Date(excelDate);
    return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

// --- MAIN PROCESS ---
async function runImport() {
    console.log(`Starting import from: ${EXCEL_FILE_NAME}`);

    const filePath = path.join(__dirname, '..', EXCEL_FILE_NAME);
    if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found at ${filePath}`);
        return;
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
        console.error('Error: File is empty or has no data rows.');
        return;
    }

    const headers = rows[0].map(h => String(h).trim());
    const gsmIdx = headers.indexOf('GSM');
    const nameIdx = headers.indexOf('Ad Soyad');
    const dateIdx = headers.indexOf('Kayıt Tarihi');
    const sourceIdx = headers.indexOf('Kaynak');
    const noteIdx = headers.indexOf('Not');

    if (gsmIdx === -1 || nameIdx === -1) {
        console.error('Error: Required columns (GSM, Ad Soyad) not found.');
        return;
    }

    let successCount = 0;
    let skipCount = 0;

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const rawGsm = row[gsmIdx];
        const rawName = row[nameIdx];
        const rawDate = row[dateIdx];
        const rawSource = row[sourceIdx] || 'Excel Import';
        const rawNote = row[noteIdx];

        const phone = standardizeTRPhone(rawGsm);
        if (!phone) {
            console.log(`Row ${i + 1}: Skipping (Invalid Phone: ${rawGsm})`);
            skipCount++;
            continue;
        }

        const name = rawName && String(rawName).trim() ? String(rawName).trim() : 'İsimsiz Müşteri';
        const createdAt = convertExcelDate(rawDate);

        // 1. Manual Check for Existing Customer by Phone
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('phone', phone)
            .eq('tenant_id', TENANT_ID)
            .maybeSingle();

        let customerId;

        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Optional: Update name/source if needed, but for now we just link the activity
        } else {
            // Create New Customer
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    full_name: name,
                    phone: phone,
                    source: rawSource,
                    tenant_id: TENANT_ID,
                    created_at: createdAt
                })
                .select('id')
                .single();

            if (customerError) {
                console.error(`Row ${i + 1}: Customer Insert Error: ${customerError.message}`);
                continue;
            }
            customerId = newCustomer.id;
        }

        // 2. Create Activity if Note exists
        if (rawNote && String(rawNote).trim()) {
            const noteContent = String(rawNote).trim();

            // Check for existing activity to avoid duplicates
            const { data: existingAct } = await supabase
                .from('activities')
                .select('id')
                .eq('customer_id', customerId)
                .eq('summary', 'Excel Import Notu')
                .limit(1);

            if (!existingAct || existingAct.length === 0) {
                const { error: actError } = await supabase
                    .from('activities')
                    .insert({
                        tenant_id: TENANT_ID,
                        customer_id: customerId,
                        user_id: USER_ID,
                        owner_id: USER_ID,
                        assigned_by_id: USER_ID,
                        topic: 'General',
                        type: 'Call',
                        summary: 'Excel Import Notu',
                        description: noteContent,
                        notes: noteContent,
                        status: 'Completed',
                        outcome: 'Success',
                        completed_at: createdAt,
                        due_date: createdAt,
                        done_at: createdAt,
                        created_at: createdAt
                    });

                if (actError) {
                    console.error(`Row ${i + 1}: Activity Error: ${actError.message}`);
                }
            }
        }

        successCount++;
        if (successCount % 10 === 0) {
            console.log(`Processed ${successCount} rows...`);
        }
    }

    console.log(`\nImport Completed!`);
    console.log(`Success: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
}

runImport();
