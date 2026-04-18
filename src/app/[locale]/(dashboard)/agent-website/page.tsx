import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentWebsiteEditor } from './components/AgentWebsiteEditor'

export default async function AgentWebsitePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, email, avatar_url, agent_bio, agent_title, agent_slug, agent_social_links, agent_specializations, agent_service_areas, agent_certifications, agent_years_experience, agent_is_public, agent_cover_url')
        .eq('id', user.id)
        .single()

    // Get portfolio count
    const { count: portfolioCount } = await supabase
        .from('portfolios')
        .select('id', { count: 'exact', head: true })
        .eq('agent_id', user.id)
        .eq('status', 'active')

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kişisel Web Sitesi</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Danışman profilinizi oluşturun ve portföylerinizi müşterilerinizle paylaşın.
                </p>
            </div>
            <AgentWebsiteEditor profile={profile} portfolioCount={portfolioCount || 0} />
        </div>
    )
}
