const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function restore() {
    console.log("Restoring sales assignments from sales_assignment_backup.json...");
    
    if (!fs.existsSync('sales_assignment_backup.json')) {
        console.error("Error: Backup file not found.");
        return;
    }

    const backupData = JSON.parse(fs.readFileSync('sales_assignment_backup.json', 'utf-8'));
    console.log(`Found ${backupData.length} records to restore.`);

    let successCount = 0;
    let errorCount = 0;

    // We process in small chunks to avoid rate limiting
    const chunkSize = 100;
    for (let i = 0; i < backupData.length; i += chunkSize) {
        const chunk = backupData.slice(i, i + chunkSize);
        
        // Use Promise.all to update a chunk concurrently
        await Promise.all(chunk.map(async (record) => {
            const { error } = await supabase
                .from('sales')
                .update({ assigned_to: record.assigned_to })
                .eq('id', record.id);
            
            if (error) {
                console.error(`Error updating sale ${record.id}:`, error.message);
                errorCount++;
            } else {
                successCount++;
            }
        }));

        process.stdout.write(`\rProgress: ${successCount + errorCount} / ${backupData.length}`);
    }

    console.log(`\nRestore complete! Success: ${successCount}, Errors: ${errorCount}`);
}

restore();
