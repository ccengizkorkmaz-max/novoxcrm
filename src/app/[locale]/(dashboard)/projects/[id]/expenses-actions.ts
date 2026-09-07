'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ProjectExpense {
    id: string
    tenant_id: string
    project_id: string
    title: string
    category: string
    amount: number
    currency: string
    expense_date: string
    invoice_no?: string | null
    supplier?: string | null
    notes?: string | null
    receipt_url?: string | null
    created_at?: string
    created_by?: string | null
    profiles?: { full_name?: string } | null
}

export async function getProjectExpenses(projectId: string): Promise<ProjectExpense[]> {
    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
        .from('project_expenses')
        .select('*, profiles:created_by(full_name)')
        .eq('project_id', projectId)
        .order('expense_date', { ascending: false })

    if (error) {
        console.error('Error fetching project expenses:', error)
        return []
    }

    return data || []
}

export async function createProjectExpense(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    const isAllowed = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'super_admin' || profile?.role === 'manager' || profile?.role === 'crm_manager'
    if (!isAllowed) {
        return { error: 'Bu işlem için yönetici yetkisi gereklidir.' }
    }

    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string
    const category = formData.get('category') as string
    const amountStr = formData.get('amount') as string
    const currency = (formData.get('currency') as string) || 'TRY'
    const expenseDate = formData.get('expense_date') as string
    const invoiceNo = formData.get('invoice_no') as string
    const supplier = formData.get('supplier') as string
    const notes = formData.get('notes') as string

    if (!projectId || !title || !category || !amountStr || !expenseDate) {
        return { error: 'Lütfen zorunlu alanları (Proje, Başlık, Kategori, Tutar, Tarih) doldurunuz.' }
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
        return { error: 'Geçersiz harcama tutarı.' }
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
        .from('project_expenses')
        .insert({
            tenant_id: profile.tenant_id,
            project_id: projectId,
            title: title.trim(),
            category: category.trim(),
            amount,
            currency,
            expense_date: expenseDate,
            invoice_no: invoiceNo ? invoiceNo.trim() : null,
            supplier: supplier ? supplier.trim() : null,
            notes: notes ? notes.trim() : null,
            created_by: user.id
        })

    if (error) {
        console.error('Error creating project expense:', error)
        return { error: 'Gider kaydedilemedi: ' + error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/inventory')

    return { success: true }
}

export async function deleteProjectExpense(expenseId: string, projectId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAllowed = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'super_admin'
    if (!isAllowed) {
        return { error: 'Harcama silmek için admin yetkisi gereklidir.' }
    }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
        .from('project_expenses')
        .delete()
        .eq('id', expenseId)

    if (error) {
        console.error('Error deleting expense:', error)
        return { error: 'Silme işlemi başarısız: ' + error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/inventory')

    return { success: true }
}

/**
 * Projedeki tüm harcamaları toplayıp satılabilir toplam m² üzerinden
 * her bir ünitenin `cost` alanına m² oranında yansıtır.
 */
export async function syncExpensesToUnits(
    projectId: string, 
    allocationBasis: 'gross' | 'net' = 'gross'
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAllowed = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'super_admin'
    if (!isAllowed) {
        return { error: 'Ünite maliyetlerini dağıtmak için admin yetkisi gereklidir.' }
    }

    const adminSupabase = createAdminClient()

    // 1. Projedeki tüm harcamaları topla
    const { data: expenses, error: expError } = await adminSupabase
        .from('project_expenses')
        .select('amount, currency')
        .eq('project_id', projectId)

    if (expError) {
        return { error: 'Harcamalar yüklenirken hata oluştu: ' + expError.message }
    }

    const totalExpenseAmount = (expenses || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)

    if (totalExpenseAmount <= 0) {
        return { error: 'Projede kayıtlı herhangi bir harcama bulunmuyor. Önce harcama kalemleri giriniz.' }
    }

    // 2. Projedeki üniteleri çek
    const { data: units, error: unitsError } = await adminSupabase
        .from('units')
        .select('id, unit_number, area_gross, area_net')
        .eq('project_id', projectId)

    if (unitsError || !units || units.length === 0) {
        return { error: 'Projede maliyet atanacak ünite bulunamadı.' }
    }

    // 3. Toplam m²'yi hesapla
    const areaField = allocationBasis === 'net' ? 'area_net' : 'area_gross'
    let totalArea = 0

    for (const u of units) {
        const area = Number(u[areaField]) || 0
        if (area > 0) {
            totalArea += area
        }
    }

    if (totalArea <= 0) {
        return { 
            error: `Ünitelerin ${allocationBasis === 'net' ? 'Net' : 'Brüt'} m² bilgileri girilmemiş. Maliyet dağıtımı için ünitelerin m² alanları gereklidir.` 
        }
    }

    // 4. Birim m² maliyeti (₺ / m²)
    const unitCostPerM2 = totalExpenseAmount / totalArea

    // 5. Her üniteyi güncelle
    let updatedCount = 0
    for (const u of units) {
        const area = Number(u[areaField]) || 0
        if (area > 0) {
            const calculatedCost = Math.round(area * unitCostPerM2)
            await adminSupabase
                .from('units')
                .update({ cost: calculatedCost })
                .eq('id', u.id)
            updatedCount++
        }
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/inventory')

    return {
        success: true,
        totalExpense: totalExpenseAmount,
        totalArea,
        costPerM2: Math.round(unitCostPerM2),
        updatedUnits: updatedCount
    }
}
