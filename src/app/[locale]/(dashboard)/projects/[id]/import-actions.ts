'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function importUnitsFromExcel(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const projectId = formData.get('project_id') as string
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'Dosya gerekli' }
    }

    try {
        // Read file as buffer for XLSX
        const bytes = await file.arrayBuffer()
        const workbook = XLSX.read(bytes, { type: 'buffer' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(worksheet)

        if (data.length === 0) {
            return { error: 'Dosya boş veya geçersiz format.' }
        }

        const units = []

        for (const row of data as any[]) {
            const unit: any = {
                tenant_id: profile.tenant_id,
                project_id: projectId,
                currency: 'TRY',
                status: 'For Sale'
            }

            // Map columns (case-insensitive and alias matching)
            Object.keys(row).forEach(key => {
                const header = key.trim().toLowerCase()
                const value = row[key]
                if (value === undefined || value === null) return

                switch (header) {
                    case 'unit_number':
                    case 'ünite_no':
                    case 'ünite no':
                        unit.unit_number = String(value)
                        break
                    case 'unit_category':
                    case 'ünite türü':
                    case 'kategori':
                        unit.unit_category = String(value)
                        break
                    case 'type':
                    case 'tip':
                    case 'oda tipi':
                        unit.type = String(value)
                        break
                    case 'status':
                    case 'durum':
                        const s = String(value)
                        if (s === 'Satılık') unit.status = 'For Sale'
                        else if (s === 'Rezerve') unit.status = 'Reserved'
                        else if (s === 'Satıldı') unit.status = 'Sold'
                        else unit.status = s
                        break
                    case 'price':
                    case 'fiyat':
                        if (typeof value === 'number') {
                            unit.price = value
                        } else {
                            unit.price = parseFloat(String(value).replace(/\./g, '').replace(',', '.')) || 0
                        }
                        break
                    case 'currency':
                    case 'para birimi':
                        unit.currency = String(value)
                        break
                    case 'area_gross':
                    case 'brüt m²':
                    case 'brüt_alan':
                    case 'brut':
                        unit.area_gross = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.')) || null
                        break
                    case 'area_net':
                    case 'net m²':
                    case 'net_alan':
                    case 'net':
                        unit.area_net = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.')) || null
                        break
                    case 'bathrooms':
                    case 'banyo sayısı':
                        unit.bathroom_count = typeof value === 'number' ? value : parseInt(String(value)) || null
                        break
                    case 'facade_direction':
                    case 'cephe':
                        unit.direction = String(value)
                        break
                    case 'view':
                    case 'manzara':
                        unit.view = String(value)
                        break
                    case 'floor':
                    case 'kat':
                        unit.floor = String(value)
                        break
                    case 'block':
                    case 'blok':
                        unit.block = String(value)
                        break
                }
            })

            // Minimum required fields
            if (unit.unit_number && unit.type) {
                units.push(unit)
            }
        }

        if (units.length === 0) {
            return { error: 'Uygun ünite bulunamadı. Lütfen "Ünite No" ve "Oda Tipi" kolonlarının dolu olduğundan emin olun.' }
        }

        // Insert units
        const { error } = await supabase
            .from('units')
            .insert(units)

        if (error) {
            console.error('Import Error:', error)
            return { error: 'Üniteler aktarılamadı: ' + error.message }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true, count: units.length }
    } catch (error) {
        console.error('Parse Error:', error)
        return { error: 'Dosya okunurken bir hata oluştu. Lütfen dosyanın bozuk olmadığından emin olun.' }
    }
}
