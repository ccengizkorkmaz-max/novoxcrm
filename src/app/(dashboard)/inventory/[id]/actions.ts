'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateUnit(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    const features = formData.getAll('features')
    console.log('Update Unit FormData Keys:', Array.from(formData.keys()))
    console.log('Update Unit room_areas raw:', formData.get('room_areas'))

    // Parse room areas from form data
    const roomAreasJson = formData.get('room_areas') as string
    let roomAreas = null
    try {
        if (roomAreasJson) {
            const parsed = JSON.parse(roomAreasJson)
            roomAreas = parsed.length > 0 ? parsed : null
        }
    } catch (e) {
        console.error('Failed to parse room_areas:', e)
    }

    const updates = {
        unit_number: formData.get('unit_number') as string,
        type: formData.get('type') as string,
        status: formData.get('status') as string,
        price: formData.get('price') ? Number(formData.get('price')) : null,
        currency: formData.get('currency') as string,
        area_gross: formData.get('area_gross') ? Number(formData.get('area_gross')) : null,
        area_net: formData.get('area_net') ? Number(formData.get('area_net')) : null,
        floor: formData.get('floor') ? Number(formData.get('floor')) : null,
        direction: formData.get('direction') as string,

        // Extended fields
        image_url: formData.get('image_url') as string,
        description: formData.get('description') as string,
        view: formData.get('view') as string,
        ada_no: formData.get('ada_no') as string,
        parsel_no: formData.get('parsel_no') as string,
        kdv_rate: formData.get('kdv_rate') ? Number(formData.get('kdv_rate')) : 1,
        max_discount_rate: formData.get('max_discount_rate') ? Number(formData.get('max_discount_rate')) : null,
        features: features, // Stored as JSONB array
        room_areas: roomAreas, // Stored as JSONB array
        unit_category: formData.get('unit_category') as string,
        block: formData.get('block') as string,

        // New Counts & Features
        balcony_count: formData.get('balcony_count') ? Number(formData.get('balcony_count')) : 0,
        bathroom_count: formData.get('bathroom_count') ? Number(formData.get('bathroom_count')) : 1,

        parking_type: formData.get('parking_type') as string,
        heating_type: formData.get('heating_type') as string,
        kitchen_type: formData.get('kitchen_type') as string,
        has_builtin_kitchen: formData.get('has_builtin_kitchen') === 'true',
        has_master_bathroom: formData.get('has_master_bathroom') === 'true'
    }

    const { error } = await supabase
        .from('units')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Update Unit Error:', error)
        return { error: 'Failed to update unit: ' + error.message }
    }

    revalidatePath(`/inventory/${id}`)
    revalidatePath('/inventory')
    return { success: true }
}

export async function deleteUnit(unitId: string, projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId)

    if (error) {
        console.error('Delete Unit Error:', error)
        return { error: 'Failed to delete unit' }
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath('/inventory')
    return { success: true }
}
