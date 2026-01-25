'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateProject(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const amenities = formData.getAll('amenities')

    const updates = {
        project_code: formData.get('project_code') as string,
        name: formData.get('name') as string,
        manager_name: formData.get('manager_name') as string,
        phase_count: Number(formData.get('phase_count')),
        status: formData.get('status') as string,
        address: formData.get('address') as string,
        district: formData.get('district') as string,
        city: formData.get('city') as string,
        website_url: formData.get('website_url') as string,
        image_url: formData.get('image_url') as string,
        latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
        longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
        start_date: formData.get('start_date') ? new Date(formData.get('start_date') as string).toISOString() : null,
        delivery_date_planned: formData.get('delivery_date_planned') ? new Date(formData.get('delivery_date_planned') as string).toISOString() : null,
        delivery_date_actual: formData.get('delivery_date_actual') ? new Date(formData.get('delivery_date_actual') as string).toISOString() : null,
        ada_no: formData.get('ada_no') as string,
        parsel_no: formData.get('parsel_no') as string,
        amenities: amenities // Stored as JSONB array of strings
    }

    const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Update Project Error:', error)
        return { error: 'Failed to update project' }
    }

    revalidatePath(`/projects/${id}`)
    revalidatePath('/projects')
    return { success: true }
}

export async function batchCreateUnits(formData: FormData) {
    const supabase = await createClient()
    const projectId = formData.get('project_id') as string
    const unitCategory = formData.get('unit_category') as string
    const type = formData.get('type') as string
    const count = Number(formData.get('count'))
    const startNumber = Number(formData.get('start_number')) || 1
    const block = formData.get('block') as string || 'A'

    // Optional
    const areaGross = formData.get('area_gross') ? Number(formData.get('area_gross')) : null
    const price = formData.get('price') ? Number(formData.get('price')) : 0
    const currency = formData.get('currency') as string || 'TRY'
    const maxDiscountRate = formData.get('max_discount_rate') ? Number(formData.get('max_discount_rate')) : 0

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    // Parse room areas from form data
    const roomAreasJson = formData.get('room_areas') as string
    let roomAreas = []
    try {
        if (roomAreasJson) {
            roomAreas = JSON.parse(roomAreasJson)
        }
    } catch (e) {
        console.error('Failed to parse room_areas:', e)
    }

    const units = []
    for (let i = 0; i < count; i++) {
        units.push({
            project_id: projectId,
            unit_number: `${block}-${startNumber + i}`,
            unit_category: unitCategory,
            type: type,
            status: 'For Sale',
            price: price,
            currency: currency,
            area_gross: areaGross,
            floor: Math.floor((startNumber + i) / 4) + 1,
            max_discount_rate: maxDiscountRate,
            block: block,
            // Unit features
            parking_type: formData.get('parking_type') as string || null,
            heating_type: formData.get('heating_type') as string || null,
            has_builtin_kitchen: formData.get('has_builtin_kitchen') === 'true',
            direction: formData.get('direction') as string || null,
            kitchen_type: formData.get('kitchen_type') as string || null,
            has_master_bathroom: formData.get('has_master_bathroom') === 'true',
            room_areas: roomAreas.length > 0 ? roomAreas : null
        })
    }

    const { error } = await supabase
        .from('units')
        .insert(units)

    if (error) {
        console.error('Batch Create Error:', error)
        return { error: 'Failed to create units: ' + error.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
