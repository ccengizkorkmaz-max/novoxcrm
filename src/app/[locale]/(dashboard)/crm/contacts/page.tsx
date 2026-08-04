import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage({ params: { locale } }: { params: { locale: string } }) {
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

    // Fetch contacts with related customer info to determine badge
    const { data: contacts, error } = await supabase
        .from('contacts')
        .select(`
            *,
            customers!contacts_phone_fkey (id),
            customers_email:customers!contacts_email_fkey (id)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    // Since Supabase might not have fkeys for phone/email natively, we can just fetch all customers 
    // and map them in memory, because foreign keys on arbitrary text fields are tricky in Supabase.
    // Let's actually fetch all contacts and customers separately to map them.
    const { data: rawContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        
    const { data: customers } = await supabase
        .from('customers')
        .select('id, phone, email')
        .eq('tenant_id', profile.tenant_id)

    // Map customers
    const customerPhoneSet = new Set(customers?.filter(c => c.phone).map(c => c.phone.replace(/[^\d]/g, '')))
    const customerEmailSet = new Set(customers?.filter(c => c.email).map(c => c.email.toLowerCase().trim()))

    const processedContacts = (rawContacts || []).map(contact => {
        let isCustomer = false;
        if (contact.phone && customerPhoneSet.has(contact.phone.replace(/[^\d]/g, ''))) isCustomer = true;
        if (contact.email && customerEmailSet.has(contact.email.toLowerCase().trim())) isCustomer = true;
        
        return {
            ...contact,
            isCustomer
        }
    })

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Kontak Listesi</h2>
            </div>
            
            <ContactsClient contacts={processedContacts} locale={locale} />
        </div>
    )
}
