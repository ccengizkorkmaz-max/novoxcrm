import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TemplateEditor } from '../../components/TemplateEditor'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()
    const { data: template } = await adminSupabase
        .from('email_templates')
        .select('*')
        .eq('id', id)
        .single()

    if (!template) redirect('/email')

    return <TemplateEditor template={template} />
}
