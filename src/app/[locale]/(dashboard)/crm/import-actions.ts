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
            // Phone
            if (['telefon', 'phone', 'tel', 'mobile', 'cep', 'gsm'].some(k => header.includes(k))) {
                phoneIdx = idx
            }
            // Name - Check for explicit "Ad Soyad" or "Full Name" first
            else if (['ad soyad', 'isim soyisim', 'full name', 'ad-soyad'].some(k => header.includes(k))) {
                nameIdx = idx
                surnameIdx = -1 // Reset surname if we found a full name column
            }
            // Check for separate Name column (only if we haven't found a full name column yet)
            else if (['ad', 'isim', 'name', 'first name'].includes(header) || header === 'ad') {
                if (nameIdx === -1 || !firstRow[nameIdx].includes('soyad')) {
                    nameIdx = idx
                }
            }
            // Check for separate Surname column
            else if (['soyad', 'soyisim', 'surname', 'last name'].includes(header) || header === 'soyad') {
                surnameIdx = idx
            }
            // Fallback for generic "Musteri" if no specific name found
            else if (['müşteri', 'customer'].some(k => header.includes(k)) && nameIdx === -1) {
                nameIdx = idx
            }

            // Email
            else if (['email', 'e-posta', 'mail', 'eposta'].some(k => header.includes(k))) {
                emailIdx = idx
            }
            // Source
            else if (['kaynak', 'source'].some(k => header.includes(k))) {
                sourceIdx = idx
            }
            // Notes - STRICTER CHECK to avoid matching matching other things
            else if (['notlar', 'notes', 'açıklama', 'description'].some(k => header.includes(k)) || header === 'not') {
                noteIdx = idx
            }
            // Date
            else if (['kayıt tarihi', 'created_at', 'tarih', 'date'].some(k => header.includes(k))) {
                dateIdx = idx
            }
        })

        // 2. If Headers Not Found (or first row looks like data)
        if (phoneIdx !== -1 || nameIdx !== -1) {
            startRow = 1
        } else {
            // Fallback Content Detection
            // Analyze first 5 rows to guess columns
            const sampleRows = rows.slice(0, 5)
            const colScores: { [key: number]: { phone: number, email: number, name: number } } = {}

            sampleRows.forEach(row => {
                row.forEach((cell: any, idx: number) => {
                    const val = String(cell).trim()
                    if (!val) return

                    if (!colScores[idx]) colScores[idx] = { phone: 0, email: 0, name: 0 }

                    // Check Phone
                    if (standardizeTRPhone(val)) colScores[idx].phone++

                    // Check Email
                    if (val.includes('@') && val.includes('.')) colScores[idx].email++
                })
            })

            // Assign indices based on max detection
            let maxPhone = 0, maxEmail = 0

            Object.keys(colScores).forEach((key) => {
                const idx = parseInt(key)
                const score = colScores[idx]

                if (score.phone > maxPhone) { maxPhone = score.phone; phoneIdx = idx }
                if (score.email > maxEmail) { maxEmail = score.email; emailIdx = idx }
            })

            // Name detection: Pick first non-phone, non-email column with data
            if (nameIdx === -1) {
                for (let i = 0; i < rows[0].length; i++) {
                    if (i !== phoneIdx && i !== emailIdx) {
                        // Simple heuristic: if it has strings > 3 chars
                        nameIdx = i
                        break
                    }
                }
            }
        }

        // Fallback
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

            // Name Construction
            let finalName = 'İsimsiz Müşteri'

            if (nameIdx !== -1 && surnameIdx !== -1) {
                // Combine Ad + Soyad columns
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

            // Note parsing: handle numbers, dates, text safely
            let rawNote: string | null = null
            if (noteIdx !== -1 && row[noteIdx] !== undefined && row[noteIdx] !== null) {
                const val = row[noteIdx]
                rawNote = String(val).trim()
            }

            // Date parsing
            let rawDate = dateIdx !== -1 ? row[dateIdx] : null
            if (typeof rawDate === 'number' && rawDate > 20000) {
                const date = new Date((rawDate - 25569) * 86400 * 1000)
                rawDate = date.toISOString()
            } else if (rawDate) {
                const d = new Date(rawDate)
                if (!isNaN(d.getTime())) {
                    rawDate = d.toISOString()
                } else {
                    rawDate = null
                }
            }

            const standardizedPhone = standardizeTRPhone(rawPhone)

            if (!standardizedPhone) {
                skippedCount++;
                continue;
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
            return { error: 'Geçerli müşteri kaydı bulunamadı. Lütfen telefon sütununun formatını kontrol edin.' }
        }

        return {
            success: true,
            data: validCustomers,
            skipped: skippedCount,
            total: rows.length - startRow
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

        let successCount = 0
        const errors: string[] = []
        const successfullyCreated: any[] = [] // { id, notes, created_at }

        // 1. Attempt Batch Insert for Customers
        const customersToInsert = customers.map(c => ({
            full_name: c.full_name,
            phone: c.phone,
            email: c.email,
            source: c.source,
            created_at: c.created_at || new Date().toISOString(),
            tenant_id: profile.tenant_id
        }))

        const { data: custData, error: custError } = await supabase
            .from('customers')
            .insert(customersToInsert)
            .select('id, phone, created_at')

        if (!custError && custData) {
            // Batch success: Map results to original notes
            custData.forEach(newCust => {
                const original = customers.find(o => o.phone === newCust.phone)
                successfullyCreated.push({
                    id: newCust.id,
                    notes: original?.notes,
                    created_at: newCust.created_at
                })
            })
        } else {
            // Batch failure: Fallback to sequential for this batch
            for (const c of customers) {
                const { notes, ...customerData } = c
                const { data: seqData, error: seqError } = await supabase
                    .from('customers')
                    .insert({
                        full_name: customerData.full_name,
                        phone: customerData.phone,
                        email: customerData.email,
                        source: customerData.source,
                        created_at: customerData.created_at || new Date().toISOString(),
                        tenant_id: profile.tenant_id
                    })
                    .select('id, created_at')

                const newCust = seqData?.[0]
                if (seqError || !newCust) {
                    const errMsg = seqError?.message || 'Bilinmeyen hata'
                    errors.push(`${c.full_name}: Müşteri oluşturulamadı (${errMsg})`)
                } else {
                    successfullyCreated.push({
                        id: newCust.id,
                        notes: notes,
                        created_at: newCust.created_at
                    })
                }
            }
        }

        successCount = successfullyCreated.length

        // 2. Batch Insert Related Records
        if (successfullyCreated.length > 0) {
            const demandsData: any[] = []
            const salesData: any[] = []
            const activitiesData: any[] = []

            successfullyCreated.forEach(c => {
                if (c.notes) {
                    demandsData.push({
                        tenant_id: profile.tenant_id,
                        customer_id: c.id,
                        notes: c.notes
                    })
                    salesData.push({
                        tenant_id: profile.tenant_id,
                        customer_id: c.id,
                        status: 'Lead',
                        description: c.notes,
                        assigned_to: user.id
                    })
                    activitiesData.push({
                        tenant_id: profile.tenant_id,
                        customer_id: c.id,
                        user_id: user.id,
                        owner_id: user.id,
                        assigned_by_id: user.id,
                        topic: 'General',
                        type: 'Call',
                        summary: 'Excel Import Notu',
                        description: c.notes,
                        notes: c.notes,
                        status: 'Completed',
                        outcome: 'Success',
                        completed_at: c.created_at,
                        done_at: c.created_at
                    })
                }
            })

            if (demandsData.length > 0) {
                await supabase.from('customer_demands').insert(demandsData)
            }
            if (salesData.length > 0) {
                await supabase.from('sales').insert(salesData)
            }
            if (activitiesData.length > 0) {
                await supabase.from('activities').insert(activitiesData)
            }
        }

        return {
            success: true,
            count: successCount,
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

function standardizeTRPhone(input: any): string | null {
    if (!input) return null

    // Convert to string and strip non-digits
    let digits = String(input).replace(/\D/g, '')

    if (digits.length === 10 && digits.startsWith('5')) {
        return `+90${digits}`
    } else if (digits.length === 11 && digits.startsWith('05')) {
        return `+9${digits}` // +905...
    } else if (digits.length === 12 && digits.startsWith('905')) {
        return `+${digits}`
    }

    return null
}
