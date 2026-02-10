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

// --- Stock Aging Report ---
export async function getStockAgingReport() {
    const supabase = await createClient()

    const { data: units } = await supabase
        .from('units')
        .select('id, unit_number, block, type, price, currency, status, area_gross, created_at, listed_at, project_id, projects(name)')
        .eq('status', 'For Sale')
        .order('created_at', { ascending: true })

    if (!units) return []

    const now = new Date()
    return units.map((unit: any) => {
        const listedDate = new Date(unit.listed_at || unit.created_at)
        const daysOnMarket = Math.floor((now.getTime() - listedDate.getTime()) / (1000 * 60 * 60 * 24))

        let agingBucket: string
        if (daysOnMarket <= 30) agingBucket = '0-30 gün'
        else if (daysOnMarket <= 60) agingBucket = '31-60 gün'
        else if (daysOnMarket <= 90) agingBucket = '61-90 gün'
        else if (daysOnMarket <= 180) agingBucket = '91-180 gün'
        else agingBucket = '180+ gün'

        const pricePerM2 = unit.area_gross ? Math.round(unit.price / unit.area_gross) : null

        return {
            ...unit,
            projectName: unit.projects?.name,
            daysOnMarket,
            agingBucket,
            pricePerM2,
            listedDate: listedDate.toISOString()
        }
    })
}

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
