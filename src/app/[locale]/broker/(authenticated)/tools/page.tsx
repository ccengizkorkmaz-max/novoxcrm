import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SharingTools } from './SharingTools'

export default async function BrokerToolsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/broker/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, broker_slug, agent_slug, phone, email')
        .eq('id', user.id)
        .single()

    // Get broker's accessible projects
    const { data: brokerProjects } = await supabase
        .from('broker_projects')
        .select('projects(id, name, city, district, cover_image_url)')
        .eq('broker_id', user.id)

    const projects = brokerProjects?.map((bp: any) => bp.projects).filter(Boolean) || []
    const slug = profile?.broker_slug || profile?.agent_slug || ''

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Paylaşım Araçları</h1>
                <p className="text-sm text-slate-500 mt-1">WhatsApp ve sosyal medya üzerinden paylaşabileceğiniz hazır linkler ve kartlar</p>
            </div>
            <SharingTools
                brokerName={profile?.full_name || ''}
                brokerSlug={slug}
                brokerPhone={profile?.phone || ''}
                brokerEmail={profile?.email || ''}
                projects={projects}
            />
        </div>
    )
}
