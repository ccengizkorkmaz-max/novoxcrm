/**
 * Google Indexing API — Full Submit Script
 * 
 * Submits ALL pages from both novoxcrm.com and oikoscrm.com
 * to Google Indexing API for crawling/indexing.
 * 
 * Google Indexing API Quota: 200 URLs/day per project
 * Strategy: Prioritize high-value pages first, then run daily for remaining pages.
 * 
 * Usage:
 *   npx tsx scripts/submit-indexing-full.ts                    # Submit top 200 priority URLs
 *   npx tsx scripts/submit-indexing-full.ts --all              # Submit ALL URLs (may take multiple days)
 *   npx tsx scripts/submit-indexing-full.ts --domain novoxcrm  # Only novoxcrm.com
 *   npx tsx scripts/submit-indexing-full.ts --domain oikoscrm  # Only oikoscrm.com
 *   npx tsx scripts/submit-indexing-full.ts --offset 200       # Skip first 200 (resume from day 2)
 *   npx tsx scripts/submit-indexing-full.ts --dry-run           # List URLs without submitting
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { wikiArticles } from '../src/data/wiki-data';
import { turkishCities } from '../src/data/cities-data';
import { comparisons } from '../src/data/comparisons-data';
import { sectors } from '../src/data/sectors-data';
import { aiSolutions } from '../src/data/ai-solutions-data';
import { reports } from '../src/data/reports-data';

// ──────────────────────────────────────────────
// 1. CONFIG & ARGS
// ──────────────────────────────────────────────
const DAILY_QUOTA = 200;
const RATE_LIMIT_MS = 600; // 600ms between requests (safe for 100 req/min)

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SUBMIT_ALL = args.includes('--all');
const domainArg = args.find(a => a.startsWith('--domain='))?.split('=')[1]
    || (args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null);
const offsetArg = args.find(a => a.startsWith('--offset='))?.split('=')[1]
    || (args.includes('--offset') ? args[args.indexOf('--offset') + 1] : null);
const OFFSET = offsetArg ? parseInt(offsetArg, 10) : 0;

// ──────────────────────────────────────────────
// 2. KEY FILE CHECK
// ──────────────────────────────────────────────
const keyFilePath = path.join(process.cwd(), 'google-indexer-key.json');
if (!fs.existsSync(keyFilePath)) {
    console.error("❌ HATA: google-indexer-key.json dosyası bulunamadı.");
    console.error("   Lütfen Google Cloud Service Account JSON dosyasını ana dizine ekleyin.");
    console.error("   Rehber: https://developers.google.com/search/apis/indexing-api/v3/prereqs");
    process.exit(1);
}

// ──────────────────────────────────────────────
// 3. DOMAIN CONFIGURATION
// ──────────────────────────────────────────────
const ALL_DOMAINS = ['https://novoxcrm.com', 'https://oikoscrm.com'];
const domains = domainArg
    ? ALL_DOMAINS.filter(d => d.includes(domainArg))
    : ALL_DOMAINS;

if (domains.length === 0) {
    console.error(`❌ Geçersiz domain: ${domainArg}. Kullanılabilir: novoxcrm, oikoscrm`);
    process.exit(1);
}

// ──────────────────────────────────────────────
// 4. BUILD URL LIST (prioritized)
// ──────────────────────────────────────────────
interface UrlEntry {
    url: string;
    priority: number; // higher = more important
    category: string;
}

function buildUrlList(): UrlEntry[] {
    const entries: UrlEntry[] = [];

    for (const domain of domains) {
        // ── Priority 1: Core Marketing Pages (highest value) ──
        const corePages = [
            '', '/solutions', '/solutions/gayrimenkul-crm', '/solutions/insaat-crm',
            '/wiki', '/system-details', '/bir-bakista-novocrm',
            '/broker/apply', '/payment-plan-calculator',
            '/ebooks/gayrimenkul-projelerinde-dijital-donusum-rehberi',
            '/tools/tapu-harci-hesaplayici', '/tools/serefiye-hesaplayici',
            '/tools/emlak-vergisi-hesaplayici', '/tools/konut-kredisi-karsilastirma',
            '/tools/broker-komisyon-hesaplayici', '/tools/damga-vergisi-hesaplayici',
            '/tools/insaat-maliyet-hesaplayici', '/tools/metrekare-birim-fiyat',
            '/tools/yatirim-getirisi-hesaplayici', '/tools/kira-getirisi-hesaplayici',
            '/industry-reports', '/login',
        ];
        for (const page of corePages) {
            entries.push({ url: `${domain}${page || '/'}`, priority: 100, category: 'Core' });
            entries.push({ url: `${domain}/en${page}`, priority: 90, category: 'Core EN' });
        }

        // ── Priority 2: AI Solutions ──
        for (const sol of aiSolutions) {
            entries.push({ url: `${domain}/solutions/${sol.slug}`, priority: 85, category: 'AI Solution' });
            entries.push({ url: `${domain}/en/solutions/${sol.slug}`, priority: 80, category: 'AI Solution EN' });
        }

        // ── Priority 3: Wiki Articles ──
        for (const article of wikiArticles) {
            entries.push({ url: `${domain}/wiki/${article.slug}`, priority: 70, category: 'Wiki' });
            entries.push({ url: `${domain}/en/wiki/${article.slug}`, priority: 65, category: 'Wiki EN' });
        }

        // ── Priority 4: Industry Reports ──
        for (const rep of reports) {
            entries.push({ url: `${domain}/industry-reports/${rep.slug}`, priority: 75, category: 'Report' });
            entries.push({ url: `${domain}/en/industry-reports/${rep.slug}`, priority: 70, category: 'Report EN' });
        }

        // ── Priority 5: Comparisons ──
        for (const comp of comparisons) {
            entries.push({ url: `${domain}/karsilastirma/${comp.slug}`, priority: 60, category: 'Comparison' });
            entries.push({ url: `${domain}/en/karsilastirma/${comp.slug}`, priority: 55, category: 'Comparison EN' });
        }

        // ── Priority 6: Sectors ──
        for (const sector of sectors) {
            entries.push({ url: `${domain}/sektor/${sector.slug}`, priority: 55, category: 'Sector' });
            entries.push({ url: `${domain}/en/sektor/${sector.slug}`, priority: 50, category: 'Sector EN' });
        }

        // ── Priority 7: Cities ──
        for (const city of turkishCities) {
            entries.push({ url: `${domain}/sehir/${city.slug}`, priority: 45, category: 'City' });
            entries.push({ url: `${domain}/en/sehir/${city.slug}`, priority: 40, category: 'City EN' });
        }

        // ── Priority 8: City x Sector (lowest, programmatic SEO) ──
        for (const city of turkishCities) {
            for (const sector of sectors) {
                entries.push({
                    url: `${domain}/sehir/${city.slug}/${sector.slug}`,
                    priority: 20,
                    category: 'City×Sector'
                });
                entries.push({
                    url: `${domain}/en/sehir/${city.slug}/${sector.slug}`,
                    priority: 15,
                    category: 'City×Sector EN'
                });
            }
        }
    }

    // Sort by priority descending
    entries.sort((a, b) => b.priority - a.priority);
    return entries;
}

// ──────────────────────────────────────────────
// 5. SUBMIT
// ──────────────────────────────────────────────
async function main() {
    const allEntries = buildUrlList();
    
    // Apply offset and limit
    const limit = SUBMIT_ALL ? allEntries.length : DAILY_QUOTA;
    const entriesToSubmit = allEntries.slice(OFFSET, OFFSET + limit);

    console.log('\n' + '═'.repeat(70));
    console.log('🚀 Google Indexing API — Full Submit');
    console.log('═'.repeat(70));
    console.log(`📊 Total URLs in site:       ${allEntries.length}`);
    console.log(`🌐 Domains:                  ${domains.join(', ')}`);
    console.log(`📋 Submitting:               ${entriesToSubmit.length} URLs`);
    console.log(`⏭️  Offset:                   ${OFFSET}`);
    console.log(`📅 Daily quota:              ${DAILY_QUOTA}`);
    if (DRY_RUN) console.log('🔍 MODE:                     DRY RUN (no actual submission)');
    console.log('═'.repeat(70));

    // Category summary
    const categoryCounts: Record<string, number> = {};
    for (const e of entriesToSubmit) {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
    }
    console.log('\n📁 Kategori Dağılımı:');
    for (const [cat, count] of Object.entries(categoryCounts)) {
        console.log(`   ${cat}: ${count}`);
    }
    console.log('');

    if (DRY_RUN) {
        console.log('\n📝 URL Listesi (ilk 50):');
        entriesToSubmit.slice(0, 50).forEach((e, i) =>
            console.log(`  ${(OFFSET + i + 1).toString().padStart(4)}. [${e.category}] ${e.url}`)
        );
        if (entriesToSubmit.length > 50) {
            console.log(`  ... ve ${entriesToSubmit.length - 50} URL daha`);
        }
        console.log(`\n✅ Dry run tamamlandı. Gerçek gönderim için --dry-run flag'ini kaldırın.`);
        return;
    }

    // Authenticate
    const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    let authClient;
    try {
        authClient = await auth.getClient();
    } catch (e: any) {
        console.error("❌ Yetkilendirme Hatası:", e.message);
        console.error("   Lütfen google-indexer-key.json'un geçerli olduğundan emin olun.");
        process.exit(1);
    }

    const indexing = google.indexing({ version: 'v3', auth: authClient as any });

    let successCount = 0;
    let failCount = 0;
    let quotaExceeded = false;
    const startTime = Date.now();

    for (let i = 0; i < entriesToSubmit.length; i++) {
        const entry = entriesToSubmit[i];

        if (quotaExceeded) break;

        try {
            await indexing.urlNotifications.publish({
                requestBody: { url: entry.url, type: 'URL_UPDATED' },
            });
            successCount++;
            const progress = `[${(i + 1).toString().padStart(3)}/${entriesToSubmit.length}]`;
            console.log(`✅ ${progress} ${entry.url}`);
        } catch (error: any) {
            const errMsg = error.response?.data?.error?.message || error.message;

            if (errMsg.includes('quota') || errMsg.includes('rate') || error.response?.status === 429) {
                console.error(`\n⚠️  Günlük kota aşıldı! ${successCount} URL gönderildi.`);
                console.error(`   Kalan ${entriesToSubmit.length - i} URL için yarın tekrar çalıştırın:`);
                console.error(`   npx tsx scripts/submit-indexing-full.ts --offset ${OFFSET + i}\n`);
                quotaExceeded = true;
            } else {
                failCount++;
                console.error(`❌ [HATA] ${entry.url} → ${errMsg}`);
            }
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n' + '═'.repeat(70));
    console.log('📊 SONUÇ');
    console.log('═'.repeat(70));
    console.log(`✅ Başarılı:  ${successCount}`);
    console.log(`❌ Hatalı:    ${failCount}`);
    console.log(`⏱️  Süre:      ${elapsed}s`);
    console.log(`📋 Toplam:    ${allEntries.length} URL'den ${OFFSET + successCount + failCount} tanesi işlendi`);

    const remaining = allEntries.length - (OFFSET + successCount + failCount);
    if (remaining > 0) {
        const nextOffset = OFFSET + successCount + failCount;
        const daysNeeded = Math.ceil(remaining / DAILY_QUOTA);
        console.log(`\n⏭️  Kalan ${remaining} URL için (~${daysNeeded} gün):`);
        console.log(`   npx tsx scripts/submit-indexing-full.ts --offset ${nextOffset}`);
    } else {
        console.log('\n🎉 Tüm URL\'ler Google\'a gönderildi!');
    }
    console.log('═'.repeat(70) + '\n');
}

main().catch(console.error);
