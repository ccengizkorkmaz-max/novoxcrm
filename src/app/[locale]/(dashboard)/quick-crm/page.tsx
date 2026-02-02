import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { QuickCRMContent } from './components/QuickCRMContent'

export default async function QuickCRMPage() {
    const supabase = await createClient()
    const t = await getTranslations('QuickCRM')

    // Fetch initial data
    const { data: projects } = await supabase.from('projects').select('id, name').order('name')
    const { data: customers } = await supabase.from('customers').select('id, full_name, phone, email').order('created_at', { ascending: false }).limit(20)
    const { data: units } = await supabase.from('units').select('*, projects(id, name)').eq('status', 'For Sale').order('unit_number').limit(100)
    const { data: templates } = await supabase.from('payment_plan_templates').select('*').order('name')

    return (
        <div className="flex flex-col h-full gap-4 overflow-hidden">
            <div className="flex flex-col gap-1 px-1">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</h1>
                <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest">{t('description')}</p>
            </div>

            <QuickCRMContent
                initialProjects={projects || []}
                initialCustomers={customers || []}
                initialUnits={units || []}
                templates={templates || []}
            />
        </div>
    )
}
