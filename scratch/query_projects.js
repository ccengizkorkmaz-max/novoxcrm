const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const idx = line.indexOf('=');
        if (idx > 0) envConfig[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
    });
}
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    try {
        console.log("Searching for VISTA projects...");
        const { data: projects, error: pErr } = await supabase
            .from('projects')
            .select('id, name')
            .ilike('name', '%VISTA%');
        
        if (pErr) throw pErr;
        
        for (const p of projects) {
            console.log(`---\nProject: ${p.name}\nID: ${p.id}`);
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count, error: uErr } = await supabase
                .from('units')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', p.id);
            console.log(`Total Units: ${count}`);

            const { count: importedTodayCount } = await supabase
                .from('units')
                .select('*', { count: 'exact', head: true })
                .eq('project_id', p.id)
                .gte('created_at', today.toISOString());
            console.log(`Units imported today: ${importedTodayCount}`);

            if (importedTodayCount > 0) {
                const { data: unitsToday } = await supabase
                    .from('units')
                    .select('status')
                    .eq('project_id', p.id)
                    .gte('created_at', today.toISOString());
                    
                const stats = {};
                unitsToday.forEach(u => stats[u.status] = (stats[u.status] || 0) + 1);
                console.log(`Statuses of today's units:`, stats);
            }
        }
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
