'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function importUnitsFromExcel(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const projectId = formData.get('project_id') as string
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'File is required' }
    }

    try {
        // Read file content
        const text = await file.text()
        const lines = text.split('\n').filter(line => line.trim())

        if (lines.length < 2) {
            return { error: 'File is empty or invalid' }
        }

        // Parse CSV/Excel (simple implementation)
        const headers = lines[0].split(/[,;\t]/).map(h => h.trim().toLowerCase())
        const units = []

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(/[,;\t]/).map(v => v.trim())
            const unit: any = {
                tenant_id: profile.tenant_id,
                project_id: projectId,
                created_by: user.id,
                currency: 'TRY',
                status: 'For Sale'
            }

            headers.forEach((header, index) => {
                const value = values[index]
                if (!value) return

                switch (header) {
                    case 'unit_number':
                    case 'ünite_no':
                        unit.unit_number = value
                        break
                    case 'type':
                    case 'tip':
                        unit.type = value
                        break
                    case 'status':
                    case 'durum':
                        unit.status = value
                        break
                    case 'price':
                    case 'fiyat':
                        unit.price = parseFloat(value) || 0
                        break
                    case 'area_gross':
                    case 'brüt_alan':
                    case 'brut':
                        unit.area_gross = parseFloat(value) || null
                        break
                    case 'floor':
                    case 'kat':
                        unit.floor = parseInt(value) || null
                        break
                    case 'block':
                    case 'blok':
                        unit.block = value
                        break
                }
            })

            if (unit.unit_number && unit.type) {
                units.push(unit)
            }
        }

        if (units.length === 0) {
            return { error: 'No valid units found in file' }
        }

        // Insert units
        const { error } = await supabase
            .from('units')
            .insert(units)

        if (error) {
            console.error('Import Error:', error)
            return { error: 'Failed to import units: ' + error.message }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true, count: units.length }
    } catch (error) {
        console.error('Parse Error:', error)
        return { error: 'Failed to parse file' }
    }
}
