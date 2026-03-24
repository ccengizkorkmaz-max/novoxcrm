import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const normalize = (str: string) => {
    if (!str) return '';
    return str
        .replace(/İ/g, 'i')
        .replace(/I/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/U/g, 'u')
        .replace(/Ü/g, 'u')
        .replace(/ü/g, 'u')
        .replace(/Ö/g, 'o')
        .replace(/ö/g, 'o')
        .replace(/Ş/g, 's')
        .replace(/ş/g, 's')
        .replace(/Ç/g, 'c')
        .replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g')
        .replace(/ğ/g, 'g')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''); // keep only alphanum
};

// Utility for Levenshtein distance
const getLevenshteinDistance = (a: string, b: string) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

async function run() {
    const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, description, tenant_id')
        .is('project_id', null)
        .not('description', 'is', null);

    if (salesError) return console.error(salesError);
    if (!sales) return;

    const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, tenant_id');

    if (projectsError) return console.error(projectsError);
    if (!projects) return;

    let updateCount = 0;

    for (const sale of sales) {
        const formMatch = sale.description.match(/Form:([^)]+)\)/i);
        const campaignMatch = sale.description.match(/Campaign:([^)]+)\)/i);
        
        let projectNameCandidates: string[] = [];
        if (formMatch) projectNameCandidates.push(formMatch[1].trim());
        if (campaignMatch) {
            const parts = campaignMatch[1].split('/');
            parts.forEach(p => projectNameCandidates.push(p.trim()));
            projectNameCandidates.push(campaignMatch[1].trim());
        }

        let matchedProjectId = null;
        let matchedProjectName = null;

        for (const candidate of projectNameCandidates) {
            const nCandidate = normalize(candidate);
            if (!nCandidate) continue;

            let bestMatch = null;
            let bestDistance = Infinity;

            for (const p of projects) {
                if (p.tenant_id !== sale.tenant_id) continue;
                const nProjectName = normalize(p.name);
                
                // Exact or substring match (very strong)
                if (nProjectName === nCandidate || nProjectName.includes(nCandidate) || nCandidate.includes(nProjectName)) {
                    // prevent overly generic words matching
                    if (nCandidate.length < 5 && nCandidate !== nProjectName) continue;
                    bestDistance = 0;
                    bestMatch = p;
                    break;
                }
                
                // Fuzzy match using Levenshtein distance
                const distance = getLevenshteinDistance(nProjectName, nCandidate);
                // Allow a small typo, max distance of 3, but the candidate must be significantly long
                if (distance <= 3 && nCandidate.length >= 6) {
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMatch = p;
                    }
                }
            }

            if (bestMatch && bestDistance <= 3) {
                matchedProjectId = bestMatch.id;
                matchedProjectName = bestMatch.name;
                console.log(`Matched sale ${sale.id} to project "${bestMatch.name}" using cand: "${candidate}" (distance: ${bestDistance})`);
                break;
            }
        }

        if (matchedProjectId) {
            const { error: updateError } = await supabase
                .from('sales')
                .update({ project_id: matchedProjectId })
                .eq('id', sale.id);
            
            if (updateError) {
                console.error(`Error updating sale ${sale.id}:`, updateError);
            } else {
                updateCount++;
            }
        }
    }

    console.log(`Successfully updated ${updateCount} sales.`);
}

run();
