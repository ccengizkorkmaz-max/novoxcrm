import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET() {
    return NextResponse.json({
        status: 'active',
        message: 'Novo CRM External Lead API is running. Use POST to submit leads.'
    })
}

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient()

        const body = await req.json()
        console.log('External Lead Incoming Body:', JSON.stringify(body, null, 2))

        let {
            name,
            email,
            phone,
            source = 'External',
            message: bodyMessage,
            tenant_id,
            subject,
            campaign,
            form_name
        } = body

        // Parse customer info from message content if available
        if (bodyMessage) {
            // Parse name - look for "Ad Soyad:" prefix
            const nameMatch = bodyMessage.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (nameMatch) {
                const extractedName = nameMatch[1].trim()
                // Only override if body name is not empty
                if (extractedName) name = extractedName
            }

            // Parse email - look for "E-posta Adresi:" or "E-posta:"
            const emailMatch = bodyMessage.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|Proje|$)|\r|\n)/i)
            if (emailMatch) {
                const extractedEmail = emailMatch[1].trim()
                // Basic email validation check to avoid dummy values
                if (extractedEmail && extractedEmail.includes('@')) email = extractedEmail
            }

            // Parse phone - look for "Telefon:"
            const phoneMatch = bodyMessage.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|Proje|$)|\r|\n)/i)
            if (phoneMatch) {
                const extractedPhone = phoneMatch[1].trim()
                if (extractedPhone) phone = extractedPhone
            }

            // Parse subject
            const subjectMatch = bodyMessage.match(/Konu:\s*([^:\n\r]+?)(?=\s*(?:Ad Soyad|E-posta|Telefon|Proje|$)|\r|\n)/i)
            if (subjectMatch) {
                const extractedSubject = subjectMatch[1].trim()
                if (extractedSubject) subject = extractedSubject
            }

            // Parse form_name if not provided but in body
            if (!form_name) {
                const projectMatch = bodyMessage.match(/(?:Proje|Form Adı):\s*([^:\n\r]+?)(?=\s*(?:Ad Soyad|E-posta|Telefon|Konu|Campaign|$)|\r|\n)/i)
                if (projectMatch) form_name = projectMatch[1].trim()
            }
        }

        // Validate required fields
        if (!name || (!email && !phone)) {
            return NextResponse.json({ error: 'Missing required fields (name and email/phone)' }, { status: 400 })
        }

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id in request body. Each tenant must provide their unique workspace ID.' }, { status: 400 })
        }

        // --- NEW: Try to link to a Project ---
        let projectId = null
        const projectSearchTerm = form_name || subject
        if (projectSearchTerm && tenant_id) {
            const { data: project } = await supabase
                .from('projects')
                .select('id')
                .eq('tenant_id', tenant_id)
                .ilike('name', `%${projectSearchTerm}%`)
                .limit(1)
                .maybeSingle()

            if (project) {
                projectId = project.id
            }
        }

        // Build final message matching the format in your screenshot
        let finalMessage = ''

        if (source === 'Facebook Ads') {
            finalMessage = `Lead from Facebook Ads`
            if (form_name) finalMessage += ` (Form: ${form_name})`
            if (campaign) finalMessage += ` (Campaign: ${campaign})`
            if (bodyMessage) finalMessage += `\n\n${bodyMessage}`
        } else {
            if (subject) {
                finalMessage += `**${subject}**\n\n`
            }
            if (bodyMessage) {
                finalMessage += bodyMessage
            }
            if (!finalMessage && (form_name || campaign)) {
                finalMessage = `Form: ${form_name || '-'} | Campaign: ${campaign || '-'}`
            }
        }

        // --- NEW: Conditional Logic ---
        // Facebook Ads leads are created automatically
        // WEB Form leads go to inbox for manual approval
        if (source === 'Facebook Ads') {
            console.log('Automating Facebook Ads lead processing...')

            // 1. Find or create customer
            let customerId: string

            // Check for existing customer
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', tenant_id)
                .or(`email.eq.${email},phone.eq.${phone}`)
                .maybeSingle()

            if (existingCustomer) {
                customerId = existingCustomer.id
                console.log('Found existing customer:', customerId)
            } else {
                // Create new customer
                const { data: newCustomer, error: customerError } = await supabase
                    .from('customers')
                    .insert({
                        tenant_id: tenant_id,
                        full_name: name,
                        email: email || null,
                        phone: phone || null,
                        source: source
                    })
                    .select('id')
                    .single()

                if (customerError || !newCustomer) {
                    console.error('Error creating customer for Facebook Ads:', customerError)
                    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
                }
                customerId = newCustomer.id
                console.log('Created new customer for Facebook Ads:', customerId)
            }

            // 2. Create sale record
            // Link to project if form_name matches (optional logic can be added)
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    tenant_id: tenant_id,
                    customer_id: customerId,
                    project_id: projectId,
                    status: 'Lead',
                    description: finalMessage.trim() || 'Facebook Ads Lead'
                })
                .select('id')
                .single()

            if (saleError || !newSale) {
                console.error('Error creating sale for Facebook Ads:', saleError)
                return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
            }

            console.log('Facebook Ads lead processed successfully:', newSale.id)

            revalidatePath('/[locale]/(dashboard)/crm')
            return NextResponse.json({
                success: true,
                message: 'Facebook Ads lead created automatically.',
                lead_id: newSale.id
            })
        }

        // --- Default Flow: Inbox Items ---
        const { data: inboxItem, error: inboxError } = await supabase
            .from('inbox_items')
            .insert({
                tenant_id: tenant_id,
                name: name,
                email: email || null,
                phone: phone || null,
                message: finalMessage.trim() || 'No message provided',
                source: source,
                status: 'pending',
                project_id: projectId
            })
            .select()
            .single()

        if (inboxError) {
            console.error('Error creating inbox item:', inboxError)
            return NextResponse.json({
                error: `Failed to create inbox item: ${inboxError.message}`,
                details: inboxError
            }, { status: 500 })
        }

        console.log('Inbox item created successfully:', inboxItem.id)

        revalidatePath('/[locale]/(dashboard)/inbox')

        return NextResponse.json({
            success: true,
            message: 'Lead received and added to Inbox for approval.',
            inbox_item_id: inboxItem.id
        })
    } catch (error: any) {
        console.error('Unexpected error in external lead route:', error)
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 })
    }
}
