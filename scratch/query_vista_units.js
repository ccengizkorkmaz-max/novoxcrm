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
        console.log("Searching for NOVO PARK VISTA project...");
        const { data: projects, error: pErr } = await supabase
            .from('projects')
            .select('id, name')
            .ilike('name', '%NOVO PARK VISTA%');
        
        if (pErr) throw pErr;
        
        if (!projects || projects.length === 0) {
            console.log("Project NOVO PARK VISTA not found.");
            return;
        }
        
        const projectId = projects[0].id;
        console.log(`Found project: ${projects[0].name} ID: ${projectId}`);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        console.log(`Searching for units created on or after: ${today.toISOString()}`);
        
        const { data: units, error: uErr } = await supabase
            .from('units')
            .select('id, unit_number, type, floor, price, status, created_at')
            .eq('project_id', projectId)
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });
            
        if (uErr) throw uErr;
        
        console.log(`\n===========================================`);
        console.log(`TOTAL UNITS IMPORTED TODAY: ${units.length}`);
        console.log(`===========================================\n`);
        
        if (units.length > 0) {
            console.log("Here are the recently added units:");
            console.table(units.slice(0, 50));
            if (units.length > 50) {
                console.log(`... and ${units.length - 50} more.`);
            }
        }
        
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
