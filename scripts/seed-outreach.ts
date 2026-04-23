import { createAdminClient } from '../src/lib/supabase/admin'

async function fixTenant() {
    const supabase = createAdminClient()
    
    // Get all tenants
    const { data: tenants } = await supabase.from('tenants').select('id')
    console.log('Tenants:', tenants?.length)
    
    // Get the workflow we just created
    const { data: workflow } = await supabase.from('outreach_workflows')
        .select('*')
        .eq('name', '🚀 Otomatik Yeniden Kazanım (Örnek)')
        .single()
        
    if (!workflow) return console.log('Workflow not found')

    // Copy to all tenants if it doesn't exist
    for (const t of tenants || []) {
        if (t.id === workflow.tenant_id) continue;
        
        console.log(`Copying to tenant: ${t.id}`)
        
        // Copy segment
        const { data: oldSeg } = await supabase.from('outreach_segments').select('*').eq('id', workflow.segment_id).single()
        const { data: newSeg } = await supabase.from('outreach_segments').insert({
            ...oldSeg, id: undefined, tenant_id: t.id
        }).select().single()
        
        // Copy workflow
        const { data: newWf } = await supabase.from('outreach_workflows').insert({
            ...workflow, id: undefined, tenant_id: t.id, segment_id: newSeg?.id
        }).select().single()
        
        // Copy steps
        const { data: steps } = await supabase.from('outreach_steps').select('*').eq('workflow_id', workflow.id)
        const newSteps = steps?.map(s => ({ ...s, id: undefined, workflow_id: newWf?.id })) || []
        if (newSteps.length) await supabase.from('outreach_steps').insert(newSteps)
            
        // Copy scripts
        const { data: scripts } = await supabase.from('outreach_scripts').select('*').eq('tenant_id', workflow.tenant_id)
        for (const scr of scripts || []) {
            await supabase.from('outreach_scripts').insert({ ...scr, id: undefined, tenant_id: t.id })
        }
    }
    console.log('Done fixing tenants!')
}

fixTenant().catch(console.error)
