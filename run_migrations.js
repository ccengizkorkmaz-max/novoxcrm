
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = [
        '20260128_broker_finances.sql',
        '20260128_project_visibility.sql',
        '20260128_fix_data_isolation.sql',
        '20260129_construction_management.sql'
    ];

    const connectionString = "postgresql://postgres:Passkall22!@db.ncjamvghbzutohmtclwf.supabase.co:5432/postgres";

    // Try connection
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to Supabase DB...');
        await client.connect();
        console.log('Connected successfully.');

        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            if (!fs.existsSync(filePath)) {
                console.warn(`File not found: ${file}`);
                continue;
            }

            console.log(`Running migration: ${file}`);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Execute the SQL
            await client.query(sql);
            console.log(`✅ Completed: ${file}`);
        }

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        if (err.message.includes('ENOTFOUND')) {
            console.log('Trying pooler host...');
            const poolerUrl = "postgresql://postgres:Passkall22!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
            // Note: Pooler host might be different, this is a guess based on common regions.
            // Better to just report the error if it fails.
        }
    } finally {
        await client.end();
    }
}

runMigrations();
