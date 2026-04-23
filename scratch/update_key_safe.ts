import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const newKey = process.argv[2];
    if (!newKey) { console.error('Usage: ts-node update_key.ts <KEY>'); return; }

    const { data, error } = await supabase.from('tenants').update({ gemini_api_key: newKey }).not('name', 'is', null).select('name');
    if (error) { console.error('Failed:', error.message); return; }
    console.log('Updated tenants:', data);

    // Verify key works
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(newKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Merhaba, test.');
    console.log('✅ Key works! Response:', result.response.text().substring(0, 80));
}
main();
