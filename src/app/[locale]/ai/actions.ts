'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    // For public visitors, we must use Admin Client to bypass RLS and ensure the lead is saved
    const supabase = createAdminClient()

    try {
        // 1. Determine Tenant ID (crucial for CRM visibility)
        let tenantId = null
        if (leadData.projectId) {
            const { data: proj } = await supabase.from('projects').select('tenant_id').eq('id', leadData.projectId).maybeSingle()
            tenantId = proj?.tenant_id
        }

        if (!tenantId) {
            const { data: anyProj } = await supabase.from('projects').select('tenant_id').limit(1).maybeSingle()
            tenantId = anyProj?.tenant_id
        }

        if (!tenantId) {
            console.error('Lead Capture Error: Could not determine tenant_id')
            return { success: false, error: 'Hesap bilgisi alınamadı' }
        }

        // 2. Create/Insert Customer
        const { data: customer, error: customerError } = await supabase
            .from('customers')
            .insert({
                full_name: leadData.name || 'AI Müşteri',
                phone: leadData.phone,
                email: leadData.email,
                tenant_id: tenantId,
                source: 'AI Asistan',
                description: `AI Asistan üzerinden geldi. ${leadData.notes || ''}`
            })
            .select()
            .single()

        if (customerError) {
            console.error('Lead Capture Error (Customer):', customerError)
            return { success: false, error: customerError.message }
        }

        // 3. Create Sale (Lead) entry to show in Pipeline
        // IMPORTANT: The table uses 'lead_origin', not 'source'.
        const { error: saleError } = await supabase
            .from('sales')
            .insert({
                tenant_id: tenantId,
                customer_id: customer.id,
                project_id: leadData.projectId || null,
                status: 'Lead',
                lead_origin: 'company'
            })

        if (saleError) {
            console.error('Lead Capture Error (Sale Table):', saleError)
            // We don't return false here because the customer WAS created successfully.
        }

        return { success: true, data: customer }

    } catch (err: any) {
        console.error('Lead Capture Critical Error:', err)
        return { success: false, error: err.message }
    }
}
