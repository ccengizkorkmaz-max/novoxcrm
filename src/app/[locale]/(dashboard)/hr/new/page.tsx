import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import EmployeeForm from '../components/EmployeeForm'

export default async function NewEmployeePage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()
    const t = await getTranslations('HR')

    // 1. Fetch potential managers (all employees)
    const { data: managers } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'Active')
        .order('first_name', { ascending: true })

    // 2. Fetch all CRM users (profiles)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{t('newEmployee')}</h1>
                <p className="text-muted-foreground">{t('description')}</p>
            </div>

            <EmployeeForm
                managers={managers || []}
                users={users || []}
            />
        </div>
    )
}
