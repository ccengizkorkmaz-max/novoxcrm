const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

const MAHSA_ID = '2f55d734-4376-4685-aef1-67e15fd6bb30'
const BURAK_OWNER_ID = '3a3c1529-bb74-40f5-90ef-2414c65667dd' // Burak Kotaman (owner role)

async function transferAndDelete() {
    console.log('=== Mahsa Alizad kalan kayıtlarını Burak Kotaman\'a aktarma ===\n')

    // 1. Transfer activities.owner_id
    const { data: d1, error: e1 } = await supabase
        .from('activities')
        .update({ owner_id: BURAK_OWNER_ID })
        .eq('owner_id', MAHSA_ID)
        .select('id')
    console.log(`activities.owner_id aktarıldı: ${d1?.length || 0}`, e1 ? `HATA: ${e1.message}` : '✅')

    // 2. Transfer activities.assigned_to (just in case)
    const { data: d2, error: e2 } = await supabase
        .from('activities')
        .update({ assigned_to: BURAK_OWNER_ID })
        .eq('assigned_to', MAHSA_ID)
        .select('id')
    console.log(`activities.assigned_to aktarıldı: ${d2?.length || 0}`, e2 ? `HATA: ${e2.message}` : '✅')

    // 3. Transfer activities.assigned_by_id (just in case)
    const { data: d3, error: e3 } = await supabase
        .from('activities')
        .update({ assigned_by_id: BURAK_OWNER_ID })
        .eq('assigned_by_id', MAHSA_ID)
        .select('id')
    console.log(`activities.assigned_by_id aktarıldı: ${d3?.length || 0}`, e3 ? `HATA: ${e3.message}` : '✅')

    // 4. Transfer customers.created_by
    const { data: d4, error: e4 } = await supabase
        .from('customers')
        .update({ created_by: BURAK_OWNER_ID })
        .eq('created_by', MAHSA_ID)
        .select('id')
    console.log(`customers.created_by aktarıldı: ${d4?.length || 0}`, e4 ? `HATA: ${e4.message}` : '✅')

    // 5. Any remaining FK columns
    const tables = [
        ['contract_activities', 'performed_by'],
        ['contract_documents', 'uploaded_by'],
        ['broker_leads', 'broker_id'],
        ['broker_leads', 'assigned_to'],
        ['broker_lead_status_history', 'changed_by'],
        ['broker_applications', 'processed_by'],
        ['sales_commissions', 'user_id'],
        ['inbox_items', 'approved_by'],
        ['public_links', 'created_by'],
        ['system_logs', 'user_id'],
    ]

    for (const [table, column] of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .update({ [column]: BURAK_OWNER_ID })
                .eq(column, MAHSA_ID)
                .select('id')
            if (data?.length > 0) {
                console.log(`${table}.${column} aktarıldı: ${data.length}`, error ? `HATA: ${error.message}` : '✅')
            }
        } catch (err) {
            // table might not exist, skip
        }
    }

    // Delete team_members and notifications
    await supabase.from('team_members').delete().eq('profile_id', MAHSA_ID)
    await supabase.from('notifications').delete().eq('user_id', MAHSA_ID)

    console.log('\n=== Şimdi profili siliniyor ===')
    
    // Delete profile
    const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', MAHSA_ID)
    
    if (profileErr) {
        console.log('❌ Profil silme hatası:', profileErr.message)
    } else {
        console.log('✅ Profil silindi')
    }

    // Delete auth user
    const { error: authErr } = await supabase.auth.admin.deleteUser(MAHSA_ID)
    if (authErr) {
        console.log('❌ Auth user silme hatası:', authErr.message)
    } else {
        console.log('✅ Auth user silindi')
    }

    // Final verification
    console.log('\n=== SON DOĞRULAMA ===')
    const { data: checkProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', MAHSA_ID)
    
    const { data: checkAuth } = await supabase.auth.admin.getUserById(MAHSA_ID)
    
    console.log('Profil mevcut:', checkProfile?.length > 0 ? '⚠️ EVET' : '✅ HAYIR (silindi)')
    console.log('Auth user mevcut:', checkAuth?.user ? '⚠️ EVET' : '✅ HAYIR (silindi)')
}

transferAndDelete().catch(console.error)
