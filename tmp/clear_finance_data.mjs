import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'sb_secret_Ml_K9LttVNk3qzlyFxEQlA_B7lBW0HA' // service role key
)

async function main() {
    console.log('🔍 Tenant ID alınıyor...')

    // First get the tenant ID
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .not('tenant_id', 'is', null)
        .limit(1)

    if (profileError || !profiles?.length) {
        console.error('❌ Tenant ID alınamadı:', profileError)
        process.exit(1)
    }

    const tenantId = profiles[0].tenant_id
    console.log(`✅ Tenant ID: ${tenantId}`)

    // 1. Delete finance_transactions first (FK dependency on financial_accounts)
    console.log('\n🗑️  finance_transactions siliniyor...')
    const { error: txError, count: txCount } = await supabase
        .from('finance_transactions')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenantId)

    if (txError) {
        console.error('❌ finance_transactions silinemedi:', txError.message)
    } else {
        console.log(`✅ ${txCount} işlem silindi`)
    }

    // 2. Delete valuable_papers
    console.log('\n🗑️  valuable_papers siliniyor...')
    const { error: paperError, count: paperCount } = await supabase
        .from('valuable_papers')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenantId)

    if (paperError) {
        console.error('❌ valuable_papers silinemedi:', paperError.message)
    } else {
        console.log(`✅ ${paperCount} evrak silindi`)
    }

    // 3. Delete financial_accounts
    console.log('\n🗑️  financial_accounts siliniyor...')
    const { error: accountError, count: accountCount } = await supabase
        .from('financial_accounts')
        .delete({ count: 'exact' })
        .eq('tenant_id', tenantId)

    if (accountError) {
        console.error('❌ financial_accounts silinemedi:', accountError.message)
    } else {
        console.log(`✅ ${accountCount} hesap silindi`)
    }

    console.log('\n🎉 Finans demo datası temizleme tamamlandı!')
}

main().catch(console.error)
