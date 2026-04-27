const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(
    'https://ncjamvghbzutohmtclwf.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jamFtdmdoYnp1dG9obXRjbHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTgyMCwiZXhwIjoyMDg0NzA1ODIwfQ.QUULsxOisQopm3r5yHfbXjWCMmFDMBcpbgvqd2tHNZo'
)

async function cleanup() {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const cutoff = threeMonthsAgo.toISOString()
    console.log('Cutoff date:', cutoff)

    // Count first
    const { count, error: countErr } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Completed')
        .lt('due_date', cutoff)

    console.log(`Found ${count} completed activities older than 3 months`)
    if (countErr) { console.log('Count error:', countErr.message); return }

    // Also count Cancelled old ones
    const { count: cancelledCount } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Cancelled')
        .lt('due_date', cutoff)
    console.log(`Found ${cancelledCount} cancelled activities older than 3 months`)

    // Total before
    const { count: totalBefore } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
    console.log(`Total activities before cleanup: ${totalBefore}`)

    // Delete completed + cancelled older than 3 months
    const { error: delErr1, count: del1 } = await supabase
        .from('activities')
        .delete({ count: 'exact' })
        .eq('status', 'Completed')
        .lt('due_date', cutoff)
    
    console.log(`\nDeleted completed: ${del1}`, delErr1 ? `Error: ${delErr1.message}` : '✅')

    const { error: delErr2, count: del2 } = await supabase
        .from('activities')
        .delete({ count: 'exact' })
        .eq('status', 'Cancelled')
        .lt('due_date', cutoff)
    
    console.log(`Deleted cancelled: ${del2}`, delErr2 ? `Error: ${delErr2.message}` : '✅')

    // Total after
    const { count: totalAfter } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
    console.log(`\nTotal activities after cleanup: ${totalAfter}`)
    console.log(`Cleaned up: ${totalBefore - totalAfter} records`)
}
cleanup()
