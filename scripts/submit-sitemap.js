/**
 * Submit sitemap to Google Search Console via API
 * Uses the Service Account credentials from google-indexer-key.json
 */
const { google } = require('googleapis');
const path = require('path');

const SITEMAP_URL = 'https://novoxcrm.com/sitemap.xml';
const KEY_FILE = path.join(__dirname, '..', 'google-indexer-key.json');

// Try different site URL formats
const SITE_URLS = [
    'https://novoxcrm.com/',
    'https://novoxcrm.com',
    'https://www.novoxcrm.com/',
    'https://www.novoxcrm.com',
    'sc-domain:novoxcrm.com',
];

async function submitSitemap() {
    console.log('🔑 Authenticating with Google Service Account...\n');
    
    const auth = new google.auth.GoogleAuth({
        keyFile: KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/webmasters'],
    });

    const authClient = await auth.getClient();
    const webmasters = google.webmasters({ version: 'v3', auth: authClient });

    // First, try to list all sites the service account has access to
    console.log('📋 Listing all accessible sites...');
    try {
        const sites = await webmasters.sites.list();
        if (sites.data.siteEntry && sites.data.siteEntry.length > 0) {
            console.log('   Found sites:');
            sites.data.siteEntry.forEach(s => {
                console.log(`   • ${s.siteUrl} (${s.permissionLevel})`);
            });
        } else {
            console.log('   ⚠️  No sites found! The service account may not be added to any Search Console property.');
            console.log('   → Go to Search Console → Settings → Users and Permissions');
            console.log('   → Add: novoxcrmservice@gen-lang-client-0849039006.iam.gserviceaccount.com as Owner');
            return;
        }
    } catch (listErr) {
        console.log('   Could not list sites:', listErr.message);
    }

    // Try each URL format
    for (const siteUrl of SITE_URLS) {
        console.log(`\n📤 Trying: ${siteUrl}`);
        try {
            await webmasters.sitemaps.submit({
                siteUrl: siteUrl,
                feedpath: SITEMAP_URL,
            });
            console.log(`✅ SUCCESS! Sitemap submitted with site URL: ${siteUrl}`);

            // List sitemaps for confirmation
            try {
                const res = await webmasters.sitemaps.list({ siteUrl });
                if (res.data.sitemap && res.data.sitemap.length > 0) {
                    console.log('\n📋 Registered sitemaps:');
                    res.data.sitemap.forEach(sm => {
                        console.log(`   • ${sm.path}`);
                        console.log(`     Last downloaded: ${sm.lastDownloaded || 'Pending'}`);
                        console.log(`     URLs: ${sm.contents?.map(c => `${c.type}: ${c.submitted}`).join(', ') || 'N/A'}`);
                    });
                }
            } catch (e) {}

            console.log('\n🎉 Done! Google will now re-crawl your sitemap.');
            return;
        } catch (err) {
            console.log(`   ❌ ${err.message?.split('.')[0]}`);
        }
    }

    console.log('\n❌ All URL formats failed. Please check Search Console permissions.');
}

submitSitemap().catch(console.error);
