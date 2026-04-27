import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Get broker application data for pre-fill
    const adminClient = createAdminClient()
    const { data: brokerApp } = await adminClient
        .from('broker_applications')
        .select('full_name, company_name, email, phone')
        .eq('email', user.email)
        .maybeSingle()

    // Auto-sync: if profile has missing fields but broker_applications has them, update profile
    if (profile && brokerApp) {
        const updates: Record<string, string> = {}
        if (!profile.phone && brokerApp.phone) updates.phone = brokerApp.phone
        if (!profile.agent_title && brokerApp.company_name) updates.agent_title = `${brokerApp.company_name} - Gayrimenkul Danışmanı`
        if (!profile.full_name && brokerApp.full_name) updates.full_name = brokerApp.full_name

        if (Object.keys(updates).length > 0) {
            await adminClient.from('profiles').update(updates).eq('id', user.id)
            // Merge into profile for display
            Object.assign(profile, updates)
        }
    }

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
                    company_name: brokerApp?.company_name || '',
                }}
            />
        </div>
    )
}
