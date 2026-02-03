
const { Client } = require('pg');

async function checkSchema() {
    const connectionString = "postgresql://postgres:Passkall22!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- payment_items Columns ---');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payment_items'
        `);
        console.log(res.rows);

        console.log('\n--- payment_plans Columns ---');
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'payment_plans'
        `);
        console.log(res2.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
