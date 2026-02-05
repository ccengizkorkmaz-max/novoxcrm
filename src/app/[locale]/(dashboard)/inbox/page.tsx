import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Mail, Info, Calendar, Clock, User, ChevronRight, MessageSquareText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InboxList } from './components/InboxList'

export default async function InboxPage() {
    const supabase = await createClient()
    const t = await getTranslations('Sidebar.Inbox')

    // Fetch sales records that have descriptions (likely from external sources)
    // Temporarily simplified to debug the filtering issue
    const { data: emails } = await supabase
        .from('sales')
        .select('*, customers!inner(full_name, email, phone, source)')
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <InboxList initialEmails={emails || []} />
        </div>
    )
}
