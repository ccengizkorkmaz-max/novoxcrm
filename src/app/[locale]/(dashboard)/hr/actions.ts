'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function uploadEmployeePhoto(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) throw new Error('No file provided')

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `photos/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminClient.storage
        .from('hr-documents')
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
    }

    const { data: { publicUrl } } = adminClient.storage
        .from('hr-documents')
        .getPublicUrl(filePath)

    return publicUrl
}

export async function createEmployee(data: any) {
    const supabase = await createClient()

    // Sanitize dates
    const sanitizedData = {
        ...data,
        hire_date: data.hire_date || null,
        termination_date: data.termination_date || null
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) throw new Error('Tenant ID not found')

    const { data: employee, error } = await supabase
        .from('employees')
        .insert([{ ...sanitizedData, tenant_id: profile.tenant_id }])
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

    // Get employee's tenant_id
    const { data: employee } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('id', data.employee_id)
        .single()

    if (!employee) throw new Error('Employee not found')

    // Include tenant_id in the document data
    const { data: doc, error } = await supabase
        .from('employee_documents')
        .insert([{ ...data, tenant_id: employee.tenant_id }])
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
