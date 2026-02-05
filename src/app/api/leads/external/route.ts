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
        // Email forms often contain structured data like:
        // Ad Soyad: John Doe
        // E-posta Adresi: john@example.com
        // Telefon: 555...
        if (bodyMessage && (!name || !email || !phone)) {
            // Parse name
            const nameMatch = bodyMessage.match(/Ad\s+Soyad:\s*([^:\n\r]+?)(?=\s*(?:E-posta|Telefon|Konu|$)|\r|\n)/i)
            if (nameMatch && !name) {
                name = nameMatch[1].trim()
            }

            // Parse email
            const emailMatch = bodyMessage.match(/(?:E-posta Adresi|E-posta):\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|Telefon|Konu|$)|\r|\n)/i)
            if (emailMatch && !email) {
                email = emailMatch[1].trim()
            }

            // Parse phone
            const phoneMatch = bodyMessage.match(/Telefon:\s*([^:\n\r\s]+?)(?=\s*(?:Ad Soyad|E-posta|Konu|$)|\r|\n)/i)
            if (phoneMatch && !phone) {
                phone = phoneMatch[1].trim()
            }

            // Parse subject if not provided
            const subjectMatch = bodyMessage.match(/Konu:\s*([^:\n\r]+?)(?=\s*(?:Ad Soyad|E-posta|Telefon|$)|\r|\n)/i)
            if (subjectMatch && !subject) {
                subject = subjectMatch[1].trim()
            }
        }

        // Validate required fields
        if (!name || (!email && !phone)) {
            return NextResponse.json({ error: 'Missing required fields (name and email/phone)' }, { status: 400 })
        }

        if (!tenant_id) {
            return NextResponse.json({ error: 'Missing tenant_id in request body. Each tenant must provide their unique workspace ID.' }, { status: 400 })
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
                status: 'pending'
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
