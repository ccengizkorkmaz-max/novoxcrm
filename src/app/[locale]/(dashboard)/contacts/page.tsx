import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsView } from './components/ContactsView'

export default async function ContactsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: contacts } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6 w-full">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Kişiler</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Ev sahipleri, alıcılar ve kiracılarınızı yönetin.
                </p>
            </div>
            <ContactsView contacts={contacts || []} />
        </div>
    )
}
