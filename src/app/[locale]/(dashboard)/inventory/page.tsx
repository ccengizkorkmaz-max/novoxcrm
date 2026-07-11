import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export default async function InventoryPage(props: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    let debugInfo: string[] = []
    
    try {
        debugInfo.push('1. Starting...')
        
        const { locale } = await props.params
        const params = await props.searchParams
        debugInfo.push('2. Params resolved')
        
        const supabase = await createClient()
        debugInfo.push('3. Supabase client created')
        
        const t = await getTranslations('Inventory')
        debugInfo.push('4. Translations loaded')
        
        const userRes = await supabase.auth.getUser()
        const user = userRes?.data?.user || null
        debugInfo.push(`5. User: ${user?.id ? 'authenticated' : 'null'}`)
        
        const projectsRes = await supabase.from('projects').select('id, name')
        debugInfo.push(`6. Projects: ${projectsRes?.data?.length || 0}`)
        
        const unitsRes = await supabase.from('units').select('id, unit_number, status').limit(5)
        debugInfo.push(`7. Units (sample): ${unitsRes?.data?.length || 0}`)
        
        if (user?.id) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
            debugInfo.push(`8. Profile role: ${profile?.role || 'null'}`)
        }
        
        return (
            <div style={{ padding: 40, fontFamily: 'monospace' }}>
                <h1 style={{ color: 'green', fontSize: 24 }}>✅ Inventory Page - Debug Mode</h1>
                <p>All data fetching succeeded!</p>
                <pre style={{ background: '#f0f0f0', padding: 16, borderRadius: 8, marginTop: 16 }}>
                    {debugInfo.join('\n')}
                </pre>
                <p style={{ marginTop: 16, color: '#666' }}>
                    Timestamp: {new Date().toISOString()}
                </p>
                <h2 style={{ marginTop: 24 }}>Translation test: {t('title')}</h2>
            </div>
        )
    } catch (error: any) {
        return (
            <div style={{ padding: 40, fontFamily: 'monospace' }}>
                <h1 style={{ color: 'red', fontSize: 24 }}>❌ Error in Inventory Page</h1>
                <pre style={{ background: '#fff0f0', padding: 16, borderRadius: 8 }}>
                    {error?.message || String(error)}
                </pre>
                <pre style={{ background: '#fff0f0', padding: 16, borderRadius: 8, marginTop: 8 }}>
                    {error?.stack}
                </pre>
                <h3>Progress before error:</h3>
                <pre style={{ background: '#f0f0f0', padding: 16, borderRadius: 8 }}>
                    {debugInfo.join('\n')}
                </pre>
            </div>
        )
    }
}
