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
        const { data: projects } = await supabase.from('projects').select('id, name').ilike('name', '%NOVO PARK VISTA%');
        const projectId = projects[0].id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: units } = await supabase
            .from('units')
            .select('type, status')
            .eq('project_id', projectId)
            .gte('created_at', today.toISOString());
            
        const stats = {};
        units.forEach(u => {
            const key = `${u.type} - ${u.status}`;
            stats[key] = (stats[key] || 0) + 1;
        });
        console.log(stats);
    } catch (e) {}
}

main();
