import { createClient } from '@/lib/supabase/server'
import { BrokerDocumentsClient } from './BrokerDocumentsClient'

export default async function BrokerDocumentsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const { data: documents } = await supabase
        .from('document_library')
        .select('id, name, category, file_url, thumbnail_url, created_at, projects(name)')
        .order('created_at', { ascending: false })

    return <BrokerDocumentsClient documents={documents || []} />
}
