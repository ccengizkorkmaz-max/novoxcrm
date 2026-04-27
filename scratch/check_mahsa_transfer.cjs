const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

async function check() {
    // 1. Find Mahsa Alizad profile (might be deleted)
    console.log('=== Mahsa Alizad Profil Kontrolü ===')
    const { data: mahsa, error: mahsaErr } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active')
        .ilike('full_name', '%mahsa%')
    
    if (mahsaErr) console.error('Mahsa query error:', mahsaErr.message)
    console.log('Mahsa profiles:', mahsa)

    // 2. Find Burak Kotaman
    console.log('\n=== Burak Kotaman Profil ===')
    const { data: burak } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .ilike('full_name', '%burak kotaman%')
    
    console.log('Burak profiles:', burak)
    const burakId = burak?.[0]?.id

    // 3. Check if any sales/leads are still assigned to Mahsa (by name search in auth)
    // Since Mahsa may be deleted, let's check auth.users
    console.log('\n=== Auth Users - Mahsa ===')
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers()
    if (authErr) console.error('Auth list error:', authErr.message)
    
    const mahsaAuth = authUsers?.users?.filter(u => 
        u.email?.toLowerCase().includes('mahsa') || 
        u.user_metadata?.full_name?.toLowerCase()?.includes('mahsa')
    )
    console.log('Mahsa auth users:', mahsaAuth?.map(u => ({ id: u.id, email: u.email, name: u.user_metadata?.full_name })))

    // 4. Check if there are any orphaned records pointing to a non-existent profile
    // First, get all profile IDs
    const { data: allProfiles } = await supabase.from('profiles').select('id, full_name')
    const profileIds = new Set(allProfiles?.map(p => p.id) || [])

    // Check sales with assigned_to pointing to non-existent profiles
    console.log('\n=== Sahipsiz (Orphan) Lead Kontrolü ===')
    const { data: allSales } = await supabase
        .from('sales')
        .select('id, assigned_to, status, customers(full_name)')
        .not('assigned_to', 'is', null)

    const orphanedSales = allSales?.filter(s => !profileIds.has(s.assigned_to)) || []
    console.log(`Toplam atanmış lead: ${allSales?.length}`)
    console.log(`Sahipsiz (silinmiş kullanıcıya atanmış) lead: ${orphanedSales.length}`)
    if (orphanedSales.length > 0) {
        console.log('İlk 10 sahipsiz lead:', orphanedSales.slice(0, 10).map(s => ({
            id: s.id,
            assigned_to: s.assigned_to,
            customer: s.customers?.full_name,
            status: s.status
        })))
    }

    // 5. Count leads assigned to Burak
    if (burakId) {
        const { count: burakLeadCount } = await supabase
            .from('sales')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', burakId)
        
        console.log(`\n=== Burak Kotaman Lead Sayısı: ${burakLeadCount} ===`)
    }

    // 6. Check activities with orphaned owner_id
    console.log('\n=== Sahipsiz Aktivite Kontrolü ===')
    const { data: allActivities } = await supabase
        .from('activities')
        .select('id, owner_id')
        .not('owner_id', 'is', null)

    const orphanedActivities = allActivities?.filter(a => !profileIds.has(a.owner_id)) || []
    console.log(`Toplam owner atanmış aktivite: ${allActivities?.length}`)
    console.log(`Sahipsiz (silinmiş kullanıcıya ait) aktivite: ${orphanedActivities.length}`)
    if (orphanedActivities.length > 0) {
        console.log('Sahipsiz aktivite owner_id\'ler:', [...new Set(orphanedActivities.map(a => a.owner_id))])
    }
}

check().catch(console.error)
