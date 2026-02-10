'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Floor Plan Types ---
export interface FloorPlan {
    id: string
    project_id: string
    title: string
    image_url: string
    created_at: string
}

export interface UnitPosition {
    id: string
    floor_plan_id: string
    unit_id: string
    position_data: any // JSON structure for coords/shape
    unit?: {
        unit_number: string
        status: string
        price: number
        currency: string
        type: string
        area_gross: number
    }
}

// --- Upload Floor Plan ---
export async function uploadFloorPlan(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const file = formData.get('file') as File
    const projectId = formData.get('project_id') as string
    const title = formData.get('title') as string

    if (!file || !projectId || !title) {
        return { error: 'Eksik bilgi.' }
    }

    // Get tenant
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil hatası.' }

    // Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${projectId}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
        return { error: 'Resim yüklenemedi: ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage.from('floor-plans').getPublicUrl(fileName)

    // Save to DB
    const { error: dbError } = await supabase.from('project_floor_plans').insert({
        project_id: projectId,
        title,
        image_url: publicUrl,
        tenant_id: profile.tenant_id,
        created_by: user.id
    })

    if (dbError) {
        return { error: 'Veritabanı kaydı başarısız: ' + dbError.message }
    }

    revalidatePath(`/inventory`)
    return { success: true }
}

// --- Get Plans ---
export async function getProjectFloorPlans(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_floor_plans')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) return []
    return data as FloorPlan[]
}

// --- Save Unit Position ---
export async function saveUnitPosition(floorPlanId: string, unitId: string, positionData: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim.' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    // Check if position exists (upsert based on unique constraint floor_plan_id + unit_id?)
    // Or replace if unit is moved from another plan? No, a unit can be on multiple plans theoretically (e.g. site plan + floor plan)
    // But our unique constraint is (floor_plan_id, unit_id).

    // Let's use UPSERT
    const { error } = await supabase
        .from('unit_floor_positions')
        .upsert({
            floor_plan_id: floorPlanId,
            unit_id: unitId,
            position_data: positionData,
            tenant_id: profile?.tenant_id,
            updated_at: new Date().toISOString()
        }, { onConflict: 'floor_plan_id, unit_id' })

    if (error) {
        console.error('Position save error:', error)
        return { error: 'Konum kaydedilemedi.' }
    }

    revalidatePath('/inventory')
    return { success: true }
}

// --- Delete Unit Position ---
export async function deleteUnitPosition(floorPlanId: string, unitId: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('unit_floor_positions')
        .delete()
        .match({ floor_plan_id: floorPlanId, unit_id: unitId })

    if (error) return { error: 'Silinemedi' }
    return { success: true }
}

// --- Get Positions with Unit Info ---
export async function getFloorPlanPositions(floorPlanId: string) {
    const supabase = await createClient()

    // Join with units to get status, price etc.
    const { data, error } = await supabase
        .from('unit_floor_positions')
        .select(`
            id, 
            floor_plan_id, 
            unit_id, 
            position_data,
            units (
                unit_number,
                status,
                price,
                currency,
                type,
                area_gross
            )
        `)
        .eq('floor_plan_id', floorPlanId)

    if (error) return []

    // Transform to flat structure
    return data.map((item: any) => ({
        id: item.id,
        floor_plan_id: item.floor_plan_id,
        unit_id: item.unit_id,
        position_data: item.position_data,
        unit: item.units // nested object from join
    }))
}

// --- Delete Floor Plan ---
export async function deleteFloorPlan(planId: string) {
    const supabase = await createClient()

    // 1. Get image url to delete from storage
    const { data: plan } = await supabase.from('project_floor_plans').select('image_url').eq('id', planId).single()

    if (plan?.image_url) {
        const path = plan.image_url.split('/floor-plans/')[1]
        if (path) {
            await supabase.storage.from('floor-plans').remove([path])
        }
    }

    // 2. Delete DB record (cascade will delete positions)
    const { error } = await supabase.from('project_floor_plans').delete().eq('id', planId)

    if (error) return { error: 'Silinemedi.' }

    revalidatePath('/inventory')
    return { success: true }
}
