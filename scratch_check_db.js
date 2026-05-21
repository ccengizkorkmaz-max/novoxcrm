const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    console.log('=== OUTREACH TRIGGERS ===');
    const { data: triggers, error: tErr } = await supabase
        .from('outreach_triggers')
        .select('*');

    if (tErr) {
        console.error(tErr);
    } else {
        console.log(JSON.stringify(triggers, null, 2));
    }
}

main().catch(console.error);
