'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createEmployee(data: any) {
    const supabase = await createClient()

    // Sanitize dates
    const sanitizedData = {
        ...data,
        hire_date: data.hire_date || null,
        termination_date: data.termination_date || null
    }

    const { data: employee, error } = await supabase
        .from('employees')
        .insert([sanitizedData])
        .select()
        .single()

    if (error) throw error

    revalidatePath('/[locale]/(dashboard)/hr', 'layout')
    return employee
}

export async function updateEmployee(id: string, data: any) {
    const supabase = await createClient()

    // Sanitize dates
    const sanitizedData = {
        ...data,
        hire_date: data.hire_date || null,
        termination_date: data.termination_date || null
    }

    const { data: employee, error } = await supabase
        .from('employees')
        .update(sanitizedData)
        .eq('id', id)
        .select()
        .single()

    if (error) throw error

    revalidatePath('/[locale]/(dashboard)/hr', 'layout')
    revalidatePath(`/[locale]/(dashboard)/hr/${id}`, 'layout')
    return employee
}

export async function deleteEmployee(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

    if (error) throw error

    revalidatePath('/[locale]/(dashboard)/hr', 'layout')
}

export async function addEmployeeDocument(data: any) {
    const supabase = await createClient()
    const { data: doc, error } = await supabase
        .from('employee_documents')
        .insert([data])
        .select()
        .single()

    if (error) throw error

    revalidatePath(`/[locale]/(dashboard)/hr/${data.employee_id}`, 'layout')
    return doc
}

export async function deleteEmployeeDocument(id: string, employeeId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', id)

    if (error) throw error

    revalidatePath(`/[locale]/(dashboard)/hr/${employeeId}`, 'layout')
}
