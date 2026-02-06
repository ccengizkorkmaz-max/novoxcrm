const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const envFileCallback = fs.readFileSync(envPath, 'utf8');
    envFileCallback.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envConfig[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function makeOwner() {
    const email = 'ccengizkorkmaz@gmail.com';
    console.log(`Finding user with email: ${email}...`);

    const { data: users, error: searchError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('email', email);

    if (searchError) {
        console.error('Error finding user:', searchError);
        return;
    }

    if (!users || users.length === 0) {
        console.error('User not found.');
        return;
    }

    const user = users[0];
    console.log(`Found user: ${user.email} (Current Role: ${user.role})`);

    if (user.role === 'owner') {
        console.log('User is already Owner.');
        return;
    }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'owner' })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating role:', updateError);
    } else {
        console.log(`Successfully updated role to Owner.`);
    }
}

makeOwner();
