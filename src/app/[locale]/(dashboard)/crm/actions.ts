'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { syncBrokerLeadFromSale } from '@/app/broker/actions'

export async function createCustomer(formData: FormData) {
    const supabase = await createClient()

    // Get current user tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    // Assuming tenant_id exists or we handle it. For MVP, we trust profile.

    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const source = formData.get('source') as string
    const address = formData.get('address') as string
    const postal_code = formData.get('postal_code') as string
    const district = formData.get('district') as string
    const city = formData.get('city') as string
    const country = formData.get('country') as string
    const portal_username = (formData.get('portal_username') as string)?.trim() || null
    const portal_password = (formData.get('portal_password') as string)?.trim() || null

    const { data, error } = await supabase
        .from('customers')
        .insert({
            tenant_id: profile?.tenant_id,
            full_name,
            phone,
            email,
            source,
            address,
            postal_code,
            district,
            city,
            country,
            portal_username,
            portal_password
        })
        .select()
        .single()

    if (error) {
        console.error('Create Customer Error:', error)
        return { error: `Müşteri oluşturulamadı: ${error.message}` }
    }

    if (data) {
        // Sync Portal Access if credentials provided
        if (portal_username && portal_password) {
            const { syncPortalAccess } = await import('@/lib/actions/customer-portal')
            await syncPortalAccess(data.id, portal_username, portal_password)
        }

        const min_price = formData.get('min_price')
        const max_price = formData.get('max_price')
        const location_preference = formData.get('location_preference')
        const property_type = formData.get('property_type')
        const investment_purpose = formData.get('investment_purpose')
        const notes = formData.get('notes')

        const room_count_entries = formData.getAll('room_count')
        const room_count = room_count_entries.map(entry => String(entry))

        const hasDemands = !!(min_price || max_price || location_preference || property_type || investment_purpose || notes || room_count.length > 0)

        if (hasDemands) {
            const { error: demandError } = await supabase.from('customer_demands').insert({
                tenant_id: profile?.tenant_id,
                customer_id: data.id,
                min_price: min_price ? Number(min_price) : null,
                max_price: max_price ? Number(max_price) : null,
                location_preference: location_preference ? String(location_preference) : null,
                property_type: property_type ? String(property_type) : null,
                investment_purpose: investment_purpose ? String(investment_purpose) : null,
                notes: notes ? String(notes) : null,
                room_count: room_count.length > 0 ? room_count : null
            })

            if (demandError) {
                console.error('Create Customer Demands Error:', demandError)
            } else {
                // Auto-promote to Lead in Pipeline if demands exist
                const { data: existingSale } = await supabase
                    .from('sales')
                    .select('id')
                    .eq('customer_id', data.id)
                    .maybeSingle()

                if (!existingSale) {
                    await supabase.from('sales').insert({
                        tenant_id: profile?.tenant_id,
                        customer_id: data.id,
                        assigned_to: null,
                        status: 'Lead',
                        unit_id: null
                    })
                }
            }
        }
    }

    revalidatePath('/crm')
    return { success: true }
    revalidatePath('/crm')
    return { success: true }
}

function mapSourceToCategory(source: string | null): string {
    if (!source) return 'company'
    const s = source.toLowerCase()
    if (s.includes('emlak') || s.includes('agent') || s.includes('broker')) return 'personal_agent'
    if (s.includes('referans') || s.includes('network') || s.includes('tanıdık') || s.includes('kişisel')) return 'personal'
    return 'company'
}




export async function updateCustomer(formData: FormData) {
    const supabase = await createClient()

    // Get current user tenant
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const id = formData.get('id') as string
    const full_name = formData.get('full_name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const source = formData.get('source') as string
    const address = formData.get('address') as string
    const postal_code = formData.get('postal_code') as string
    const district = formData.get('district') as string
    const city = formData.get('city') as string
    const country = formData.get('country') as string
    const portal_username = (formData.get('portal_username') as string)?.trim() || null
    const portal_password = (formData.get('portal_password') as string)?.trim() || null

    if (!id) return { error: 'Customer ID required' }

    const { error } = await supabase
        .from('customers')
        .update({
            full_name,
            phone,
            email,
            source,
            address,
            postal_code,
            district,
            city,
            country,
            portal_username,
            portal_password
        })
        .eq('id', id)

    if (error) {
        console.error('Update Customer Error:', error)
        return { error: `Güncelleme başarısız: ${error.message}` }
    }

    // Sync Portal Access ONLY if BOTH are provided
    if (portal_username && portal_password) {
        const { syncPortalAccess } = await import('@/lib/actions/customer-portal')
        const syncRes = await syncPortalAccess(id, portal_username, portal_password)
        if (syncRes.error) return { error: `DB güncellendi ama Portal yetkisi verilemedi: ${syncRes.error}` }
    }

    revalidatePath('/crm')
    return { success: true }
}

export async function deleteCustomer(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string

    if (!id) return { error: 'Customer ID required' }

    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Delete Customer Error:', error)
        return { error: 'Failed to delete customer' }
    }

    revalidatePath('/crm')
    return { success: true }
}

export async function createSale(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    const customer_id = formData.get('customer_id') as string
    const unit_id = formData.get('unit_id') as string
    const project_id = formData.get('project_id') as string

    if (!customer_id) return { error: 'Missing customer' }

    const { data: customer } = await supabase.from('customers').select('source').eq('id', customer_id).single()
    const lead_origin = mapSourceToCategory(customer?.source || null)

    // Start a sales process - if unit is matched, it's a Prospect
    const { data: newSaleData, error } = await supabase.from('sales').insert({
        tenant_id: profile?.tenant_id,
        customer_id,
        unit_id: unit_id || null,
        project_id: project_id || null,
        assigned_to: null,
        status: unit_id ? 'Prospect' : 'Lead',
        lead_origin // Set calculated origin
    }).select().single()

    if (error) {
        console.error('Create Sale Error:', error)
        return { error: 'Failed to start sale: ' + error.message }
    }

    if (newSaleData) {
        await syncBrokerLeadFromSale(newSaleData.id, unit_id ? 'Prospect' : 'Lead')
    }

    revalidatePath('/crm')
    revalidatePath('/quick-crm')

    return { success: true, sale: newSaleData }
}

export async function restartSale(saleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: oldSale } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single()

    if (!oldSale) return { error: 'Satış kaydı bulunamadı' }

    // Keep old unit match if it exists
    const targetUnitId = oldSale.unit_id

    const { error } = await supabase.from('sales').insert({
        tenant_id: oldSale.tenant_id,
        customer_id: oldSale.customer_id,
        unit_id: targetUnitId,
        assigned_to: user.id,
        status: targetUnitId ? 'Prospect' : 'Lead'
    })

    if (error) return { error: error.message }

    // Mark old sale as restarted
    await supabase.from('sales').update({ restarted_at: new Date().toISOString() }).eq('id', saleId)

    // Broker Sync
    const { data: newSale } = await supabase.from('sales').select('id').eq('customer_id', oldSale.customer_id).order('created_at', { ascending: false }).limit(1).single()
    if (newSale) await syncBrokerLeadFromSale(newSale.id, targetUnitId ? 'Prospect' : 'Lead')

    revalidatePath('/crm')
    return { success: true }
}

export async function deleteSale(saleId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Check Admin Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'

    if (!isAdmin) {
        return { error: 'Bu işlem için yetkiniz yok (Sadece Admin/Owner).' }
    }

    // 2. Get Sale Info (for unit_id)
    const { data: sale } = await supabase
        .from('sales')
        .select('unit_id')
        .eq('id', saleId)
        .single()

    if (!sale) return { error: 'Satış kaydı bulunamadı.' }

    // 3. Delete Cascade: Negotiations -> Offers -> Sale
    // Note: Database cascade usually handles this, but we do it manually to be safe and clear.

    // 3.1 Get Offers linked to this sale
    const { data: offers } = await supabase.from('offers').select('id').eq('sale_id', saleId)
    const offerIds = offers?.map(o => o.id) || []

    if (offerIds.length > 0) {
        // Delete Negotiations for these offers
        await supabase.from('offer_negotiations').delete().in('offer_id', offerIds)
        // Delete Offers
        await supabase.from('offers').delete().in('id', offerIds)
    }

    // 4. Delete Sale
    const { error: deleteError } = await supabase.from('sales').delete().eq('id', saleId)

    if (deleteError) {
        console.error('Delete Sale Error:', deleteError)
        return { error: 'Satış silinemedi: ' + deleteError.message }
    }

    // 5. Reset Unit Status (if matched)
    if (sale.unit_id) {
        await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
    }

    revalidatePath('/crm')
    revalidatePath('/inventory')

    return { success: true }
}

export async function updateSaleStatus(id: string, status: string) {
    const supabase = await createClient()

    // Get current user tenant
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    const { data: sale, error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id)
        .select('*, customers(*), units(*)')
        .single()

    if (error) {
        console.error('Update Sale Status Error:', error)
        return { error: 'Failed to update sale status' }
    }

    // Auto-create or Remove Offer based on Status
    if (status === 'Proposal' && sale) {
        // 1. Snapshot Payment Plan
        const paymentPlan = await getPaymentPlan(sale.id)

        // 2. Create Offer (active)
        const { error: offerError } = await supabase.from('offers').insert({
            tenant_id: profile?.tenant_id,
            customer_id: sale.customer_id,
            unit_id: sale.unit_id,
            sale_id: sale.id, // Linked to the sale
            user_id: user?.id,
            price: sale.final_price || sale.units?.price || 0,
            currency: sale.currency || sale.units?.currency || 'TRY',
            status: 'Sent',
            valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            payment_plan: paymentPlan,
            created_at: new Date().toISOString()
        })

        if (offerError) {
            console.error('Auto-create Offer Error:', offerError)
        }
    } else {
        // If status changed FROM Proposal (or just IS NOT Proposal), remove existing offers for this sale
        if (sale?.id) {
            await supabase
                .from('offers')
                .delete()
                .eq('sale_id', sale.id)
        }
    }

    // If status is Lost, free up the unit
    if (status === 'Lost' && sale?.unit_id) {
        await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
    }

    revalidatePath('/crm')
    revalidatePath('/offers')

    // Broker Sync
    await syncBrokerLeadFromSale(id, status)

    // Broker Sync
    await syncBrokerLeadFromSale(id, status)

    return { success: true }
}

export async function assignSale(saleId: string, userId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check Role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner'

    if (!isAdmin) return { error: 'Bu işlem için yetkiniz yok.' }

    const { error } = await supabase
        .from('sales')
        .update({ assigned_to: userId })
        .eq('id', saleId)

    if (error) {
        console.error('Assign Sale Error:', error)
        return { error: 'Atama işlemi başarısız: ' + error.message }
    }

    revalidatePath('/crm')

    // Broker Sync (if assigned user changed, maybe we trigger sync? Lead info might need update on Broker side if we sync rep name? 
    // Currently broker sync sends lead status updates. Rep info isn't critical for now but good to sync.)
    // Let's just sync to be safe.
    const { data: sale } = await supabase.from('sales').select('status').eq('id', saleId).single()
    if (sale) {
        await syncBrokerLeadFromSale(saleId, sale.status || 'Lead')
    }

    return { success: true }
}

export async function createNegotiation(data: {
    offer_id: string,
    proposed_price: number,
    proposed_currency: string,
    proposed_payment_plan: any,
    proposed_valid_until?: string,
    source: 'Sales' | 'Customer',
    notes?: string
}) {

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')


    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const { error } = await supabase.from('offer_negotiations').insert({

        tenant_id: profile?.tenant_id,
        offer_id: data.offer_id,
        proposed_by: user.id,
        source: data.source,
        proposed_price: data.proposed_price,
        proposed_currency: data.proposed_currency,
        proposed_valid_until: data.proposed_valid_until,
        proposed_payment_plan: data.proposed_payment_plan,
        notes: data.notes
    })


    if (error) {
        console.error('Create Negotiation Error:', error)
        return { error: `Failed to record negotiation proposal: ${error.message}` }
    }

    // Check if Offer was Expired, and if this new proposal extends validity
    if (data.proposed_valid_until) {
        const { data: offer } = await supabase.from('offers').select('status').eq('id', data.offer_id).single()
        if (offer?.status === 'Expired' && new Date(data.proposed_valid_until) > new Date()) {
            await supabase.from('offers').update({
                status: 'Sent',
                valid_until: data.proposed_valid_until
            }).eq('id', data.offer_id)
        }
    }

    revalidatePath('/offers')
    return { success: true }
}

export async function getNegotiationHistory(offerId: string) {
    const supabase = await createClient()

    console.log(`Fetching negotiation history for offerId: ${offerId}`)

    const { data: history, error } = await supabase
        .from('offer_negotiations')
        .select('*, profiles!proposed_by(full_name)')
        .eq('offer_id', offerId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Negotiation History Error:', error)
        // Try without join as fallback
        const { data: fallbackData } = await supabase
            .from('offer_negotiations')
            .select('*')
            .eq('offer_id', offerId)
            .order('created_at', { ascending: false })

        return fallbackData || []
    }

    console.log(`Found ${history?.length || 0} negotiation records`)
    return history
}



export async function approveNegotiation(negotiationId: string, depositAmount: number = 0) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 1. Get negotiation detail
    const { data: neg, error: negError } = await supabase
        .from('offer_negotiations')
        .select('*, offers(*)')
        .eq('id', negotiationId)
        .single()

    if (negError || !neg) return { error: 'Negotiation record not found' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    // 2. Mark Approved
    const { error: approvalError } = await supabase.from('offer_negotiations').update({ status: 'Approved' }).eq('id', negotiationId)
    if (approvalError) return { error: approvalError.message }

    // 3. Update Offer Price/Terms
    const { error: offerPriceError } = await supabase.from('offers').update({
        price: neg.proposed_price,
        currency: neg.proposed_currency,
        valid_until: neg.proposed_valid_until,
        payment_plan: neg.proposed_payment_plan
    }).eq('id', neg.offer_id)
    if (offerPriceError) return { error: offerPriceError.message }

    if (depositAmount > 0) {
        // Handle Deposit Pending flow
        const { error: statusError } = await supabase.from('offers').update({ status: 'Teklif - Kapora Bekleniyor' }).eq('id', neg.offer_id)
        if (statusError) return { error: statusError.message }

        const { data: sale, error: saleFetchError } = await supabase
            .from('sales')
            .select('id')
            .match({ customer_id: neg.offers.customer_id, unit_id: neg.offers.unit_id })
            .single()

        if (saleFetchError) return { error: 'Satış kaydı bulunamadı' }

        if (sale) {
            const { error: saleUpdateError } = await supabase.from('sales').update({
                status: 'Teklif - Kapora Bekleniyor',
                payment_mode: neg.proposed_payment_plan?.installments?.length > 1 ? 'term' : 'cash'
            }).eq('id', sale.id)
            if (saleUpdateError) return { error: saleUpdateError.message }

            // Create Deposit Record
            const { error: depositError } = await supabase.from('deposits').insert({
                tenant_id: profile?.tenant_id,
                customer_id: neg.offers.customer_id,
                offer_id: neg.offer_id,
                amount: depositAmount,
                currency: neg.proposed_currency,
                status: 'Pending'
            })
            if (depositError) return { error: depositError.message }
        }

        revalidatePath('/crm')
        revalidatePath('/offers')
        revalidatePath('/finance/deposits')
        return { success: true, message: 'Kapora kaydı oluşturuldu, onay bekleniyor.' }
    } else {
        // Immediate Finalization
        return await finalizeOffer(neg.offer_id)
    }
}

export async function finalizeOffer(offerId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get Offer Details
    const { data: offer, error: offerError } = await supabase
        .from('offers')
        .select('*, customers(*), units(*)')
        .eq('id', offerId)
        .single()

    if (offerError || !offer) return { error: 'Offer not found' }

    // 2. Update Offer Status
    await supabase.from('offers').update({ status: 'Accepted' }).eq('id', offerId)

    // 3. Find/Update Sale
    const { data: sale } = await supabase
        .from('sales')
        .select('*')
        .match({ customer_id: offer.customer_id, unit_id: offer.unit_id })
        .single()

    if (sale) {
        await supabase.from('sales')
            .update({
                status: 'Sold',
                final_price: offer.price,
                currency: offer.currency,
                contract_date: new Date().toISOString()
            })
            .eq('id', sale.id)
    }

    // 4. Update Unit (status to Sold)
    await supabase.from('units').update({ status: 'Sold' }).eq('id', offer.unit_id)

    // 5. Create Contract
    const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
            tenant_id: offer.tenant_id,
            sale_id: sale?.id,
            unit_id: offer.unit_id,
            contract_number: `CNT-${offer.id.slice(0, 8).toUpperCase()}`,
            contract_date: new Date().toISOString().split('T')[0],
            amount: offer.price, // Base amount
            total_amount: offer.price, // For now simple
            currency: offer.currency,
            notes: offer.notes
        })
        .select()
        .single()

    if (contractError) {
        console.error('Create Contract Error:', contractError)
    }

    // 6. Sync Payment Plan to Contract
    if (contract && sale) {
        await supabase.from('payment_plans')
            .update({ contract_id: contract.id })
            .eq('sale_id', sale.id)
    }

    revalidatePath('/crm')
    revalidatePath('/offers')
    revalidatePath('/contracts')
    revalidatePath('/inventory')
    revalidatePath('/finance/deposits')

    // Broker Sync
    await syncBrokerLeadFromSale(sale?.id || '', 'Sold')

    return { success: true }
}



export async function matchUnitToSale(saleId: string, unitId: string, projectId?: string) {
    const supabase = await createClient()

    const { data: sale } = await supabase.from('sales').select('status').eq('id', saleId).single()

    // Status Logics:
    // If unitId is provided (Match Unit) -> Promote to Prospect (if lower status)
    // If unitId is empty (Project match only) -> Keep status OR if previously matched to unit and now unmatching unit but keeping project? -> Revert?
    // Let's assume for Project Match we just keep current status if it's 'Lead'.

    let newStatus = sale?.status

    if (unitId) {
        const promotableStatuses = ['Lead']
        newStatus = promotableStatuses.includes(sale?.status || '') ? 'Prospect' : sale?.status
    } else {
        // If unmatching unit (or just matching project), and status was Prospect (due to unit match?), should we revert?
        // Typically project match is weaker than unit match. 
        // If we move from Unit Match (Prospect) to Project Match (Lead), we might want to downgrade.
        // But let's stick to safe logic: if currently Prospect and we remove unit, maybe go back to Lead?
        // Let's rely on standard flow: Project Match usually happens at Lead stage.
        // If we remove unit, we might default to Lead if it was Prospect.
        if (sale?.status === 'Prospect' && !unitId) {
            newStatus = 'Lead'
        }
    }

    const { error } = await supabase
        .from('sales')
        .update({
            unit_id: unitId || null,
            project_id: projectId || null,
            status: newStatus
        })
        .eq('id', saleId)

    if (error) {
        console.error('Match Unit Error:', error)
        return { error: 'Failed to match unit/project' }
    }

    revalidatePath('/crm')

    // Broker Sync
    await syncBrokerLeadFromSale(saleId, newStatus || '')

    return { success: true }
}

export async function unmatchUnitFromSale(saleId: string) {
    const supabase = await createClient()

    const { data: sale } = await supabase.from('sales').select('status').eq('id', saleId).single()

    // If status is 'Prospect', revert to 'Lead'
    const newStatus = sale?.status === 'Prospect' ? 'Lead' : sale?.status

    const { error } = await supabase
        .from('sales')
        .update({
            unit_id: null,
            status: newStatus,
            final_price: null,
            deposit_amount: 0,
            currency: 'TRY'
        })
        .eq('id', saleId)

    if (error) {
        console.error('Unmatch Unit Error:', error)
        return { error: 'Failed to unmatch unit' }
    }

    revalidatePath('/crm')
    return { success: true }
}

export async function updateSaleToReservation(saleId: string, unitId: string, expiryDate: string, depositAmount: number = 0) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant info not found' }

    // 1. Get current sale info to handle unit changed
    const { data: sale } = await supabase.from('sales').select('unit_id').eq('id', saleId).single()

    // 2. If unit changed, reset old unit status
    if (sale?.unit_id && sale.unit_id !== unitId) {
        await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
    }

    // 2.1 Get unit details for currency/price info
    const { data: unit } = await supabase.from('units').select('price, currency').eq('id', unitId).single()

    // 3. Update Sale record
    const initialStatus = depositAmount > 0 ? 'Opsiyon - Kapora Bekleniyor' : 'Reservation'
    const { data: updatedSale, error: saleError } = await supabase
        .from('sales')
        .update({
            unit_id: unitId,
            status: initialStatus,
            reservation_expiry: expiryDate
        })
        .eq('id', saleId)
        .select()
        .single()

    if (saleError) {
        console.error('Update Sale to Reservation Error:', saleError)
        return { error: 'Failed to update sale record: ' + saleError.message }
    }

    // 3.1. Create Deposit Record if > 0
    if (depositAmount > 0) {
        const { error: depositError } = await supabase.from('deposits').insert({
            tenant_id: profile.tenant_id,
            customer_id: updatedSale.customer_id,
            sale_id: updatedSale.id,
            amount: depositAmount,
            currency: unit?.currency || 'TRY',
            status: 'Pending'
        })
        if (depositError) return { error: 'Kapora kaydı oluşturulamadı: ' + depositError.message }
    }

    // 4. Update Unit status
    await supabase.from('units').update({ status: 'Reserved' }).eq('id', unitId)

    // 6. Create Offer record for document tracking
    const { error: offerError } = await supabase.from('offers').insert({
        tenant_id: profile.tenant_id,
        customer_id: (await supabase.from('sales').select('customer_id').eq('id', saleId).single()).data?.customer_id,
        unit_id: unitId,
        user_id: user.id,
        price: unit?.price || 0,
        currency: unit?.currency || 'TRY',
        status: 'Sent',
        valid_until: expiryDate,
        created_at: new Date().toISOString()
    })

    if (offerError) console.error('Create Offer Error (Reservation):', offerError)

    revalidatePath('/crm')
    revalidatePath('/options')
    revalidatePath('/inventory')
    revalidatePath('/offers')

    // Broker Sync
    await syncBrokerLeadFromSale(saleId, initialStatus)

    return { success: true }
}

export async function cancelReservation(saleId: string) {
    const supabase = await createClient()

    // 1. Get current sale info
    const { data: sale } = await supabase.from('sales').select('unit_id').eq('id', saleId).single()

    // 2. Check for PAID deposits that need refunding
    const { data: paidDeposit } = await supabase
        .from('deposits')
        .select('id')
        .eq('sale_id', saleId)
        .eq('status', 'Paid')
        .maybeSingle()

    if (paidDeposit) {
        // Initiate Refund Process
        const { error: refundError } = await supabase
            .from('deposits')
            .update({ status: 'Refund Pending' })
            .eq('id', paidDeposit.id)

        if (refundError) return { error: 'İade süreci başlatılamadı: ' + refundError.message }

        revalidatePath('/finance/deposits')
        return { success: true, message: 'Kapora ödemesi onaylı olduğu için iade süreci başlatıldı. Finans onayından sonra opsiyon kalkacaktır.' }
    }

    // 3. Update Sale record to Prospect (if no paid deposit or already cancelled/pending)
    const { error: saleError } = await supabase
        .from('sales')
        .update({
            status: 'Prospect',
            reservation_expiry: null
        })
        .eq('id', saleId)

    if (saleError) {
        console.error('Cancel Reservation Error:', saleError)
        return { error: 'Failed to cancel reservation' }
    }

    // 4. Update Unit status back to For Sale
    if (sale?.unit_id) {
        await supabase.from('units').update({ status: 'For Sale' }).eq('id', sale.unit_id)
    }

    revalidatePath('/finance/deposits')

    // Broker Sync
    await syncBrokerLeadFromSale(saleId, 'Prospect')

    return { success: true }
}


// --- Customer Demands ---

export async function saveCustomerDemand(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const customer_id = formData.get('customer_id') as string
    const min_price = formData.get('min_price')
    const max_price = formData.get('max_price')
    // Handle array for room_count
    const room_count_entries = formData.getAll('room_count')
    const room_count = room_count_entries.length > 0 ? room_count_entries.map(e => String(e)) : null

    const location_preference = formData.get('location_preference') as string
    const property_type = formData.get('property_type') as string
    const investment_purpose = formData.get('investment_purpose') as string
    const notes = formData.get('notes') as string

    if (!customer_id) return { error: 'Customer ID is required' }

    // Check if demand exists
    const { data: existing } = await supabase
        .from('customer_demands')
        .select('id')
        .eq('customer_id', customer_id)
        .maybeSingle()
    const hasDemands = !!(min_price || max_price || (room_count && room_count.length > 0) || location_preference || property_type || investment_purpose || notes)

    if (!hasDemands) {
        // If no demands provided, we don't create/update demands record
        // and we definitely don't promote to Lead.
        // If they had an existing demand record and cleared it, we might want to delete it, 
        // but for now let's just skip insertion to fix the "empty Lead" bug.
        revalidatePath('/crm')
        return { success: true }
    }

    let error;
    if (existing) {
        // Update
        const res = await supabase.from('customer_demands').update({
            min_price: min_price ? Number(min_price) : null,
            max_price: max_price ? Number(max_price) : null,
            room_count,
            location_preference,
            property_type,
            investment_purpose,
            notes,
            updated_at: new Date().toISOString()
        }).eq('id', existing.id)
        error = res.error
    } else {
        // Insert
        // Ensure tenant_id is available
        if (!profile?.tenant_id) {
            console.error('Save Demand: No tenant_id found')
            return { error: 'System error: No tenant info' }
        }

        const res = await supabase.from('customer_demands').insert({
            tenant_id: profile.tenant_id,
            customer_id,
            min_price: min_price ? Number(min_price) : null,
            max_price: max_price ? Number(max_price) : null,
            room_count,
            location_preference,
            property_type,
            investment_purpose,
            notes
        })
        error = res.error
    }

    if (error) {
        console.error('Save Demand Error:', error)
        return { error: 'Failed to save demands' }
    }

    // If we reach here, hasDemands is true
    // Auto-promote to Lead in Pipeline (if logic above succeeded)
    const { data: existingSale } = await supabase
        .from('sales')
        .select('id')
        .eq('customer_id', customer_id)
        .maybeSingle()

    if (!existingSale) {
        await supabase.from('sales').insert({
            tenant_id: profile?.tenant_id,
            customer_id: customer_id,
            assigned_to: null,
            status: 'Lead',
            unit_id: null
        })
    }

    revalidatePath('/crm')
    return { success: true }
}

// --- Payment Plans ---

export async function getPaymentPlan(sale_id: string) {
    const supabase = await createClient()

    const { data: plan } = await supabase
        .from('payment_plans')
        .select('*, payment_items(*)')
        .eq('sale_id', sale_id)
        .single()

    if (!plan) return null

    // Sort items by due date
    if (plan.payment_items) {
        plan.payment_items.sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    }

    return plan
}

export async function createPaymentPlan(sale_id: string, items: any[], total_price?: number, currency: string = 'TRY') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single()

    // 0. Update Sale Final Price and Currency if provided
    if (total_price) {
        await supabase.from('sales').update({
            final_price: total_price,
            currency: currency
        }).eq('id', sale_id)
    }

    // 1. Cleanup existing plan for this sale
    await supabase.from('payment_plans').delete().eq('sale_id', sale_id)

    // 2. Create a Payment Plan header
    console.log('--- createPaymentPlan Debug ---')
    console.log('Sale ID:', sale_id)

    const { data: plan, error: planError } = await supabase
        .from('payment_plans')
        .insert({
            tenant_id: profile?.tenant_id,
            name: `Plan for Sale #${sale_id.slice(0, 4)}`,
            contract_id: null,
            sale_id: sale_id
        })
        .select()
        .single()

    if (planError) {
        console.error('Create Plan Header Error:', planError)
        // Check if tenant_id is the issue (RLS)
        if (planError.message.includes('tenant_id')) {
            return { error: 'Oturum/Şirket bilgisi hatası. Lütfen sayfayı yenileyip tekrar deneyin.' }
        }
        return { error: `Sistem Hatası (Header): ${planError.message}` }
    }

    // 2. Insert Items
    const paymentItems = items.map(item => ({
        tenant_id: profile?.tenant_id,
        payment_plan_id: plan.id,
        due_date: item.due_date,
        amount: item.amount,
        description: item.description,
        payment_type: item.payment_type === 'DownPayment' ? 'Down Payment' :
            item.payment_type === 'Balloon' ? 'Interim Payment' :
                item.payment_type === 'InterimPayment' ? 'Interim Payment' :
                    item.payment_type === 'DeliveryPayment' ? 'Final Payment' :
                        item.payment_type,
        status: 'Pending'
    }))

    let { error: itemsError } = await supabase
        .from('payment_items')
        .insert(paymentItems)

    // Fallback: If payment_type column is missing, retry without it
    if (itemsError && (itemsError.message.includes('payment_type') || itemsError.code === '42703')) {
        console.warn('Fallback: payment_type column missing, saving items without it')
        const itemsWithoutType = paymentItems.map(({ payment_type, ...rest }: any) => rest)
        const retry = await supabase.from('payment_items').insert(itemsWithoutType)
        itemsError = retry.error
    }

    if (itemsError) {
        console.error('Create Items Error:', itemsError)
        return { error: `Sistem Hatası (Items): ${itemsError.message}` }
    }

    // 3. Sync with Active Offers
    // Fetch sale details to enable fallback matching
    const { data: sale } = await supabase.from('sales').select('customer_id, unit_id').eq('id', sale_id).single()

    // When a plan is updated, also update the snapshot in the active offer
    // Try sale_id first, fallback to (customer_id + unit_id) for legacy unlinked offers
    let query = supabase.from('offers').select('id')

    if (sale?.customer_id && sale?.unit_id) {
        query = query.or(`sale_id.eq.${sale_id},and(customer_id.eq.${sale.customer_id},unit_id.eq.${sale.unit_id})`)
    } else {
        query = query.eq('sale_id', sale_id)
    }

    const { data: activeOffers } = await query
        .neq('status', 'Expired')
        .neq('status', 'Rejected')

    if (activeOffers && activeOffers.length > 0) {
        const snapshot = {
            payment_items: paymentItems.map((item, idx) => ({
                id: undefined,
                due_date: item.due_date,
                amount: item.amount,
                description: item.description,
                payment_type: item.payment_type // Already mapped above
            }))
        }

        await supabase
            .from('offers')
            .update({
                payment_plan: snapshot,
                price: total_price || undefined
            })
            .in('id', activeOffers.map(o => o.id))
    }

    revalidatePath('/crm')
    revalidatePath('/offers')
    revalidatePath('/', 'layout') // Global clear just in case
    return { success: true }
}

export async function approveOfferDirectly(offerId: string) {
    const supabase = await createClient()

    try {
        // 1. Check for any negotiations to retrieve the latest agreed price/terms
        const { data: negotiations } = await supabase
            .from('offer_negotiations')
            .select('*')
            .eq('offer_id', offerId)
            .order('created_at', { ascending: false })
            .limit(1)

        const latestNeg = negotiations && negotiations.length > 0 ? negotiations[0] : null

        const updateData: any = { status: 'Accepted' }

        // If there is a negotiation history, sync the latest proposed terms to the offer actuals
        // This ensures the Offer record represents the final agreed state
        if (latestNeg) {
            updateData.price = latestNeg.proposed_price
            updateData.currency = latestNeg.proposed_currency || latestNeg.currency
            if (latestNeg.proposed_payment_plan) {
                updateData.payment_plan = latestNeg.proposed_payment_plan
            }
            if (latestNeg.proposed_valid_until) {
                updateData.valid_until = latestNeg.proposed_valid_until
            }

            // Also ensure the negotiation itself is marked approved if it wasn't
            if (latestNeg.status !== 'Approved') {
                await supabase.from('offer_negotiations').update({ status: 'Approved' }).eq('id', latestNeg.id)
            }
        }

        // 2. Update offer status and details
        const { error } = await supabase
            .from('offers')
            .update(updateData)
            .eq('id', offerId)

        if (error) throw error

        revalidatePath('/crm')
        revalidatePath('/crm/offers')
        return { success: true }
    } catch (error: any) {
        console.error('Approve Offer Error:', error)
        return { error: error.message || 'Teklif onaylanırken bir hata oluştu' }
    }
}

export async function autoAssignLead(saleId: string) {
    const supabase = await createClient()

    // 1. Get Sale info with Project
    const { data: sale, error: saleError } = await supabase
        .from('sales')
        .select(`
            id,
            tenant_id,
            unit_id,
            units(project_id)
        `)
        .eq('id', saleId)
        .single()

    if (saleError || !sale) return { error: 'Satış kaydı bulunamadı' }

    const projectId = (sale.units as any)?.project_id

    if (!projectId) {
        return { error: 'Bu işlem için satış kaydının bir ünite veya proje ile eşleşmiş olması gerekir.' }
    }

    // 2. Find Sales Teams assigned to this project
    const { data: teamAssignments, error: teamError } = await supabase
        .from('team_project_assignments')
        .select('team_id')
        .eq('project_id', projectId)

    if (teamError || !teamAssignments || teamAssignments.length === 0) {
        return { error: 'Bu projeye atanmış herhangi bir satış ekibi bulunamadı. Lider paneli -> Ekipler kısmından atama yapmalısınız.' }
    }

    const teamIds = teamAssignments.map(a => a.team_id)

    // 3. Get all members of these teams
    const { data: members, error: memberError } = await supabase
        .from('team_members')
        .select('profile_id')
        .in('team_id', teamIds)

    if (memberError || !members || members.length === 0) {
        return { error: 'Atanmış ekiplerde üye bulunamadı.' }
    }

    const profileIds = Array.from(new Set(members.map(m => m.profile_id)))

    // 4. Calculate current load for each member (active sales count)
    const { data: loadCounts, error: loadError } = await supabase
        .from('sales')
        .select('assigned_to')
        .in('assigned_to', profileIds)
        .not('status', 'in', '("Sold", "Lost", "Completed", "Contract")')

    if (loadError) return { error: 'Yük analizi yapılamadı: ' + loadError.message }

    // Count appearances
    const counts = profileIds.reduce((acc, id) => {
        acc[id] = 0
        return acc
    }, {} as Record<string, number>)

    loadCounts.forEach(s => {
        if (s.assigned_to) {
            counts[s.assigned_to] = (counts[s.assigned_to] || 0) + 1
        }
    })

    // 5. Pick the member with the minimum load
    let bestMemberId = profileIds[0]
    let minLoad = counts[bestMemberId]

    profileIds.forEach(id => {
        if (counts[id] < minLoad) {
            minLoad = counts[id]
            bestMemberId = id
        }
    })

    // 6. Assign
    const { error: updateError } = await supabase
        .from('sales')
        .update({ assigned_to: bestMemberId })
        .eq('id', saleId)

    if (updateError) return { error: 'Atama yapılamadı: ' + updateError.message }

    revalidatePath('/crm')
    return { success: true, assignedToId: bestMemberId }
}

