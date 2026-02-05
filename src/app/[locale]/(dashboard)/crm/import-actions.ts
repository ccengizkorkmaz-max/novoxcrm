'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function parseCustomersFromExcel(formData: FormData) {
    const file = formData.get('file') as File

    if (!file) {
        return { error: 'Dosya yüklenmedi.' }
    }

    try {
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Read as array of arrays to handle flexible columns
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (!rows || rows.length === 0) {
            return { error: 'Dosya boş veya okunamadı.' }
        }

        // --- SMART COLUMN DETECTION ---
        let phoneIdx = -1
        let nameIdx = -1
        let surnameIdx = -1
        let emailIdx = -1
        let sourceIdx = -1
        let noteIdx = -1
        let dateIdx = -1
        let startRow = 0

        const firstRow = rows[0].map(cell => String(cell).toLowerCase().trim())

        // 1. Try Header Matching
        firstRow.forEach((header, idx) => {
            if (['telefon', 'phone', 'tel', 'mobile', 'cep', 'gsm'].some(k => header.includes(k))) {
                phoneIdx = idx
            } else if (['ad soyad', 'isim soyisim', 'full name', 'ad-soyad'].some(k => header.includes(k))) {
                nameIdx = idx
                surnameIdx = -1
            } else if (['ad', 'isim', 'name', 'first name'].includes(header) || header === 'ad') {
                if (nameIdx === -1 || !firstRow[nameIdx].includes('soyad')) {
                    nameIdx = idx
                }
            } else if (['soyad', 'soyisim', 'surname', 'last name'].includes(header) || header === 'soyad') {
                surnameIdx = idx
            } else if (['müşteri', 'customer'].some(k => header.includes(k)) && nameIdx === -1) {
                nameIdx = idx
            } else if (['email', 'e-posta', 'mail', 'eposta'].some(k => header.includes(k))) {
                emailIdx = idx
            } else if (['kaynak', 'source'].some(k => header.includes(k))) {
                sourceIdx = idx
            } else if (['notlar', 'notes', 'açıklama', 'description', 'detay', 'içerik', 'yorum', 'bilgi'].some(k => header.includes(k)) || header === 'not') {
                noteIdx = idx
            } else if (['kayıt tarihi', 'created_at', 'tarih', 'date'].some(k => header.includes(k))) {
                dateIdx = idx
            }
        })

        const detectedColumns = {
            fullName: nameIdx !== -1 ? firstRow[nameIdx] : null,
            phone: phoneIdx !== -1 ? firstRow[phoneIdx] : null,
            notes: noteIdx !== -1 ? firstRow[noteIdx] : null,
            date: dateIdx !== -1 ? firstRow[dateIdx] : null
        }

        // 2. If Headers Not Found (or first row looks like data)
        if (phoneIdx !== -1 || nameIdx !== -1) {
            startRow = 1
        } else {
            const sampleRows = rows.slice(0, 5)
            const colScores: { [key: number]: { phone: number, email: number, name: number } } = {}

            sampleRows.forEach(row => {
                row.forEach((cell: any, idx: number) => {
                    const val = String(cell).trim()
                    if (!val) return
                    if (!colScores[idx]) colScores[idx] = { phone: 0, email: 0, name: 0 }
                    if (standardizeTRPhone(val)) colScores[idx].phone++
                    if (val.includes('@') && val.includes('.')) colScores[idx].email++
                })
            })

            let maxPhone = 0, maxEmail = 0
            Object.keys(colScores).forEach((key) => {
                const idx = parseInt(key)
                const score = colScores[idx]
                if (score.phone > maxPhone) { maxPhone = score.phone; phoneIdx = idx }
                if (score.email > maxEmail) { maxEmail = score.email; emailIdx = idx }
            })

            if (nameIdx === -1) {
                for (let i = 0; i < rows[0].length; i++) {
                    if (i !== phoneIdx && i !== emailIdx) {
                        nameIdx = i
                        break
                    }
                }
            }
            startRow = 0
        }

        if (phoneIdx === -1 && nameIdx === -1) {
            if (rows[0][1] && standardizeTRPhone(rows[0][1])) {
                phoneIdx = 1
                nameIdx = 0
            } else {
                nameIdx = 0
                phoneIdx = 1
            }
        }

        // --- PARSING ---
        const validCustomers: any[] = []
        let skippedCount = 0

        for (let i = startRow; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            let finalName = 'İsimsiz Müşteri'
            if (nameIdx !== -1 && surnameIdx !== -1) {
                const namePart = row[nameIdx] ? String(row[nameIdx]).trim() : ''
                const surnamePart = row[surnameIdx] ? String(row[surnameIdx]).trim() : ''
                finalName = `${namePart} ${surnamePart}`.trim()
            } else if (nameIdx !== -1) {
                finalName = row[nameIdx] ? String(row[nameIdx]).trim() : ''
            }

            if (!finalName) {
                skippedCount++
                continue
            }

            const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : null
            const rawEmail = emailIdx !== -1 ? row[emailIdx] : null
            const rawSource = sourceIdx !== -1 ? row[sourceIdx] : 'Excel Import'

            let rawNote: string | null = null
            if (noteIdx !== -1 && row[noteIdx] !== undefined && row[noteIdx] !== null) {
                rawNote = String(row[noteIdx]).trim()
            }

            let rawDate = dateIdx !== -1 ? row[dateIdx] : null
            if (typeof rawDate === 'number' && rawDate > 20000) {
                const date = new Date((rawDate - 25569) * 86400 * 1000)
                rawDate = date.toISOString()
            } else if (rawDate) {
                const d = new Date(rawDate)
                if (!isNaN(d.getTime())) rawDate = d.toISOString()
                else rawDate = null
            }

            const standardizedPhone = standardizeTRPhone(rawPhone)
            if (!standardizedPhone) {
                skippedCount++
                continue
            }

            validCustomers.push({
                full_name: finalName,
                phone: standardizedPhone,
                email: rawEmail ? String(rawEmail).trim() : null,
                source: rawSource ? String(rawSource).trim() : 'Excel Import',
                notes: rawNote,
                created_at: rawDate || undefined
            })
        }

        if (validCustomers.length === 0) {
            return { error: 'Geçerli müşteri kaydı bulunamadı.' }
        }

        return {
            success: true,
            data: validCustomers,
            skipped: skippedCount,
            total: rows.length - startRow,
            debugInfo: detectedColumns
        }

    } catch (error) {
        console.error('Parsing Error:', error)
        return { error: 'Dosya işlenirken hata oluştu.' }
    }
}

export async function bulkCreateCustomers(customers: any[]) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { error: 'No tenant found' }

        let totalSuccess = 0
        const errors: string[] = []
        const CHUNK_SIZE = 500

        // 1. Fetch existing 'Lead' sales to avoid duplicates
        const { data: existingLeads } = await supabase
            .from('sales')
            .select('customer_id')
            .eq('tenant_id', profile.tenant_id)
            .eq('status', 'Lead')
        const existingLeadMap = new Set(existingLeads?.map(s => s.customer_id) || [])

        // 2. Process in chunks
        for (let i = 0; i < customers.length; i += CHUNK_SIZE) {
            const batch = customers.slice(i, i + CHUNK_SIZE)
            const customersToUpsert = batch.map(c => ({
                full_name: c.full_name,
                phone: c.phone,
                email: c.email,
                source: c.source,
                created_at: c.created_at || new Date().toISOString(),
                tenant_id: profile.tenant_id!
            }))

            // A. Upsert Customers (Guarantee they exist)
            const { error: upsertError } = await supabase
                .from('customers')
                .upsert(customersToUpsert, { onConflict: 'phone', ignoreDuplicates: false })

            if (upsertError) {
                console.error(`Chunk ${i} Upsert Error:`, upsertError)
                for (const c of batch) {
                    const { data: sData, error: sError } = await supabase
                        .from('customers')
                        .upsert({
                            full_name: c.full_name,
                            phone: c.phone,
                            email: c.email,
                            source: c.source,
                            created_at: c.created_at || new Date().toISOString(),
                            tenant_id: profile.tenant_id!
                        }, { onConflict: 'phone', ignoreDuplicates: false })
                        .select('id, created_at')

                    if (!sError && sData?.[0]) {
                        await createRelatedRecords(sData[0].id, c.notes, sData[0].created_at)
                        totalSuccess++
                    } else {
                        errors.push(`${c.full_name}: Müşteri oluşturulamadı (${sError?.message || 'Bilinmeyen hata'})`)
                    }
                }
                continue
            }

            // B. Explicitly Fetch IDs for this batch (Bulletproof)
            const batchPhones = batch.map(c => c.phone)
            const { data: idData, error: idError } = await supabase
                .from('customers')
                .select('id, phone, created_at')
                .in('phone', batchPhones)
                .eq('tenant_id', profile.tenant_id!)

            if (idError || !idData || idData.length === 0) {
                errors.push(`ID Fetch Error in Batch ${i / CHUNK_SIZE}: ${idError?.message || 'Data empty'}`)
                continue
            }

            // C. Prepare Child Records
            const batchDemands: any[] = []
            const batchSales: any[] = []
            const batchActivities: any[] = []
            const batchMap = new Map(batch.map(c => [c.phone, c]));

            idData.forEach(match => {
                const original = batchMap.get(match.phone);
                if (original?.notes) {
                    const createdAt = match.created_at || new Date().toISOString()

                    batchDemands.push({
                        tenant_id: profile.tenant_id!,
                        customer_id: match.id,
                        notes: original.notes
                    })

                    if (!existingLeadMap.has(match.id)) {
                        batchSales.push({
                            tenant_id: profile.tenant_id!,
                            customer_id: match.id,
                            status: 'Lead',
                            assigned_to: null,
                            project_id: null,
                            unit_id: null
                        })
                        existingLeadMap.add(match.id)
                    }

                    batchActivities.push({
                        tenant_id: profile.tenant_id!,
                        customer_id: match.id,
                        user_id: user.id,
                        owner_id: user.id,
                        assigned_by_id: user.id,
                        topic: 'General',
                        type: 'Call',
                        summary: 'Excel Import Notu',
                        description: original.notes,
                        notes: original.notes,
                        status: 'Completed',
                        outcome: 'Success',
                        completed_at: createdAt,
                        due_date: createdAt,
                        done_at: createdAt
                    })
                }
            })

            // D. Insert Children
            if (batchDemands.length > 0) {
                const { error } = await supabase.from('customer_demands').insert(batchDemands)
                if (error) errors.push(`Talepler Hatası: ${error.message}`)
            }
            if (batchSales.length > 0) {
                const { error } = await supabase.from('sales').insert(batchSales)
                if (error) errors.push(`Satışlar Hatası: ${error.message}`)
            }
            if (batchActivities.length > 0) {
                const { error } = await supabase.from('activities').insert(batchActivities)
                if (error) errors.push(`Aktiviteler Hatası: ${error.message}`)
            }

            totalSuccess += idData.length
        }

        async function createRelatedRecords(id: string, notes: string | null, createdAt: string) {
            if (!notes || !profile?.tenant_id || !user) return
            const cDate = createdAt || new Date().toISOString()
            await supabase.from('customer_demands').insert({ tenant_id: profile.tenant_id, customer_id: id, notes: notes })
            if (!existingLeadMap.has(id)) {
                await supabase.from('sales').insert({ tenant_id: profile.tenant_id, customer_id: id, status: 'Lead', assigned_to: null, project_id: null, unit_id: null })
                existingLeadMap.add(id)
            }
            await supabase.from('activities').insert({
                tenant_id: profile.tenant_id,
                customer_id: id,
                user_id: user.id,
                owner_id: user.id,
                assigned_by_id: user.id,
                topic: 'General',
                type: 'Call',
                summary: 'Excel Import Notu',
                description: notes,
                notes: notes,
                status: 'Completed',
                outcome: 'Success',
                completed_at: cDate,
                due_date: cDate,
                done_at: cDate
            })
        }

        return {
            success: true,
            count: totalSuccess,
            messages: errors,
            totalRows: customers.length
        }
    } catch (fatalError: any) {
        console.error('Fatal Import Action Error:', fatalError)
        return {
            success: false,
            error: `Sistem hatası: ${fatalError.message || 'Bilinmeyen hata'}`
        }
    }
}

export async function cleanupImportedAssignments() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) return { success: false, error: 'No tenant found' }

        const { data: importedCustomers, error: custError } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', profile.tenant_id)
            .eq('source', 'Excel Import')

        if (!importedCustomers || importedCustomers.length === 0) return { success: true, count: 0 }

        const customerIds = importedCustomers.map(c => c.id)
        let totalUpdated = 0
        for (let i = 0; i < customerIds.length; i += 1000) {
            const chunk = customerIds.slice(i, i + 1000)
            const { data, error } = await supabase
                .from('sales')
                .update({ assigned_to: null })
                .eq('tenant_id', profile.tenant_id)
                .in('customer_id', chunk)
            if (!error) totalUpdated += chunk.length
        }

        revalidatePath('/[locale]/(dashboard)/crm')
        return { success: true, count: totalUpdated }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

function standardizeTRPhone(input: any): string | null {
    if (!input) return null
    // Strip everything except digits
    let digits = String(input).replace(/\D/g, '')

    // TR numbers: 5xx... (10 digits), 05xx... (11 digits), 905xx... (12 digits)
    // We standardize to the 10-digit version (5xxxxxxxxx) to match existing DB records
    if (digits.length === 10 && digits.startsWith('5')) {
        return digits
    } else if (digits.length === 11 && digits.startsWith('05')) {
        return digits.substring(1)
    } else if (digits.length === 12 && digits.startsWith('905')) {
        return digits.substring(2)
    } else if (digits.length >= 13 && digits.includes('905')) {
        // Handle cases like +90 5xx... with extra digits or leading +
        const index = digits.indexOf('5')
        if (index !== -1 && digits.substring(index).length === 10) {
            return digits.substring(index)
        }
    }

    // If it's 10 digits but doesn't start with 5, still return it as is but it might be non-mobile
    if (digits.length === 10) return digits

    return null
}
