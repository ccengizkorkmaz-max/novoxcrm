'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface SalesOfficeLocation {
    id: string
    name: string
    type: 'office' | 'hq' | 'lounge' | 'restaurant' | 'hotel' | 'site' | 'other'
    projectId?: string | null
    projectName?: string | null
    address: string
    district?: string
    city?: string
    latitude?: number | null
    longitude?: number | null
    mapsUrl?: string
    phone?: string
    notes?: string // e.g. "Valede NovoCRM rezervasyonu vardır", "2. Kat VIP salon"
    isActive: boolean
    createdAt: string
    updatedAt: string
}

/**
 * Get all sales offices and meeting points for the current tenant
 */
export async function getSalesOffices(): Promise<{ success: boolean; offices?: SalesOfficeLocation[]; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Yetkisiz erişim' }

        const adminSupabase = createAdminClient()
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

        const { data: tenantData } = await adminSupabase
            .from('tenants')
            .select('brand_config')
            .eq('id', profile.tenant_id)
            .single()

        const brandConfig = tenantData?.brand_config || {}
        const offices: SalesOfficeLocation[] = Array.isArray(brandConfig.sales_offices) ? brandConfig.sales_offices : []

        return { success: true, offices }
    } catch (err: any) {
        console.error('getSalesOffices error:', err)
        return { success: false, error: err.message || 'Veriler alınamadı' }
    }
}

/**
 * Save (create or update) a sales office / meeting location
 */
export async function saveSalesOffice(officeData: Partial<SalesOfficeLocation> & { name: string }): Promise<{ success: boolean; office?: SalesOfficeLocation; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Yetkisiz erişim' }

        const adminSupabase = createAdminClient()
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

        const { data: tenantData } = await adminSupabase
            .from('tenants')
            .select('brand_config')
            .eq('id', profile.tenant_id)
            .single()

        const brandConfig = tenantData?.brand_config || {}
        const existingOffices: SalesOfficeLocation[] = Array.isArray(brandConfig.sales_offices) ? [...brandConfig.sales_offices] : []

        const now = new Date().toISOString()
        let savedOffice: SalesOfficeLocation

        // Auto-generate Google Maps link if lat/lng or address provided
        let mapsUrl = officeData.mapsUrl || ''
        if (!mapsUrl) {
            if (officeData.latitude && officeData.longitude) {
                mapsUrl = `https://maps.google.com/?q=${officeData.latitude},${officeData.longitude}`
            } else if (officeData.address || officeData.name) {
                const searchQ = [officeData.name, officeData.address, officeData.district, officeData.city].filter(Boolean).join(' ')
                mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQ)}`
            }
        }

        if (officeData.id) {
            // Update
            const index = existingOffices.findIndex(o => o.id === officeData.id)
            if (index === -1) return { success: false, error: 'Güncellenecek lokasyon bulunamadı' }

            savedOffice = {
                ...existingOffices[index],
                ...officeData,
                mapsUrl,
                updatedAt: now
            }
            existingOffices[index] = savedOffice
        } else {
            // Create
            savedOffice = {
                id: crypto.randomUUID(),
                name: officeData.name.trim(),
                type: officeData.type || 'office',
                projectId: officeData.projectId || null,
                projectName: officeData.projectName || null,
                address: officeData.address?.trim() || '',
                district: officeData.district?.trim() || '',
                city: officeData.city?.trim() || '',
                latitude: officeData.latitude || null,
                longitude: officeData.longitude || null,
                mapsUrl,
                phone: officeData.phone?.trim() || '',
                notes: officeData.notes?.trim() || '',
                isActive: officeData.isActive ?? true,
                createdAt: now,
                updatedAt: now
            }
            existingOffices.unshift(savedOffice)
        }

        const updatedConfig = {
            ...brandConfig,
            sales_offices: existingOffices
        }

        const { error } = await adminSupabase
            .from('tenants')
            .update({ brand_config: updatedConfig })
            .eq('id', profile.tenant_id)

        if (error) throw error

        revalidatePath('/settings')
        revalidatePath('/activities')
        revalidatePath('/crm')

        return { success: true, office: savedOffice }
    } catch (err: any) {
        console.error('saveSalesOffice error:', err)
        return { success: false, error: err.message || 'Kayıt sırasında hata oluştu' }
    }
}

/**
 * Delete a sales office
 */
export async function deleteSalesOffice(officeId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Yetkisiz erişim' }

        const adminSupabase = createAdminClient()
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

        const { data: tenantData } = await adminSupabase
            .from('tenants')
            .select('brand_config')
            .eq('id', profile.tenant_id)
            .single()

        const brandConfig = tenantData?.brand_config || {}
        const existingOffices: SalesOfficeLocation[] = Array.isArray(brandConfig.sales_offices) ? brandConfig.sales_offices : []

        const filtered = existingOffices.filter(o => o.id !== officeId)

        const updatedConfig = {
            ...brandConfig,
            sales_offices: filtered
        }

        const { error } = await adminSupabase
            .from('tenants')
            .update({ brand_config: updatedConfig })
            .eq('id', profile.tenant_id)

        if (error) throw error

        revalidatePath('/settings')
        revalidatePath('/activities')
        revalidatePath('/crm')

        return { success: true }
    } catch (err: any) {
        console.error('deleteSalesOffice error:', err)
        return { success: false, error: err.message || 'Silme işlemi başarısız' }
    }
}

/**
 * Toggle active status
 */
export async function toggleSalesOfficeActive(officeId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Yetkisiz erişim' }

        const adminSupabase = createAdminClient()
        const { data: profile } = await adminSupabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { success: false, error: 'Tenant bulunamadı' }

        const { data: tenantData } = await adminSupabase
            .from('tenants')
            .select('brand_config')
            .eq('id', profile.tenant_id)
            .single()

        const brandConfig = tenantData?.brand_config || {}
        const existingOffices: SalesOfficeLocation[] = Array.isArray(brandConfig.sales_offices) ? [...brandConfig.sales_offices] : []

        const index = existingOffices.findIndex(o => o.id === officeId)
        if (index === -1) return { success: false, error: 'Lokasyon bulunamadı' }

        existingOffices[index] = {
            ...existingOffices[index],
            isActive,
            updatedAt: new Date().toISOString()
        }

        const updatedConfig = {
            ...brandConfig,
            sales_offices: existingOffices
        }

        const { error } = await adminSupabase
            .from('tenants')
            .update({ brand_config: updatedConfig })
            .eq('id', profile.tenant_id)

        if (error) throw error

        revalidatePath('/settings')
        revalidatePath('/activities')

        return { success: true }
    } catch (err: any) {
        console.error('toggleSalesOfficeActive error:', err)
        return { success: false, error: err.message }
    }
}
