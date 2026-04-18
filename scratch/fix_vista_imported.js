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
        const projectId = '0901039a-348c-4d62-a2d4-d89934a992d6';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log(`Updating 'SATILDI' units to 'Sold' and is_legacy=true for project ${projectId}`);

        const { data: units, error: err } = await supabase
            .from('units')
            .update({ 
                status: 'Sold', 
                is_legacy: true 
            })
            .eq('project_id', projectId)
            .eq('status', 'SATILDI')
            .gte('created_at', today.toISOString())
            .select('id, unit_number');

        if (err) throw err;

        console.log(`Successfully updated ${units.length} sold units.`);

        // Should we also fix 'STOKTA' -> 'For Sale' and 'KAPORA ALINDI' -> 'Reserved'? 
        // Let's at least fix KAPORA ALINDI -> Reserved and STOKTA -> For Sale
        const { data: unitsStock, error: errStock } = await supabase
            .from('units')
            .update({ status: 'For Sale' })
            .eq('project_id', projectId)
            .eq('status', 'STOKTA')
            .gte('created_at', today.toISOString());
            
        const { data: unitsKapora, error: errKapora } = await supabase
            .from('units')
            .update({ status: 'Reserved' })
            .eq('project_id', projectId)
            .eq('status', 'KAPORA ALINDI')
            .gte('created_at', today.toISOString());

        console.log(`Also normalized 'STOKTA' -> 'For Sale' and 'KAPORA ALINDI' -> 'Reserved' for system compatibility.`);

    } catch (e) {
        console.error("Error:", e);
    }
}

main();
