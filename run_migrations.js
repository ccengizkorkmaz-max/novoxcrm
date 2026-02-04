
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = [
        '20260202_add_parameters_to_payment_plans.sql',
        '20260202_add_payment_type_to_items.sql',
        '20260203_add_description_to_sales.sql',
        '20260204_add_address_fields_to_customers.sql'
    ];

    const connectionString = "postgresql://postgres:Passkall22!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";

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
