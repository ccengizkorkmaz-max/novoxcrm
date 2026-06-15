import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { InboxList } from './components/InboxList'

export default async function InboxPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('Sidebar.Inbox')

    // Role-based access control
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single()
    const isManager = profile?.role === 'manager' || profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'crm_manager'

    if (!isManager) {
        const { redirect } = await import('next/navigation')
        redirect('/')
    }

    // Fetch pending items
    const { data: pendingItems, count: pendingCount } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact' })
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(100)

    // Fetch archived items (approved + rejected)
    const { data: archivedItems, count: archivedCount } = await supabase
        .from('inbox_items')
        .select('*', { count: 'exact' })
        .in('status', ['approved', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
            </div>

            <InboxList 
                initialItems={pendingItems || []} 
                archivedItems={archivedItems || []} 
                pendingCount={pendingCount || 0}
                archivedCount={archivedCount || 0}
            />
        </div>
    )
}
