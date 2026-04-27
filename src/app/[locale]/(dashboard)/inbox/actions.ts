'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendPoliSms } from '@/lib/sms'

/**
 * Parse project name from inbox message (looks in Konu/Subject field)
 */
function extractProjectFromMessage(message: string): string | null {
    if (!message) return null
    
    // Try JSON parsed message
    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || parsed.json || message
        // If json field exists, try parsing it too
        if (parsed.json) {
            try {
                const inner = JSON.parse(parsed.json)
                text = inner.message || text
            } catch { /* ignore */ }
        }
    } catch { /* not JSON, use as is */ }

    // Match "Konu: ..." or "Proje: ..." or "Subject: ..."
    const patterns = [
        /Konu:\s*(.+?)(?=\s*(?:Ad\s+Soyad|E-posta|Telefon|Mesaj|Not|$))/i,
        /Proje:\s*(.+?)(?=\s*(?:Ad\s+Soyad|E-posta|Telefon|Konu|Mesaj|$))/i,
        /Subject:\s*(.+?)(?=\s*(?:Name|Email|Phone|Message|$))/i,
    ]
    
    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1].trim()
    }
    return null
}

/**
 * Extract phone number from message body (handles spaces and international formats)
 */
function extractPhoneFromMessage(message: string): string | null {
    if (!message) return null

    let text = message
    try {
        const parsed = JSON.parse(message)
        text = parsed.message || parsed.text || message
        if (parsed.json) {
            try { text = JSON.parse(parsed.json).message || text } catch { /* ignore */ }
        }
    } catch { /* not JSON */ }

    // Match "Telefon: +44 7800656460" — capture everything up to next field label or end
    const phoneMatch = text.match(/Telefon:\s*([\d\s\+\-\(\)\.]+?)(?=\s*(?:Ad\s+Soyad|E-posta|Konu|Proje|Mesaj|Not|$))/i)
    if (phoneMatch) return phoneMatch[1].trim()

    // Fallback: look for Phone: pattern
    const phoneMatch2 = text.match(/Phone:\s*([\d\s\+\-\(\)\.]+?)(?=\s*(?:Name|Email|Subject|Message|$))/i)
    if (phoneMatch2) return phoneMatch2[1].trim()

    return null
}

/**
 * Find matching project by name (fuzzy match)
 */
async function findProjectByName(supabase: any, tenantId: string, projectName: string): Promise<string | null> {
    if (!projectName) return null

    // Fetch all projects for this tenant
    const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .eq('tenant_id', tenantId)

    if (!projects || projects.length === 0) return null

    const searchLower = projectName.toLowerCase().trim()

    // 1. Exact match
    const exact = projects.find((p: any) => p.name.toLowerCase() === searchLower)
    if (exact) return exact.id

    // 2. Contains match (project name is in the search, or search is in project name)
    const contains = projects.find((p: any) => 
        searchLower.includes(p.name.toLowerCase()) || 
        p.name.toLowerCase().includes(searchLower)
    )
    if (contains) return contains.id

    // 3. Word-level fuzzy match (at least 2 words overlap)
    const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2)
    let bestMatch: { id: string, score: number } | null = null

    for (const project of projects) {
        const projWords = project.name.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)
        const overlap = searchWords.filter(w => projWords.some((pw: string) => pw.includes(w) || w.includes(pw)))
        const score = overlap.length
        if (score >= 1 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { id: project.id, score }
        }
    }

    return bestMatch?.id || null
}

export async function approveInboxItem(
    inboxItemId: string,
    projectId?: string,
    overrides?: { name?: string, email?: string, phone?: string }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Get inbox item details
        const { data: inboxItem, error: fetchError } = await supabase
            .from('inbox_items')
            .select('*')
            .eq('id', inboxItemId)
            .eq('status', 'pending')
            .single()

        if (fetchError || !inboxItem) {
            console.error('Error fetching inbox item:', fetchError)
            return { success: false, error: 'Inbox item not found or already processed' }
        }

        // Resolve final field values
        const finalName = overrides?.name || inboxItem.name
        const finalEmail = overrides?.email || inboxItem.email
        // Extract phone from message if not available in DB or overrides
        const finalPhone = overrides?.phone || inboxItem.phone || extractPhoneFromMessage(inboxItem.message)

        // --- DUPLICATE DETECTION ---
        // Check by email first, then by phone
        let customerId: string | null = null

        if (finalEmail) {
            const { data: byEmail } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', inboxItem.tenant_id)
                .eq('email', finalEmail)
                .maybeSingle()
            if (byEmail) customerId = byEmail.id
        }

        if (!customerId && finalPhone) {
            // Normalize phone for comparison (remove spaces, dashes)
            const normalizedPhone = finalPhone.replace(/[\s\-\(\)\.]/g, '')
            const { data: byPhone } = await supabase
                .from('customers')
                .select('id, phone')
                .eq('tenant_id', inboxItem.tenant_id)
                .not('phone', 'is', null)

            if (byPhone) {
                const match = byPhone.find((c: any) => 
                    c.phone && c.phone.replace(/[\s\-\(\)\.]/g, '') === normalizedPhone
                )
                if (match) customerId = match.id
            }
        }

        // If no existing customer found, create new one
        if (!customerId) {
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    tenant_id: inboxItem.tenant_id,
                    full_name: finalName,
                    email: finalEmail || null,
                    phone: finalPhone || null,
                    source: inboxItem.source
                })
                .select('id')
                .single()

            if (customerError || !newCustomer) {
                console.error('Error creating customer:', customerError)
                return {
                    success: false,
                    error: `Failed to create customer: ${customerError?.message || 'Unknown error'}`,
                    details: customerError
                }
            }
            customerId = newCustomer.id
        } else {
            // Update existing customer with any missing info
            const updates: any = {}
            if (finalPhone) {
                const { data: existing } = await supabase.from('customers').select('phone, email').eq('id', customerId).single()
                if (existing && !existing.phone) updates.phone = finalPhone
                if (existing && !existing.email && finalEmail) updates.email = finalEmail
            }
            if (Object.keys(updates).length > 0) {
                await supabase.from('customers').update(updates).eq('id', customerId)
            }
        }

        // --- PROJECT MATCHING ---
        // Try to match project from message if no projectId provided
        let resolvedProjectId = inboxItem.project_id || projectId || null

        if (!resolvedProjectId) {
            const projectName = extractProjectFromMessage(inboxItem.message)
            if (projectName) {
                resolvedProjectId = await findProjectByName(supabase, inboxItem.tenant_id, projectName)
                console.log(`Project match: "${projectName}" → ${resolvedProjectId || 'NOT FOUND'}`)
            }
        }

        // --- CHECK EXISTING SALE FOR SAME CUSTOMER ---
        // Don't create duplicate sale if customer already has an active lead
        let saleId: string

        const { data: existingSale } = await supabase
            .from('sales')
            .select('id')
            .eq('tenant_id', inboxItem.tenant_id)
            .eq('customer_id', customerId)
            .eq('status', 'Lead')
            .maybeSingle()

        if (existingSale) {
            // Update existing sale with project if found
            saleId = existingSale.id
            if (resolvedProjectId) {
                await supabase.from('sales').update({ project_id: resolvedProjectId }).eq('id', saleId)
            }
            // Append new message to description
            await supabase.from('sales').update({
                description: `${inboxItem.message}\n\n--- Ek form gönderimi ---`
            }).eq('id', saleId)
        } else {
            // Create new sale
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    tenant_id: inboxItem.tenant_id,
                    customer_id: customerId,
                    project_id: resolvedProjectId,
                    status: 'Lead',
                    description: inboxItem.message
                })
                .select('id')
                .single()

            if (saleError || !newSale) {
                console.error('Error creating sale:', saleError)
                return { success: false, error: 'Failed to create sale' }
            }
            saleId = newSale.id
        }

        // Create automatic activity for new web lead 
        await supabase.from('activities').insert({
            tenant_id: inboxItem.tenant_id,
            customer_id: customerId,
            user_id: user.id,
            owner_id: user.id,
            type: 'Call',
            topic: 'Sales',
            summary: `Web Form Takibi: ${finalName}`,
            description: `İnbox üzerinden onaylanan yeni talep: ${inboxItem.message || '-'}`,
            due_date: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour later
            status: 'Planned',
            priority: 'High'
        })

        // Update inbox item status
        const { error: updateError } = await supabase
            .from('inbox_items')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: user.id,
                sale_id: saleId
            })
            .eq('id', inboxItemId)

        if (updateError) {
            console.error('Error updating inbox item:', updateError)
        }

        // Send SMS Notification (Optional)
        const { data: tenant } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', inboxItem.tenant_id)
            .single()

        if (tenant?.is_sms_notifications_enabled && finalPhone && tenant.sms_api_user && tenant.sms_api_password) {
            try {
                await sendPoliSms({
                    user: tenant.sms_api_user,
                    pass: tenant.sms_api_password,
                    header: tenant.sms_sender_id || 'NOVOEMLAK',
                    contacts: [finalPhone],
                    message: `Sayın ${finalName}, talebiniz başarıyla alınmıştır. En kısa sürede sizinle iletişime geçilecektir. Teşekkürler. ${tenant.name || ''}`
                })
            } catch (smsError) {
                console.error('Automatic SMS Error:', smsError)
            }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        revalidatePath('/[locale]/(dashboard)/crm')
        revalidatePath('/[locale]/(dashboard)/customers')

        return {
            success: true,
            customer_id: customerId,
            sale_id: saleId,
            was_duplicate: !!existingSale
        }
    } catch (error: any) {
        console.error('Server error approving inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function updateInboxItem(inboxItemId: string, updates: {
    name?: string
    email?: string
    phone?: string
    message?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('inbox_items')
            .update(updates)
            .eq('id', inboxItemId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error updating inbox item:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')

        return { success: true }
    } catch (error: any) {
        console.error('Server error updating inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function rejectInboxItem(inboxItemId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('inbox_items')
            .update({
                status: 'rejected',
                approved_at: new Date().toISOString(),
                approved_by: user.id
            })
            .eq('id', inboxItemId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error rejecting inbox item:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')

        return { success: true }
    } catch (error: any) {
        console.error('Server error rejecting inbox item:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function deleteArchivedItems(itemIds: string[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('inbox_items')
            .delete()
            .in('id', itemIds)
            .in('status', ['approved', 'rejected'])

        if (error) {
            console.error('Error deleting archived items:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        return { success: true, deleted: itemIds.length }
    } catch (error: any) {
        console.error('Server error deleting archived items:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

export async function deleteAllArchivedItems() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Unauthorized' }
        }

        // Get user's tenant
        const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
        if (!profile) return { success: false, error: 'Profile not found' }

        const { error, count } = await supabase
            .from('inbox_items')
            .delete({ count: 'exact' })
            .eq('tenant_id', profile.tenant_id)
            .in('status', ['approved', 'rejected'])

        if (error) {
            console.error('Error deleting all archived items:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/[locale]/(dashboard)/inbox')
        return { success: true, deleted: count }
    } catch (error: any) {
        console.error('Server error deleting all archived items:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}
