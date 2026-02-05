import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'NovoxCRM External Lead API is running. Use POST to submit leads.'
    })
}

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient()
        const authHeader = req.headers.get('Authorization')

        // Simple API Key check
        // In a real scenario, this would be an environment variable
        const API_KEY = process.env.EXTERNAL_LEAD_API_KEY || 'novox_secret_default_key'

        if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
            console.error('Unauthorized access attempt with header:', authHeader)
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('External Lead Incoming Body:', JSON.stringify(body, null, 2))

        let {
            name,
            email,
            phone,
            source = 'External',
            campaign,
            form_name,
            tenant_id,
            subject,
            description: bodyDescription
        } = body

        // --- NEW: Parse Customer Info from Body/Description if it's an Email ---
        // Some emails contain customer info in a specific format in the body
        if (bodyDescription && (source === 'E-Posta' || !name)) {
            // Robust parsing for common labels in the body
            const nameMatch = bodyDescription.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|$)|\r|\n)/i)
            if (nameMatch) name = nameMatch[1].trim()

            const emailMatch = bodyDescription.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|$)|\r|\n)/i)
            if (emailMatch) email = emailMatch[1].trim()

            const phoneMatch = bodyDescription.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|$)|\r|\n)/i)
            if (phoneMatch) phone = phoneMatch[1].trim()

            const subjectMatch = bodyDescription.match(/Konu:\s*([^:\n\r]+?)(?=\s*(?:Ad Soyad|E-posta|Telefon|$)|\r|\n)/i)
            if (subjectMatch) subject = subjectMatch[1].trim()
        }

        if (!name || (!email && !phone)) {
            return NextResponse.json({ error: 'Missing required fields (name and email/phone)' }, { status: 400 })
        }

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id in request body. Each tenant must provide their unique workspace ID.' }, { status: 400 })
        }

        const targetTenantId = tenant_id

        if (!targetTenantId) {
            return NextResponse.json({ error: 'Tenant configuration missing' }, { status: 500 })
        }

        // 1.5 Try to link to a Project if form_name is provided
        let projectId = null
        if (form_name) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('tenant_id', targetTenantId)
                .ilike('name', `%${form_name}%`)
                .limit(1)
                .maybeSingle()

            if (project) {
                projectId = project.id
            }
        }

        // 2. Find or Create Customer
        let customerId: string
        const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', targetTenantId)
            .eq('full_name', name) // Must match name to be the same customer
            .or(`email.eq.${email},phone.eq.${phone}`)
            .limit(1)
            .maybeSingle()

        if (existingCustomer) {
            customerId = existingCustomer.id

            // Prepare update object to ensure we capture latest contact info
            const updates: any = {}

            if (source === 'E-Posta') {
                updates.source = 'E-Posta'
                // For email source, we trust the name parsing more than potential old data
                if (name) updates.full_name = name
            }

            // Always try to fill in missing or update contact info
            if (phone) updates.phone = phone
            if (email) updates.email = email

            // Only perform update if we have new data
            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('customers')
                    .update(updates)
                    .eq('id', customerId)
            }
        } else {
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    tenant_id: targetTenantId,
                    full_name: name,
                    email: email,
                    phone: phone,
                    source: source
                })
                .select('id')
                .single()

            if (customerError) throw customerError
            customerId = newCustomer.id
        }

        // 3. Create Sale (Lead) with fallback for missing description column
        let finalDescription = bodyDescription ||
            `${subject ? `Subject: ${subject}\n\n` : ''}Lead from ${source}${form_name ? ` (Form: ${form_name})` : ''}${campaign ? ` (Campaign: ${campaign})` : ''}`

        // If source is Kommo, add a marker
        if (source === 'Kommo') {
            finalDescription = `[Kommo CRM] ${finalDescription}`
        }

        // 3. Deduplication Check: Check for existing ACTIVE sales
        // We don't want to create a new Lead if the customer is already in an active negotiation for this project (or generally)
        let activeSaleQuery = supabase
            .from('sales')
            .select('id, status')
            .eq('customer_id', customerId)
            .eq('tenant_id', targetTenantId)
            .not('status', 'in', '("Lost","Sold","Completed","Contract")') // Check for active statuses only

        if (projectId) {
            activeSaleQuery = activeSaleQuery.eq('project_id', projectId)
        } else {
            // If no project is specified, we check if they have any general active lead/prospect record unrelated to a specific unit/project
            // or maybe we rely on the fact that if they are active, we update that one.
            // For safety, let's only deduplicate if we can match the project OR if it's a general lead.
            activeSaleQuery = activeSaleQuery.is('project_id', null).is('unit_id', null)
        }

        const { data: existingActiveSale } = await activeSaleQuery.maybeSingle()

        if (existingActiveSale) {
            console.log(`[Deduplication] Skipping Lead creation. Customer ${customerId} already has active sale: ${existingActiveSale.id} (${existingActiveSale.status})`)

            // If description changed significantly, maybe append? (Skipping for now to avoid noise)

            return NextResponse.json({
                success: true,
                message: 'Lead updated successfully (Existing active sale found)',
                lead_id: existingActiveSale.id,
                is_duplicate: true
            })
        }

        // Check if this lead should go to Inbox for review
        // Leads from web@novosirketlergrubu.com require manual approval
        const customerEmail = email?.toLowerCase() || ''
        const requiresInboxApproval = customerEmail === 'web@novosirketlergrubu.com'

        const saleInsertData: any = {
            tenant_id: targetTenantId,
            customer_id: customerId,
            project_id: projectId,
            status: requiresInboxApproval ? 'Inbox' : 'Lead',
            source: source,
            description: finalDescription
        }

        let { data: newSale, error: saleError } = await supabase
            .from('sales')
            .insert(saleInsertData)
            .select()
            .single()

        // Fallback: If description column is missing (code 42703), retry without it
        if (saleError && saleError.code === '42703' && saleError.message.includes('description')) {
            console.warn('Fallback: description column missing in sales table, retrying without it')
            const { description, ...minimalSaleData } = saleInsertData
            const retry = await supabase
                .from('sales')
                .insert(minimalSaleData)
                .select()
                .single()
            newSale = retry.data
            saleError = retry.error
        }

        if (saleError) throw saleError

        console.log(`Successfully created lead for customer ${customerId}, Sale ID: ${newSale.id}`)

        // Ensure the CRM UI updates
        revalidatePath('/crm')
        revalidatePath('/quick-crm')
        revalidatePath('/customers')
        revalidatePath('/inbox')

        return NextResponse.json({
            success: true,
            message: 'Lead captured successfully',
            lead_id: newSale.id
        })

    } catch (error: any) {
        console.error('External Lead Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
