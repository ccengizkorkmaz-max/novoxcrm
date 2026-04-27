const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

const MAHSA_ID = '2f55d734-4376-4685-aef1-67e15fd6bb30'
const BURAK_OWNER_ID = '3a3c1529-bb74-40f5-90ef-2414c65667dd'

async function check() {
    // 1. Check how many sales are still assigned to Mahsa
    const { count: mahsaSalesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', MAHSA_ID)
    
    console.log(`Mahsa'ya hâlâ atanmış lead sayısı: ${mahsaSalesCount}`)

    // 2. Check activities still owned by Mahsa
    const { count: mahsaActOwner } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', MAHSA_ID)
    
    const { count: mahsaActUser } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', MAHSA_ID)

    const { count: mahsaActAssigned } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', MAHSA_ID)

    console.log(`Mahsa'ya ait aktiviteler - owner_id: ${mahsaActOwner}, user_id: ${mahsaActUser}, assigned_to: ${mahsaActAssigned}`)

    // 3. Check contracts
    const { count: mahsaContracts } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('sales_rep_id', MAHSA_ID)
    
    console.log(`Mahsa'ya ait sözleşme: ${mahsaContracts}`)

    // 4. Check offers
    const { count: mahsaOffers } = await supabase
        .from('offers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', MAHSA_ID)
    
    console.log(`Mahsa'ya ait teklif: ${mahsaOffers}`)

    // 5. Summary
    console.log('\n=== ÖZET ===')
    const totalMahsa = (mahsaSalesCount || 0) + (mahsaActOwner || 0) + (mahsaActUser || 0) + (mahsaActAssigned || 0) + (mahsaContracts || 0) + (mahsaOffers || 0)
    
    if (totalMahsa === 0) {
        console.log('✅ Mahsa Alizad üzerinde hiçbir kayıt kalmamış. Aktarım başarılı görünüyor.')
    } else {
        console.log(`⚠️ Mahsa Alizad üzerinde toplam ${totalMahsa} kayıt hâlâ mevcut. Aktarım TAMAMLANMAMIŞ!`)
    }

    // 6. Mahsa profil + auth durumu
    console.log('\n=== Mahsa Silme Durumu ===')
    const { data: mahsaProfile } = await supabase
        .from('profiles')
        .select('id, full_name, is_active, tenant_id, role')
        .eq('id', MAHSA_ID)
        .single()
    
    console.log('Profil:', mahsaProfile)
    
    // Auth user check
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(MAHSA_ID)
    console.log('Auth user mevcut:', !!authUser?.user, authErr ? `Hata: ${authErr.message}` : '')
}

check().catch(console.error)
