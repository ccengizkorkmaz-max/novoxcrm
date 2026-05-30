import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { turkishCities } from '../src/data/cities-data';
import { comparisons } from '../src/data/comparisons-data';

// 1. Check Key
const keyFilePath = path.join(process.cwd(), 'google-indexer-key.json');
if (!fs.existsSync(keyFilePath)) {
    console.error("ERROR: google-indexer-key.json not found.");
    process.exit(1);
}

// 2. Prepare Retry URLs
// We will send 81 cities + 19 comparisons ONLY for oikoscrm.com
const domains = ['https://oikoscrm.com'];
const urlsToSubmit: string[] = [];

// 81 Cities
for (const city of turkishCities) {
    for (const domain of domains) {
        urlsToSubmit.push(`${domain}/sehir/${city.slug}`);
    }
}

// 19 Comparisons
for (const comp of comparisons) {
    for (const domain of domains) {
        urlsToSubmit.push(`${domain}/karsilastirma/${comp.slug}`);
    }
}

console.log(`\n📋 BATCH 4 RETRY - URLs to submit (${urlsToSubmit.length}):`);
urlsToSubmit.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
console.log('');

// 3. Authenticate
const auth = new google.auth.GoogleAuth({
    keyFile: keyFilePath,
    scopes: ['https://www.googleapis.com/auth/indexing'],
});

async function submitUrls() {
    console.log(`Submitting ${urlsToSubmit.length} URLs to Google Indexing API...\n`);

    let authClient;
    try {
        authClient = await auth.getClient();
    } catch (e: any) {
        console.error("Auth Error:", e.message);
        process.exit(1);
    }

    const indexing = google.indexing({ version: 'v3', auth: authClient as any });

    let successCount = 0;
    let failCount = 0;

    for (const url of urlsToSubmit) {
        try {
            await indexing.urlNotifications.publish({
                requestBody: { url, type: 'URL_UPDATED' },
            });
            console.log(`✅ [SUCCESS] ${url}`);
            successCount++;
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;
            console.error(`❌ [ERROR] ${url} -> ${errMsg}`);
            failCount++;
        }
        // Delay to prevent rate limit
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 RETRY RESULT: ${successCount} successful / ${failCount} failed / ${urlsToSubmit.length} total`);
    console.log(`${'='.repeat(60)}\n`);
}

submitUrls();
