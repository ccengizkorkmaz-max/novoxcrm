import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsClient } from './ContactsClient'

export const dynamic = 'force-dynamic'

import NewContactModal from '@/app/[locale]/(dashboard)/crm/components/NewContactModal'

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

    const [rawContactsRes, customersRes, profilesRes] = await Promise.all([
        supabase.from('contacts').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
        supabase.from('customers').select('id, phone, email').eq('tenant_id', profile.tenant_id),
        supabase.from('profiles').select('id, full_name').eq('tenant_id', profile.tenant_id).eq('is_active', true).order('full_name')
    ])

    const rawContacts = rawContactsRes.data || []
    const customers = customersRes.data || []
    const profiles = profilesRes.data || []

    // Map customers
    const customerPhoneSet = new Set(customers.filter(c => c.phone).map(c => c.phone.replace(/[^\d]/g, '')))
    const customerEmailSet = new Set(customers.filter(c => c.email).map(c => c.email.toLowerCase().trim()))

    const processedContacts = rawContacts.map(contact => {
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
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Kontak Listesi</h2>
                <NewContactModal profiles={profiles} triggerText="Yeni Kontak Ekle" />
            </div>
            
            <ContactsClient contacts={processedContacts} profiles={profiles} locale={locale} />
        </div>
    )
}
