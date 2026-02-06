const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually to avoid dependency issues
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using service role key if available for administrative tasks would be better, 
// but anon key usually doesn't have permissions to create buckets unless policies allow it.
// However, 'supabase-js' storage.createBucket requires admin or appropriate policies.
// IF this script fails with anon key, we check if service role key is available.
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey || supabaseKey);

async function createBucket() {
    console.log('Creating hr-documents bucket...');

    const { data, error } = await supabase
        .storage
        .createBucket('hr-documents', {
            public: true,
            allowedMimeTypes: ['image/*', 'application/pdf'],
            fileSizeLimit: 10485760, // 10MB
        });

    if (error) {
        // Ignore if already exists
        if (error.message.includes('already exists') || error.message.includes('Duplicate')) {
            console.log('Bucket already exists.');
        } else {
            console.error('Error creating bucket:', error);
            process.exit(1);
        }
    } else {
        console.log('Bucket created successfully:', data);
    }
}

createBucket();
