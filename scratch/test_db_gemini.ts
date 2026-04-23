import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get tenant with gemini key
    const { data: tenant, error } = await supabase.from('tenants').select('gemini_api_key, name').not('gemini_api_key', 'is', null).limit(1).single();
    if (error || !tenant?.gemini_api_key) {
        console.log('No tenant or API key found');
        return;
    }
    
    console.log(`Testing with key for tenant: ${tenant.name}`);
    
    const genAI = new GoogleGenerativeAI(tenant.gemini_api_key);
    
    const models = [
        'gemini-1.5-flash',
        'gemini-2.0-flash', 
        'gemini-2.5-pro',
        'gemini-3-flash', 
        'gemini-3.1-flash-lite', 
        'gemini-3.1-flash-live'
    ];
    
    for (const m of models) {
        try {
            console.log(`\nTesting model ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent('Merhaba, nasılsın?');
            console.log(`✅ Success for ${m}:`, result.response.text().slice(0, 50));
        } catch (e: any) {
            console.log(`❌ Failed for ${m}:`, e.message);
        }
    }
}

main();
