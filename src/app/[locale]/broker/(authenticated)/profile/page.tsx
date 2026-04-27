import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileEditor } from './ProfileEditor'

export default async function BrokerProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/broker/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, profile_photo_url, agent_title, agent_bio, broker_slug, agent_slug, agent_social_links, agent_specializations, agent_service_areas')
        .eq('id', user.id)
        .single()

    // Also check broker_applications for additional info
    const { data: brokerApp } = await supabase
        .from('broker_applications')
        .select('company_name, phone')
        .eq('email', user.email)
        .maybeSingle()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profilim</h1>
                <p className="text-sm text-slate-500 mt-1">Profil bilgilerinizi düzenleyin ve paylaşılabilir profil sayfanızı yönetin</p>
            </div>

            <ProfileEditor
                profile={{
                    ...profile,
                    phone: profile?.phone || brokerApp?.phone || '',
                    slug: profile?.broker_slug || profile?.agent_slug || '',
                }}
            />
        </div>
    )
}
