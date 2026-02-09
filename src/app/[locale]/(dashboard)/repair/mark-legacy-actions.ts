'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markUnitAsLegacy(unitId: string) {
    const supabase = await createClient()
    const logs: string[] = []

    try {
        logs.push(`🔍 Marking unit ${unitId} as legacy...`)

        // Get unit details first
        const { data: unit, error: fetchError } = await supabase
            .from('units')
            .select('id, unit_number, block, status, is_legacy, projects(name)')
            .eq('id', unitId)
            .single()

        if (fetchError || !unit) {
            logs.push('❌ Unit not found: ' + (fetchError?.message || 'No data'))
            return { success: false, logs, error: 'Unit not found' }
        }

        logs.push(`✅ Found Unit: ${unit.projects?.[0]?.name || 'Unknown Project'} - ${unit.block} - ${unit.unit_number}`)
        logs.push(`ℹ️ Current Status: ${unit.status}`)
        logs.push(`ℹ️ Current is_legacy: ${unit.is_legacy}`)

        if (unit.is_legacy) {
            logs.push('✅ Unit is already marked as legacy.')
            return { success: true, logs }
        }

        // Update unit to mark as legacy
        const { error: updateError } = await supabase
            .from('units')
            .update({ is_legacy: true })
            .eq('id', unitId)

        if (updateError) {
            logs.push('❌ Error updating unit: ' + updateError.message)
            return { success: false, logs, error: updateError.message }
        }

        logs.push('✅ Unit successfully marked as legacy (is_legacy = true)')
        logs.push('ℹ️ This unit will no longer appear in dashboard statistics.')

        revalidatePath('/dashboard')
        revalidatePath('/inventory')

        return { success: true, logs }

    } catch (error: any) {
        logs.push('❌ CRITICAL ERROR: ' + error.message)
        return { success: false, logs, error: error.message }
    }
}
