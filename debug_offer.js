
const { Client } = require('pg');

async function debugOffer() {
    const connectionString = "postgresql://postgres:Passkall22!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres";
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log('--- Offer Info (#d0070935) ---');
        const offerRes = await client.query("SELECT id, sale_id, status, payment_plan, price FROM offers WHERE id::text LIKE 'd0070935%'");
        console.log(JSON.stringify(offerRes.rows, null, 2));

        if (offerRes.rows.length > 0) {
            const saleId = offerRes.rows[0].sale_id;
            console.log(`\n--- Sale Info (${saleId}) ---`);
            const saleRes = await client.query("SELECT id, status, final_price FROM sales WHERE id = $1", [saleId]);
            console.log(saleRes.rows);

            console.log(`\n--- Payment Plan for Sale ---`);
            const planRes = await client.query("SELECT * FROM payment_plans WHERE sale_id = $1", [saleId]);
            console.log(planRes.rows);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

debugOffer();
