import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { CommunicationManager } from '../components/CommunicationManager'

export default async function CommunicationPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const adminSupabase = createAdminClient()
    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) redirect('/login')

    // Only managers/owners can access
    const isManager = ['manager', 'owner', 'admin'].includes(profile.role || '')
    if (!isManager) redirect('/')

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-red-400">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </div>
                    İletişim Yönetimi
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Opt-out kayıtları, iletişim engelleri ve işlem geçmişi
                </p>
            </div>

            <CommunicationManager tenantId={profile.tenant_id} />
        </div>
    )
}
