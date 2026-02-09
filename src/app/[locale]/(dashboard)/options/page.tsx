import { createClient } from '@/lib/supabase/server'
import OptionList from './components/OptionList'
import { getTranslations } from 'next-intl/server'

export default async function OptionsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('Options')

    // Fetch units with status 'Reserved'
    // We join with projects to get project name
    // We try to join with sales to get customer info (since reserved units usually have a reservation sale)
    const { data: options } = await supabase
        .from('units')
        .select(`
            *,
            projects(name),
            sales(
                id,
                status,
                customers(full_name),
                reservation_expiry,
                final_price,
                currency
            ),

            offers(
                id,
                status,
                created_at
            )
        `)
        .eq('status', 'Reserved')
        .order('created_at', { ascending: false })


    // Fetch Payment Plan Templates
    const { data: templates } = await supabase
        .from('payment_plan_templates')
        .select('*')
        .order('name', { ascending: true })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            </div>

            <OptionList options={options || []} templates={templates || []} />
        </div>
    )

}
