'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { syncBrokerLeadFromSale } from '@/app/broker/actions'

export async function createUnit(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const project_id = formData.get('project_id') as string
    const unit_number = formData.get('unit_number') as string
    const type = formData.get('type') as string
    const price = formData.get('price') as string
    const floor = formData.get('floor') as string
    const direction = formData.get('direction') as string
    const area_gross = formData.get('area_gross') as string
    const currency = formData.get('currency') as string || 'TRY'

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const { error } = await supabase
        .from('units')
        .insert({
            tenant_id: profile?.tenant_id,
            project_id,
            unit_number,
            type,
            price: parseFloat(price),
            currency,
            floor: parseInt(floor),
            direction,
            area_gross: parseFloat(area_gross),
            status: 'For Sale' // default
        })

    if (error) {
        console.error(error)
        return { error: 'Unit creation failed: ' + error.message }
    }

    revalidatePath('/inventory')
    return { success: true }
}

export async function updateUnitStatus(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const status = formData.get('status') as string

    // Get current status for logging
    const { data: currentUnit } = await supabase.from('units').select('status').eq('id', id).single()
    const oldStatus = currentUnit?.status || 'unknown'

    const { error } = await supabase
        .from('units')
        .update({ status })
        .eq('id', id)

    if (error) return { error: 'Update failed' };

    // Log the status change
    await logUnitActivity(id, 'status_change', `Durum değiştirildi: ${oldStatus} → ${status}`, oldStatus, status)

    revalidatePath('/inventory')
    return { success: true }
}

export async function reserveUnit(formData: FormData) {
    const supabase = await createClient()
    const unitId = formData.get('unit_id') as string
    const customerId = formData.get('customer_id') as string
    const expiryDate = formData.get('expiry_date') as string
    const depositAmount = Number(formData.get('deposit_amount')) || 0

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get tenant_id from profile
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) {
        return { error: 'Tenant information not found' }
    }

    // Get unit price and currency for the offer
    const { data: unit } = await supabase.from('units').select('price, currency').eq('id', unitId).single()
    if (!unit) return { error: 'Unit not found' }

    // Determination of initial status
    const initialSaleStatus = depositAmount > 0 ? 'Opsiyon - Kapora Bekleniyor' : 'Reservation'

    // 1. Update unit status
    const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'Reserved' })
        .eq('id', unitId)

    if (unitError) {
        console.error('Unit status update error:', unitError)
        return { error: 'Unit status update failed' }
    }

    // Log reservation activity
    await logUnitActivity(unitId, 'reservation', 'Ünite rezerve edildi', 'For Sale', 'Reserved')

    // 2. Create reservation in sales table
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
            tenant_id: profile.tenant_id,
            customer_id: customerId,
            unit_id: unitId,
            assigned_to: user.id,
            status: initialSaleStatus,
            reservation_expiry: expiryDate,
        })
        .select()
        .single()

    if (saleError) {
        console.error('Create reservation error:', saleError)
        return { error: 'Reservation record creation failed' }
    }

    // Broker Sync
    await syncBrokerLeadFromSale(sale.id, initialSaleStatus)

    // 3. Create Deposit record if > 0
    if (depositAmount > 0) {
        const { error: depositError } = await supabase.from('deposits').insert({
            tenant_id: profile.tenant_id,
            customer_id: customerId,
            sale_id: sale.id,
            amount: depositAmount,
            currency: unit.currency || 'TRY',
            status: 'Pending'
        })

        if (depositError) {
            console.error('Create Deposit Error:', depositError)
            return { error: 'Kapora kaydı oluşturulamadı.' }
        }
    }

    // 4. Create Offer record so "Document" exists
    const { error: offerError } = await supabase.from('offers').insert({
        tenant_id: profile.tenant_id,
        customer_id: customerId,
        unit_id: unitId,
        user_id: user.id,
        price: unit.price || 0,
        currency: unit.currency || 'TRY',
        status: 'Sent',
        valid_until: expiryDate,
        created_at: new Date().toISOString()
    })

    if (offerError) {
        console.error('Create offer error:', offerError)
    }

    revalidatePath('/inventory')
    revalidatePath('/options')
    revalidatePath('/offers')
    revalidatePath('/finance/deposits')
    return { success: true }
}

export async function updateReservation(formData: FormData) {
    const supabase = await createClient()
    const unitId = formData.get('unit_id') as string
    const expiryDate = formData.get('expiry_date') as string

    // 1. Update reservation_expiry in sales table
    const { error: saleError } = await supabase
        .from('sales')
        .update({ reservation_expiry: expiryDate })
        .eq('unit_id', unitId)
        .eq('status', 'Reservation')

    if (saleError) {
        console.error('Update reservation error:', saleError)
        return { error: 'Failed to update reservation expiry' }
    }

    // 2. Update valid_until in offers table for the active offer
    const { error: offerError } = await supabase
        .from('offers')
        .update({ valid_until: expiryDate })
        .eq('unit_id', unitId)
        .eq('status', 'Sent')

    if (offerError) {
        console.error('Update offer valid_until error:', offerError)
    }

    revalidatePath('/options')
    return { success: true }
}

export async function convertReservationToOffer(unitId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Get the current reservation sale
    const { data: sale } = await supabase
        .from('sales')
        .select('*')
        .eq('unit_id', unitId)
        .eq('status', 'Reservation')
        .single()

    if (!sale) return { error: 'No active reservation found for this unit' }

    // 2. Update Unit status to For Sale (technically it's now in Proposal)
    const { error: unitError } = await supabase
        .from('units')
        .update({ status: 'For Sale' })
        .eq('id', unitId)

    if (unitError) return { error: 'Failed to update unit status' }

    // Log conversion activity
    await logUnitActivity(unitId, 'status_change', 'Rezervasyon teklife dönüştürüldü', 'Reserved', 'For Sale')

    // 3. Update Sales status to Proposal
    const { error: saleError } = await supabase
        .from('sales')
        .update({ status: 'Proposal' })
        .eq('id', sale.id)

    if (saleError) return { error: 'Failed to update sale status' }

    // Broker Sync
    await syncBrokerLeadFromSale(sale.id, 'Proposal')

    // 4. Update the active offer with the new price and payment plan
    // We need to fetch the payment plan snapshot for the offer
    // This logic is similar to crm/actions.ts updateSaleStatus
    const { data: paymentPlan } = await supabase
        .from('payment_plans')
        .select('*, payment_items(*)')
        .eq('sale_id', sale.id)
        .single()

    // 5. Upsert offer record
    // We update based on customer_id and unit_id to avoid duplicates, 
    // or insert if it doesn't exist.
    const { error: offerError } = await supabase
        .from('offers')
        .upsert({
            tenant_id: sale.tenant_id,
            customer_id: sale.customer_id,
            unit_id: unitId,
            user_id: user.id,
            status: 'Sent',
            price: sale.final_price || 0,
            currency: sale.currency || 'TRY',
            payment_plan: paymentPlan,
            updated_at: new Date().toISOString()
        }, { onConflict: 'customer_id,unit_id' })

    if (offerError) {
        console.error('Upsert Offer Error (Conversion):', offerError)
        // If upsert fails due to missing constraint or other, try a less strict update
        await supabase
            .from('offers')
            .update({
                status: 'Sent',
                price: sale.final_price || 0,
                currency: sale.currency || 'TRY',
                payment_plan: paymentPlan,
                updated_at: new Date().toISOString()
            })
            .match({ customer_id: sale.customer_id, unit_id: unitId })
    }


    if (offerError) {
        console.error('Update Offer Error (Conversion):', offerError)
    }

    revalidatePath('/options')
    revalidatePath('/offers')
    revalidatePath('/inventory')
    revalidatePath('/crm')
    return { success: true }
}

// =====================================================
// INVENTORY ENHANCEMENTS
// =====================================================

// --- Unit Image Management ---
export async function uploadUnitImage(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const file = formData.get('file') as File
    const unitId = formData.get('unit_id') as string
    const projectId = formData.get('project_id') as string
    const caption = formData.get('caption') as string || ''
    const isCover = formData.get('is_cover') === 'true'

    if (!file || !unitId) return { error: 'Missing required fields' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant not found' }

    // Upload to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${unitId}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
        .from('unit-images')
        .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        return { error: 'Image upload failed: ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage.from('unit-images').getPublicUrl(fileName)

    // If setting as cover, unset all others first
    if (isCover) {
        await supabase.from('unit_images').update({ is_cover: false }).eq('unit_id', unitId)
    }

    // Save to DB
    const { error: dbError } = await supabase.from('unit_images').insert({
        unit_id: unitId,
        project_id: projectId,
        image_url: publicUrl,
        caption,
        is_cover: isCover,
        tenant_id: profile.tenant_id,
        uploaded_by: user.id
    })

    if (dbError) {
        console.error('DB error:', dbError)
        return { error: 'Image record failed: ' + dbError.message }
    }

    // Log activity
    await logUnitActivity(unitId, 'image_upload', `Yeni görsel eklendi: ${caption || file.name}`)

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}

export async function deleteUnitImage(imageId: string, unitId: string) {
    const supabase = await createClient()

    const { data: image } = await supabase.from('unit_images').select('image_url').eq('id', imageId).single()

    // Delete from storage
    if (image?.image_url) {
        const path = image.image_url.split('/unit-images/')[1]
        if (path) {
            await supabase.storage.from('unit-images').remove([path])
        }
    }

    // Delete from DB
    const { error } = await supabase.from('unit_images').delete().eq('id', imageId)
    if (error) return { error: 'Delete failed' }

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}

export async function getUnitImages(unitId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('unit_images')
        .select('*')
        .eq('unit_id', unitId)
        .order('is_cover', { ascending: false })
        .order('sort_order', { ascending: true })

    if (error) return []
    return data || []
}

// --- Unit Activity Log / Timeline ---
export async function logUnitActivity(
    unitId: string,
    activityType: string,
    description: string,
    oldValue?: string,
    newValue?: string,
    metadata?: any
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get tenant_id from profile or unit if profile fails
    let tenantId: string | null = null
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id || '').single()
    tenantId = profile?.tenant_id || null

    if (!tenantId) {
        // Fallback: Get tenant_id from the unit itself
        const { data: unit } = await supabase.from('units').select('tenant_id').eq('id', unitId).single()
        tenantId = unit?.tenant_id || null
    }

    if (!tenantId) {
        console.error('Could not find tenant_id for logging activity')
        return
    }

    const { error } = await supabase.from('unit_activity_log').insert({
        unit_id: unitId,
        activity_type: activityType,
        description,
        old_value: oldValue,
        new_value: newValue,
        metadata: metadata || {},
        tenant_id: tenantId,
        created_by: user?.id
    })

    if (error) {
        console.error('Error inserting unit activity log:', error)
    }
}

export async function getUnitTimeline(unitId: string) {
    const supabase = await createClient()

    try {
        // 1. Get activity logs
        const { data: activities, error: actError } = await supabase
            .from('unit_activity_log')
            .select('*')
            .eq('unit_id', unitId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (actError) {
            console.error('Activity Fetch Error:', actError.message)
        }

        // 2. Get negotiation history
        let negotiations: any[] = []
        try {
            const { data: negData, error: negError } = await supabase
                .from('negotiations')
                .select('*')
                .eq('unit_id', unitId)
                .order('created_at', { ascending: false })

            if (!negError) {
                negotiations = negData || []
            } else if (negError.code !== 'PGRST205') {
                console.error('Negotiation Fetch Error:', negError.message)
            }
        } catch (e) {
            // Failsafe
        }

        // 3. User Resolution
        const userIds = Array.from(new Set([
            ...(activities || []).map(a => a.created_by),
            ...(negotiations || []).map(n => n.created_by)
        ])).filter(Boolean) as string[]

        let profileMap: Record<string, string> = {}
        if (userIds.length > 0) {
            const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds)
            profiles?.forEach((p: any) => { profileMap[p.id] = p.full_name })
        }

        // 4. Transform and Merge
        const items: any[] = []

        if (activities) {
            activities.forEach((a: any) => {
                items.push({
                    id: a.id,
                    type: a.activity_type || 'status_change',
                    description: a.description || 'Detay belirtilmedi',
                    oldValue: a.old_value,
                    newValue: a.new_value,
                    date: a.created_at,
                    user: profileMap[a.created_by] || 'Sistem',
                    source: 'activity'
                })
            })
        }

        if (negotiations) {
            negotiations.forEach((n: any) => {
                items.push({
                    id: n.id,
                    type: 'negotiation',
                    description: `Pazarlık/Teklif: ${new Intl.NumberFormat('tr-TR').format(n.proposed_price || 0)} ${n.proposed_currency || 'TRY'}`,
                    oldValue: null,
                    newValue: n.proposed_price?.toString(),
                    date: n.created_at,
                    user: profileMap[n.created_by] || 'Danışman',
                    source: 'negotiation'
                })
            })
        }

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    } catch (globalError) {
        console.error('TIMELINE_GLOBAL_CRITICAL_ERROR:', globalError)
        return []
    }
}

// --- Stock Aging Report moved to ./stats-actions.ts

// --- Bulk Price Update ---
export async function bulkUpdatePrices(unitIds: string[], changeType: 'percentage' | 'fixed', changeValue: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    let updatedCount = 0

    for (const unitId of unitIds) {
        const { data: unit } = await supabase.from('units').select('price, currency').eq('id', unitId).single()
        if (!unit) continue

        const oldPrice = unit.price
        let newPrice: number

        if (changeType === 'percentage') {
            newPrice = Math.round(oldPrice * (1 + changeValue / 100))
        } else {
            newPrice = oldPrice + changeValue
        }

        if (newPrice < 0) newPrice = 0

        const { error } = await supabase.from('units').update({ price: newPrice }).eq('id', unitId)
        if (!error) {
            updatedCount++
            // Log the price change
            await logUnitActivity(
                unitId,
                'price_change',
                `Fiyat güncellendi: ${new Intl.NumberFormat('tr-TR').format(oldPrice)} → ${new Intl.NumberFormat('tr-TR').format(newPrice)} ${unit.currency}`,
                oldPrice.toString(),
                newPrice.toString(),
                { changeType, changeValue }
            )
        }
    }

    revalidatePath('/inventory')
    return { success: true, updatedCount }
}

// --- Extended Status Update (with logging) ---
export async function updateUnitStatusExtended(unitId: string, newStatus: string, reason?: string) {
    const supabase = await createClient()

    const { data: unit } = await supabase.from('units').select('status').eq('id', unitId).single()
    if (!unit) return { error: 'Unit not found' }

    const oldStatus = unit.status

    const { error } = await supabase.from('units').update({ status: newStatus }).eq('id', unitId)
    if (error) return { error: 'Status update failed' }

    // Log the status change
    await logUnitActivity(
        unitId,
        'status_change',
        `Durum değişikliği: ${oldStatus} → ${newStatus}${reason ? ` (Sebep: ${reason})` : ''}`,
        oldStatus,
        newStatus,
        { reason }
    )

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}

// --- Export Inventory Data ---
export async function getInventoryExportData(projectId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('units')
        .select('unit_number, block, type, unit_category, floor, status, price, currency, area_gross, area_net, direction, view, parking_type, heating_type, kitchen_type, has_builtin_kitchen, has_master_bathroom, ada_no, parsel_no, created_at, projects(name)')
        .order('unit_number', { ascending: true })

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    if (error || !data) return []

    return data.map((u: any) => ({
        'Proje': u.projects?.name || '',
        'Blok': u.block || '',
        'Ünite No': u.unit_number,
        'Durum': u.status,
        'Tip': u.type,
        'Kategori': u.unit_category || '',
        'Kat': u.floor?.toString() || '',
        'Yön': u.direction || '',
        'Manzara': u.view || '',
        'Brüt Alan (m²)': u.area_gross?.toString() || '',
        'Net Alan (m²)': u.area_net?.toString() || '',
        'Fiyat': u.price?.toString() || '',
        'Para Birimi': u.currency || 'TRY',
        'Otopark': u.parking_type || '',
        'Isıtma': u.heating_type || '',
        'Mutfak': u.kitchen_type || '',
        'Ankastre': u.has_builtin_kitchen ? 'Evet' : 'Hayır',
        'Ebeveyn Banyosu': u.has_master_bathroom ? 'Evet' : 'Hayır',
        'Ada': u.ada_no || '',
        'Parsel': u.parsel_no || ''
    }))
}

// --- Bulk Status Update ---
export async function bulkUpdateStatuses(unitIds: string[], newStatus: string, reason?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    let updatedCount = 0
    const PROTECTED_STATUSES = ['Sold', 'Satıldı', 'Delivered']

    for (const unitId of unitIds) {
        const { data: unit } = await supabase.from('units').select('status').eq('id', unitId).single()
        if (!unit) continue

        // Skip units with protected statuses
        if (PROTECTED_STATUSES.includes(unit.status)) continue

        const oldStatus = unit.status

        const { error } = await supabase.from('units').update({ status: newStatus }).eq('id', unitId)
        if (!error) {
            updatedCount++
            await logUnitActivity(
                unitId,
                'status_change',
                `Toplu durum değişikliği: ${oldStatus} → ${newStatus}${reason ? ` (Sebep: ${reason})` : ''}`,
                oldStatus,
                newStatus,
                { reason, bulk: true }
            )
        }
    }

    revalidatePath('/inventory')
    return { success: true, updatedCount }
}

// --- Sales Velocity Report moved to ./stats-actions.ts
// --- Public Inventory Links ---
export async function createPublicInventoryLink(title: string, unitIds: string[], expiryDays: number, password?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant not found' }

    // Generate a unique slug
    const slug = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)

    // Calculate expiry
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expiryDays)

    const { data, error } = await supabase.from('public_inventory_links').insert({
        tenant_id: profile.tenant_id,
        slug,
        title,
        unit_ids: unitIds,
        expires_at: expiresAt.toISOString(),
        password_hash: password || null, // Simple storage for now
        created_by: user.id
    }).select().single()

    if (error) {
        console.error('Create public link error:', error)
        return { error: 'Link creation failed: ' + error.message }
    }

    return { success: true, slug: data.slug }
}
export async function getPublicInventoryLinkBySlug(slug: string) {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // Fetch the link meta data
    const { data: link, error } = await supabase
        .from('public_inventory_links')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle()

    if (error || !link) return null

    // Tracking: Update view count asynchronously (don't wait for it to return the page)
    supabase.from('public_inventory_links')
        .update({
            views_count: (link.views_count || 0) + 1,
            last_viewed_at: new Date().toISOString()
        })
        .eq('id', link.id)
        .then(({ error: trackError }) => {
            if (trackError) console.error('Tracking update failed:', trackError)
        })

    // Check expiry
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
        return { expired: true }
    }

    // Fetch units in chunks to avoid URL length limits (414 Request-URI Too Large)
    // UUID strings are long, so if we share 100+ units, the .in() filter can break.
    const CHUNK_SIZE = 100
    const allUnits = []

    for (let i = 0; i < link.unit_ids.length; i += CHUNK_SIZE) {
        const chunk = link.unit_ids.slice(i, i + CHUNK_SIZE)
        const { data: units, error: unitsError } = await supabase
            .from('units')
            .select('*, projects(name)')
            .in('id', chunk)
            .order('unit_number', { ascending: true })

        if (!unitsError && units) {
            allUnits.push(...units)
        } else if (unitsError) {
            console.error('Error fetching unit chunk:', unitsError)
        }
    }

    // Sort the combined results
    allUnits.sort((a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }))

    return { ...link, units: allUnits }
}

export async function submitPublicInquiry(data: {
    link_id: string;
    unit_id?: string;
    full_name: string;
    email?: string;
    phone: string;
    message?: string;
}) {
    // We use admin client to bypass any insertion blocks and successfully update lead count
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const supabase = createAdminClient()

    // 1. Get the link to find the tenant_id and creator
    const { data: link, error: linkError } = await supabase
        .from('public_inventory_links')
        .select('tenant_id, leads_count, created_by, title')
        .eq('id', data.link_id)
        .single()

    if (linkError || !link) return { error: 'Link not found' }

    // 2. CRM INTEGRATION: Create or Update Customer
    // Find existing customer by phone or email
    let customerId: string | null = null
    const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('tenant_id', link.tenant_id)
        .or(`phone.eq.${data.phone}${data.email ? `,email.eq.${data.email}` : ''}`)
        .maybeSingle()

    if (existingCustomer) {
        customerId = existingCustomer.id
    } else {
        const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
                tenant_id: link.tenant_id,
                full_name: data.full_name,
                phone: data.phone,
                email: data.email || null,
                source: `Public Katalog: ${link.title || 'İsimsiz'}`
                // created_by: link.created_by // Temporarily disabled due to schema cache error
            })
            .select('id')
            .single()

        if (customerError) {
            console.error('CRM INTEGRATION ERROR (Customer Creation):', customerError)
        } else if (newCustomer) {
            console.log('CRM Integration: New customer created:', newCustomer.id)
            customerId = newCustomer.id
        }
    }

    // 3. Create a Sales Lead (Lead or Prospect if unit is selected)
    if (customerId) {
        console.log('CRM Integration: Creating sales lead for customer:', customerId)

        // Fetch project_id from unit if available
        let projectId = null
        if (data.unit_id) {
            const { data: unit } = await supabase.from('units').select('project_id').eq('id', data.unit_id).single()
            if (unit) projectId = unit.project_id
        }

        const { data: saleData, error: saleError } = await supabase.from('sales').insert({
            tenant_id: link.tenant_id,
            customer_id: customerId,
            unit_id: data.unit_id || null,
            project_id: projectId,
            assigned_to: link.created_by, // Auto-assign to link creator
            status: data.unit_id ? 'Prospect' : 'Lead',
            lead_origin: 'company',
            description: data.message || 'Katalog üzerinden gelen talep.'
        }).select('id').single()

        if (saleError) {
            console.error('CRM INTEGRATION ERROR (Sale Lead Creation):', saleError)
        } else {
            console.log('CRM Integration: Sale lead created successfully:', saleData?.id)
        }
    } else {
        console.error('CRM INTEGRATION ERROR: Could not determine customerId. Sales lead skipped.')
    }

    // 4. Insert the inquiry record (for tracking/history)
    const { error: inquiryError } = await supabase
        .from('public_inquiries')
        .insert({
            link_id: data.link_id,
            tenant_id: link.tenant_id,
            unit_id: data.unit_id || null,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            message: data.message,
            source: 'catalog'
        })

    if (inquiryError) {
        console.error('Inquiry submission error:', inquiryError)
        return { error: 'Submission failed' }
    }

    // 5. Increment leads_count on the link
    await supabase.from('public_inventory_links')
        .update({ leads_count: (link.leads_count || 0) + 1 })
        .eq('id', data.link_id)

    // 6. Notify the link creator
    if (link.created_by) {
        try {
            const { createNotification } = await import('@/lib/notifications/create')
            await createNotification({
                tenant_id: link.tenant_id,
                user_id: link.created_by,
                type: 'Success',
                category: 'CRM',
                title: '🔥 Yeni Katalog Talebi!',
                message: `${data.full_name} isimli müşteri "${link.title || 'Katalog'}" üzerinden bilgi istedi.`,
                link: '/crm'
            })
        } catch (noteError) {
            console.error('Notification error in public inquiry:', noteError)
        }
    }

    return { success: true }
}

export async function getPublicLinksReport() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return []

    const { data, error } = await supabase
        .from('public_inventory_links')
        .select(`
            id,
            title,
            slug,
            views_count,
            leads_count,
            expires_at,
            created_at,
            is_active,
            last_viewed_at,
            created_by:profiles(full_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch public links report error detail:', JSON.stringify(error, null, 2))
        return []
    }

    return data || []
}
