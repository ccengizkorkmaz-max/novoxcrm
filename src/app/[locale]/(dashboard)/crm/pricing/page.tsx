import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PricingStudioClient from './PricingStudioClient'

export const metadata = {
    title: 'Fiyat & Teklif Masası | NovoCRM',
    description: 'Satış temsilcileri için dinamik fiyatlandırma, iskonto, çoklu ödeme planı ve finansal simülatör araçları.'
}

export default async function PricingPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*, roles(*)')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin' || (profile?.roles as any)?.name === 'admin'
    const isManager = isAdmin || profile?.role === 'manager' || (profile?.roles as any)?.name === 'manager'

    // Fetch projects
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name, city, district')
        .order('name')

    // Fetch units (Available or Reserved)
    const { data: units } = await supabase
        .from('units')
        .select('id, project_id, unit_number, block, floor, gross_sqm, net_sqm, type, price, currency, status, cost, direction')
        .order('unit_number')

    // Fetch customers (latest 200)
    const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, phone, email, company_name')
        .order('created_at', { ascending: false })
        .limit(200)

    // Fetch payment templates
    const { data: templates } = await supabase
        .from('payment_templates')
        .select('*')
        .order('name')

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 bg-slate-50/50 dark:bg-slate-950">
            <PricingStudioClient
                projects={projects || []}
                units={units || []}
                customers={customers || []}
                templates={templates || []}
                currentUser={{
                    id: user.id,
                    name: profile?.full_name || 'Satış Temsilcisi',
                    role: profile?.role || 'sales',
                    isAdmin,
                    isManager
                }}
            />
        </div>
    )
}
