import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: tenant } = await supabase.from('tenants').select('gemini_api_key').not('gemini_api_key', 'is', null).limit(1).single();
    
    const genAI = new GoogleGenerativeAI(tenant!.gemini_api_key);
    
    const models = [
        'gemini-2.5-flash',
        'gemini-pro',
        'gemini-1.5-pro'
    ];
    
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent('hi');
            console.log(`✅ Success for ${m}`);
        } catch (e: any) {
            console.log(`❌ Failed for ${m}`);
        }
    }
}
main();
