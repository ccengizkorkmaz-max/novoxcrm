'use server'

import { createClient } from '@/lib/supabase/server'

export type LogActionType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ERROR' | 'SYNC' | 'EXPORT' | 'IMPORT'
export type LogEntityType = 'Customer' | 'Sale' | 'Offer' | 'Payment' | 'System' | 'User' | 'Settings'
export type LogStatus = 'Success' | 'Error' | 'Warning'

export async function logSystemAction(params: {
    action_type: LogActionType
    entity_type: LogEntityType
    entity_id?: string
    status: LogStatus
    message: string
    details?: any
}) {
    try {
        const supabase = await createClient()

        // Get current user and tenant context
        const { data: { user } } = await supabase.auth.getUser()

        // If no user context, we still attempt to log if this is triggered by a webhook (assuming service key is used elsewhere)
        // But for standard server actions, we rely on the session user.
        let tenant_id = null
        let user_id = user?.id || null

        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('tenant_id, full_name')
                .eq('id', user.id)
                .single()
            tenant_id = profile?.tenant_id

            // Explicitly burn the username into the JSON log for historical safety
            const extendedDetails = typeof params.details === 'object' && params.details !== null ? { ...params.details } : { raw_details: params.details }
            extendedDetails.user_name = profile?.full_name || 'Bilinmiyor'
            params.details = extendedDetails
        }

        // If we can't determine the tenant, we just skip logging unless we make it optional in the schema.
        // The schema requires tenant_id.
        if (!tenant_id) {
            console.warn('[SystemLog] Skipping log because tenant_id could not be determined:', params.message)
            return false
        }

        const { error } = await supabase.from('system_logs').insert({
            tenant_id,
            user_id,
            action_type: params.action_type,
            entity_type: params.entity_type,
            entity_id: params.entity_id || null,
            status: params.status,
            message: params.message,
            details: params.details || null,
        })

        if (error) {
            console.error('[SystemLog] Failed to insert log:', error)
            return false
        }
        
        return true
    } catch (e) {
        console.error('[SystemLog] Exception during logging:', e)
        return false
    }
}
