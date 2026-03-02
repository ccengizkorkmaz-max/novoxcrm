import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { InboxList } from './components/InboxList'

export default async function InboxPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('Sidebar.Inbox')

    // Fetch only pending inbox items
    const { data: inboxItems } = await supabase
        .from('inbox_items')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('description')}</p>
                </div>
            </div>

            <InboxList initialItems={inboxItems || []} />
        </div>
    )
}
