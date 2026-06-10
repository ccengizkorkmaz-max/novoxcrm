import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SurveyManager from './components/SurveyManager'

export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    const isManager = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'manager'

    if (!isManager) redirect('/crm')

    const { data: templates } = await supabase
        .from('survey_templates')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    // Get response counts per template
    const templateIds = (templates || []).map(t => t.id)
    let responseCounts: Record<string, { total: number; completed: number }> = {}

    if (templateIds.length > 0) {
        const { data: responses } = await supabase
            .from('survey_responses')
            .select('template_id, status')
            .in('template_id', templateIds)

        for (const r of (responses || [])) {
            if (!responseCounts[r.template_id]) responseCounts[r.template_id] = { total: 0, completed: 0 }
            responseCounts[r.template_id].total++
            if (r.status === 'completed') responseCounts[r.template_id].completed++
        }
    }

    return (
        <div className="space-y-4 p-4">
            <SurveyManager
                initialTemplates={templates || []}
                responseCounts={responseCounts}
            />
        </div>
    )
}
