import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA'
)

const tenantId = '89b2829e-fc21-477e-8fd8-9f9f0c587e81'
const today = new Date().toISOString()

async function main() {
    // Check what payment_plans/items exist for this tenant
    console.log('🔍 Vadesi geçmiş payment_items kontrol ediliyor...')
    const { data: overdueItems, error } = await supabase
        .from('payment_items')
        .select(`
            id, amount, due_date, status,
            payment_plans ( id, sale_id )
        `)
        .eq('tenant_id', tenantId)
        .neq('status', 'Paid')
        .lt('due_date', today)

    if (error) {
        console.error('Hata:', error.message)
        process.exit(1)
    }

    console.log(`📋 ${overdueItems?.length || 0} adet vadesi geçmiş ödeme bulundu:`)
    overdueItems?.forEach(item => {
        console.log(`  - ID: ${item.id.slice(0, 8)}... | Tarih: ${item.due_date} | Tutar: ${item.amount} | Durum: ${item.status}`)
    })

    if (!overdueItems?.length) {
        console.log('✅ Silinecek kayıt yok.')
        return
    }

    // Get unique plan IDs linked to these items
    const planIds = [...new Set(overdueItems.map(i => i.payment_plans?.id).filter(Boolean))]
    console.log(`\n📋 Bağlı ${planIds.length} adet ödeme planı bulundu.`)

    // Delete the overdue payment_items
    console.log('\n🗑️  Vadesi geçmiş payment_items siliniyor...')
    const { error: delItemsError, count: itemCount } = await supabase
        .from('payment_items')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenantId)
        .neq('status', 'Paid')
        .lt('due_date', today)

    if (delItemsError) {
        console.error('❌ payment_items silinemedi:', delItemsError.message)
    } else {
        console.log(`✅ ${itemCount} vadesi geçmiş ödeme kalemi silindi.`)
    }

    // Check if empty plans remain and delete them too
    if (planIds.length > 0) {
        console.log('\n🔍 Boş kalan ödeme planları kontrol ediliyor...')
        for (const planId of planIds) {
            const { count } = await supabase
                .from('payment_items')
                .select('*', { count: 'exact', head: true })
                .eq('plan_id', planId)
            
            if (count === 0) {
                await supabase.from('payment_plans').delete().eq('id', planId)
                console.log(`  🗑️  Boş plan silindi: ${planId.slice(0, 8)}...`)
            }
        }
    }

    console.log('\n🎉 Yaşlandırma raporu temizlendi!')
}

main().catch(console.error)
