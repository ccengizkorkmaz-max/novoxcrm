import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, full_name, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        redirect('/')
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()

    const { data: contacts, error } = await adminSupabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Contacts fetch error:', error)
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <ContactsClient 
                contacts={contacts || []} 
                locale={locale} 
                userRole={profile.role}
            />
        </div>
    )
}
