
const { Client } = require('pg');

async function debugRecord() {
    const connectionString = "postgresql://postgres:Passkall22!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- Unit Info ---');
        const unitRes = await client.query("SELECT id, unit_number, project_id FROM units WHERE unit_number = '101' LIMIT 10");
        console.log(unitRes.rows);

        if (unitRes.rows.length > 0) {
            const unitId = unitRes.rows[0].id;
            console.log('\n--- Sales for Unit ---');
            const salesRes = await client.query("SELECT id, status, customer_id, project_id FROM sales WHERE unit_id = $1", [unitId]);
            console.log(salesRes.rows);

            for (const sale of salesRes.rows) {
                console.log(`\n--- Payment Plan for Sale ${sale.id} ---`);
                const planRes = await client.query("SELECT * FROM payment_plans WHERE sale_id = $1", [sale.id]);
                console.log(planRes.rows);

                if (planRes.rows.length > 0) {
                    const planId = planRes.rows[0].id;
                    console.log(`\n--- Payment Items for Plan ${planId} ---`);
                    const itemsRes = await client.query("SELECT * FROM payment_items WHERE payment_plan_id = $1", [planId]);
                    console.log(itemsRes.rows);
                }
            }
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

debugRecord();
