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
        supabase.from('customers').select('id, full_name, phone, email, source, created_at').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, full_name, role, is_external').eq('tenant_id', profile.tenant_id).eq('is_active', true).neq('role', 'broker').or('is_external.is.null,is_external.eq.false').order('full_name')
    ])

    const rawContacts = rawContactsRes.data || []
    const customers = customersRes.data || []
    const profiles = profilesRes.data || []

    // Build unique contact list combining both contacts and customers
    const allItems: any[] = []

    // First add all raw contacts
    for (const c of rawContacts) {
        allItems.push({ ...c, isCustomer: false })
    }

    // Then add all customers (and mark matching contacts as isCustomer)
    for (const cust of customers) {
        const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, '') : ''
        const cleanEmail = cust.email ? cust.email.toLowerCase().trim() : ''

        let foundMatch = false
        for (const item of allItems) {
            const itemPhone = item.phone ? item.phone.replace(/\D/g, '') : ''
            const itemEmail = item.email ? item.email.toLowerCase().trim() : ''
            if ((cleanPhone && itemPhone && itemPhone === cleanPhone) || (cleanEmail && itemEmail && itemEmail === cleanEmail)) {
                item.isCustomer = true
                foundMatch = true
            }
        }

        if (!foundMatch) {
            allItems.push({
                id: cust.id,
                full_name: cust.full_name,
                phone: cust.phone,
                email: cust.email,
                source: cust.source || 'Müşteri Kaydı',
                isCustomer: true,
                created_at: cust.created_at
            })
        }
    }

    // Sort combined contacts by created_at descending
    allItems.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Kontak Listesi</h2>
                <NewContactModal profiles={profiles} triggerText="Yeni Kontak Ekle" />
            </div>
            
            <ContactsClient contacts={allItems} profiles={profiles} locale={locale} />
        </div>
    )
}
