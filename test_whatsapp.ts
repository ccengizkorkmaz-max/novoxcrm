import { sendWhatsAppTemplate } from './src/lib/whatsapp';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get tenant data
    const { data: tenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', '89b2829e-fc21-477e-8fd8-9f9f0c587e81')
        .single();
        
    console.log("Tenant Phone ID:", tenant.wa_phone_number_id);
    console.log("Tenant token length:", tenant.wa_access_token?.length);

    const params = [
        'Ahmet Yılmaz',
        '905321234567',
        new Date().toLocaleString('tr-TR'),
        'Özet test mesajı.'
    ];

    const res = await sendWhatsAppTemplate(
        '+90 532 210 90 40',
        'hot_lead_notification',
        params,
        'tr',
        tenant.wa_phone_number_id,
        tenant.wa_access_token
    );
    
    console.log('Result:', res);
}

test();
