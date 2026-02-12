'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProjectBySlug(slug: string) {
    const supabase = await createClient()

    // Query project and include units status for AI context
    // Check if slug is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)

    let query = supabase
        .from('projects')
        .select(`
            *,
            units (
                id,
                status,
                type,
                area_net,
                price
            )
        `)

    if (isUuid) {
        query = query.or(`id.eq.${slug},name.ilike.%${slug}%`)
    } else {
        query = query.ilike('name', `%${slug}%`)
    }

    const { data: project, error } = await query.maybeSingle()

    if (error) {
        console.error('Error fetching project:', error.message)
        return null
    }

    if (!project) {
        console.warn(`Project with slug/id "${slug}" not found.`)
        return null
    }

    // Summarize units for the AI to handle context limits better
    const unitSummary = project.units?.reduce((acc: any, unit: any) => {
        const key = unit.type || 'Diğer'
        if (!acc[key]) acc[key] = { count: 0, minPrice: Infinity, available: 0 }
        acc[key].count++
        if (unit.status === 'For Sale') {
            acc[key].available++
            if (unit.price && unit.price < acc[key].minPrice) acc[key].minPrice = unit.price
        }
        return acc
    }, {})

    return {
        ...project,
        unitSummary
    }
}

export async function createLeadFromAi(leadData: {
    name?: string,
    phone: string,
    email?: string,
    projectId: string,
    notes?: string
}) {
    const supabase = await createClient()

    // Insert into customers table or a specific leads table
    let tenantId = null
    if (leadData.projectId) {
        const { data: proj } = await supabase.from('projects').select('tenant_id').eq('id', leadData.projectId).single()
        tenantId = proj?.tenant_id
    }

    // Default tenant fallback if still null (get from any project)
    if (!tenantId) {
        const { data: anyProj } = await supabase.from('projects').select('tenant_id').limit(1).single()
        tenantId = anyProj?.tenant_id
    }

    const { data, error } = await supabase
        .from('customers')
        .insert({
            first_name: leadData.name || 'AI Lead',
            phone: leadData.phone,
            email: leadData.email,
            tenant_id: tenantId,
            description: `AI Asistan üzerinden geldi. Notlar: ${leadData.notes || ''}`
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data }
}
