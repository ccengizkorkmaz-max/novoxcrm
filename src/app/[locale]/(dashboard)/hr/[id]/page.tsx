import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import EmployeeProfile from '@/app/[locale]/(dashboard)/hr/components/EmployeeProfile'

export default async function EmployeePage(props: { params: Promise<{ id: string; locale: string }> }) {
    const params = await props.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        notFound()
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner' && profile?.role !== 'admin' && profile?.role !== 'crm_manager') {
        notFound()
    }

    const t = await getTranslations('HR')

    const { data: employee, error } = await supabase
        .from('employees')
        .select(`
            *,
            manager:manager_id(id, first_name, last_name),
            crm_user:profile_id(id)
        `)
        .eq('id', params.id)
        .single()

    if (error || !employee) {
        notFound()
    }

    const { data: documents } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', params.id)
        .order('created_at', { ascending: false })

    return (
        <div className="flex flex-col gap-6">
            <EmployeeProfile
                employee={employee}
                documents={documents || []}
            />
        </div>
    )
}
