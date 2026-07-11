'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAbTest(params: {
    name: string
    scriptAId: string
    scriptBId: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'Tenant not found' }

    // Check if either script already has an active test
    const { data: existing } = await supabase
        .from('outreach_ab_tests')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'running')
        .or(`script_a_id.eq.${params.scriptAId},script_b_id.eq.${params.scriptAId},script_a_id.eq.${params.scriptBId},script_b_id.eq.${params.scriptBId}`)
        .limit(1)
        .maybeSingle()

    if (existing) {
        return { error: 'Bu script zaten aktif bir A/B testinde' }
    }

    const { data, error } = await supabase
        .from('outreach_ab_tests')
        .insert({
            tenant_id: profile.tenant_id,
            name: params.name,
            script_a_id: params.scriptAId,
            script_b_id: params.scriptBId,
            status: 'running',
            traffic_split: 0.5,
            stats_a: { calls: 0, answered: 0, appointments: 0, avg_duration: 0 },
            stats_b: { calls: 0, answered: 0, appointments: 0, avg_duration: 0 }
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/outreach')
    return { data }
}

export async function getActiveAbTests(tenantId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('outreach_ab_tests')
        .select(`
            *
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'running')
        .order('created_at', { ascending: false })

    return data || []
}

export async function getAbTestForScript(scriptId: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('outreach_ab_tests')
        .select('*')
        .eq('status', 'running')
        .or(`script_a_id.eq.${scriptId},script_b_id.eq.${scriptId}`)
        .maybeSingle()

    return data
}

export async function updateAbTestStats(
    testId: string,
    variant: 'a' | 'b',
    outcome: { answered: boolean; appointment: boolean; duration: number }
) {
    const supabase = await createClient()

    const { data: test } = await supabase
        .from('outreach_ab_tests')
        .select('stats_a, stats_b')
        .eq('id', testId)
        .single()

    if (!test) return

    const statsKey = variant === 'a' ? 'stats_a' : 'stats_b'
    const stats = (test[statsKey] as any) || { calls: 0, answered: 0, appointments: 0, avg_duration: 0 }

    const newCalls = stats.calls + 1
    const newAnswered = stats.answered + (outcome.answered ? 1 : 0)
    const newAppointments = stats.appointments + (outcome.appointment ? 1 : 0)
    const newAvgDuration = Math.round(((stats.avg_duration * stats.calls) + outcome.duration) / newCalls)

    await supabase
        .from('outreach_ab_tests')
        .update({
            [statsKey]: {
                calls: newCalls,
                answered: newAnswered,
                appointments: newAppointments,
                avg_duration: newAvgDuration
            }
        })
        .eq('id', testId)
}

export async function completeAbTest(testId: string, winner: 'a' | 'b') {
    const supabase = await createClient()

    const { data: test } = await supabase
        .from('outreach_ab_tests')
        .select('script_a_id, script_b_id, tenant_id')
        .eq('id', testId)
        .single()

    if (!test) return { error: 'Test not found' }

    // Mark test as completed
    await supabase
        .from('outreach_ab_tests')
        .update({
            status: 'completed',
            winner,
            completed_at: new Date().toISOString()
        })
        .eq('id', testId)

    // Set the winning script as default
    const winnerScriptId = winner === 'a' ? test.script_a_id : test.script_b_id

    // Unset other defaults first
    await supabase
        .from('outreach_scripts')
        .update({ is_default: false })
        .eq('tenant_id', test.tenant_id)

    // Set winner as default
    await supabase
        .from('outreach_scripts')
        .update({ is_default: true })
        .eq('id', winnerScriptId)

    revalidatePath('/outreach')
    return { success: true, winnerScriptId }
}

export async function cancelAbTest(testId: string) {
    const supabase = await createClient()

    await supabase
        .from('outreach_ab_tests')
        .update({
            status: 'cancelled',
            completed_at: new Date().toISOString()
        })
        .eq('id', testId)

    revalidatePath('/outreach')
    return { success: true }
}
