import SalesAssistant from '@/components/ai/SalesAssistant'
import { getAiSettings } from '@/app/[locale]/ai/actions'
import { createAdminClient } from '@/lib/supabase/admin'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function GlobalAiAssistantPage() {
    // Determine tenant (master or first one)
    const adminSupabase = createAdminClient()
    const { data: firstProject } = await adminSupabase.from('projects').select('tenant_id').limit(1).maybeSingle()

    const aiSettings = await getAiSettings(firstProject?.tenant_id || '')

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            <SalesAssistant project={null} aiSettings={aiSettings} />
        </div>
    )
}
