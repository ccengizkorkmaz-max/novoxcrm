import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ncjamvghbzutohmtclwf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Querying last Call activity...');
    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('type', 'Call')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error fetching activities:', error.message);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No Call activities found.');
        return;
    }

    data.forEach((activity, index) => {
        console.log(`\n=================== CALL ACTIVITY ${index + 1} ===================`);
        console.log(`ID: ${activity.id}`);
        console.log(`Created At: ${activity.created_at}`);
        console.log(`Summary: ${activity.summary}`);
        console.log(`Description:\n${activity.description}`);
    });
}

main().catch(console.error);
