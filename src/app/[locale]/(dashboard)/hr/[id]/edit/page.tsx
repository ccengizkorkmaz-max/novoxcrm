import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import EmployeeForm from '../../components/EmployeeForm'

export default async function EditEmployeePage(props: { params: Promise<{ id: string; locale: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const t = await getTranslations('HR')

    // 1. Fetch employee data
    const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', params.id)
        .single()

    if (error || !employee) {
        notFound()
    }

    // 2. Fetch potential managers (all employees)
    const { data: managers } = await supabase
        .from('employees')
        .select('id, first_name, last_name')
        .eq('status', 'Active')
        .order('first_name', { ascending: true })

    // 3. Fetch all CRM users (profiles)
    const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name', { ascending: true })

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{t('table.actions.edit')}</h1>
                <p className="text-muted-foreground">{employee.first_name} {employee.last_name}</p>
            </div>

            <EmployeeForm
                initialData={employee}
                managers={managers || []}
                users={users || []}
                id={params.id}
            />
        </div>
    )
}
