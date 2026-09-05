'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── CREATE CONTACT ───
export async function createContact(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const full_name = (formData.get('full_name') as string)?.trim()
    const phone = (formData.get('phone') as string)?.trim() || null
    const email = (formData.get('email') as string)?.trim() || null
    const company = (formData.get('company') as string)?.trim() || null
    const title = (formData.get('title') as string)?.trim() || null
    const source = (formData.get('source') as string)?.trim() || 'Manuel Giriş'
    const notes = (formData.get('notes') as string)?.trim() || null
    const city = (formData.get('city') as string)?.trim() || null
    const district = (formData.get('district') as string)?.trim() || null
    const tagsRaw = formData.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : []

    if (!full_name) return { error: 'Ad Soyad zorunludur.' }

    // Mükerrer kontrol (telefon veya email)
    const adminSupabase = createAdminClient()
    if (phone) {
        const cleanPhone = phone.replace(/\D/g, '')
        const { data: existing } = await adminSupabase
            .from('contacts')
            .select('id, full_name')
            .eq('tenant_id', profile.tenant_id)
            .or(`phone.eq.${phone},phone.eq.${cleanPhone}`)
            .limit(1)

        if (existing && existing.length > 0) {
            return { error: `Bu telefon numarası zaten "${existing[0].full_name}" kontağına kayıtlı.` }
        }
    }

    if (email) {
        const { data: existing } = await adminSupabase
            .from('contacts')
            .select('id, full_name')
            .eq('tenant_id', profile.tenant_id)
            .eq('email', email.toLowerCase())
            .limit(1)

        if (existing && existing.length > 0) {
            return { error: `Bu e-posta adresi zaten "${existing[0].full_name}" kontağına kayıtlı.` }
        }
    }

    const { data: newContact, error } = await adminSupabase
        .from('contacts')
        .insert({
            tenant_id: profile.tenant_id,
            full_name,
            phone,
            email: email?.toLowerCase() || null,
            company,
            title,
            source,
            tags,
            notes,
            city,
            district,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('createContact error:', error)
        return { error: error.message }
    }

    revalidatePath('/crm/contacts')
    return { success: true, contact: newContact }
}

// ─── DELETE CONTACT ───
export async function deleteContact(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from('contacts').delete().eq('id', contactId)

    if (error) return { error: error.message }

    revalidatePath('/crm/contacts')
    return { success: true }
}

// ─── DELETE MULTIPLE CONTACTS ───
export async function deleteContacts(contactIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase.from('contacts').delete().in('id', contactIds)

    if (error) return { error: error.message }

    revalidatePath('/crm/contacts')
    return { success: true, count: contactIds.length }
}

// ─── UPDATE TAGS ───
export async function updateContactTags(contactId: string, tags: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
        .from('contacts')
        .update({ tags, updated_at: new Date().toISOString() })
        .eq('id', contactId)

    if (error) return { error: error.message }

    revalidatePath('/crm/contacts')
    return { success: true }
}

// ─── BULK UPDATE TAGS ───
export async function bulkUpdateContactTags(contactIds: string[], tags: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const adminSupabase = createAdminClient()
    const { error } = await adminSupabase
        .from('contacts')
        .update({ tags, updated_at: new Date().toISOString() })
        .in('id', contactIds)

    if (error) return { error: error.message }

    revalidatePath('/crm/contacts')
    return { success: true, count: contactIds.length }
}

// ─── IMPORT FROM EXCEL ───
export async function importContactsFromExcel(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const file = formData.get('file') as File
    if (!file) return { error: 'Dosya yüklenmedi.' }

    const importTags = (formData.get('import_tags') as string || '').split(',').map(t => t.trim()).filter(Boolean)

    try {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

        if (!rows || rows.length < 2) return { error: 'Dosya boş veya başlık satırı eksik.' }

        // Smart column detection
        const headers = rows[0].map(h => String(h || '').toLowerCase().trim())
        let nameIdx = -1, surnameIdx = -1, phoneIdx = -1, emailIdx = -1, companyIdx = -1, sourceIdx = -1, noteIdx = -1, cityIdx = -1, tagIdx = -1

        headers.forEach((h, i) => {
            if (['ad soyad', 'isim soyisim', 'full name', 'ad-soyad', 'adı soyadı', 'müşteri adı', 'isim'].some(k => h.includes(k))) nameIdx = i
            else if (['ad', 'isim', 'name', 'first name'].includes(h)) { if (nameIdx === -1) nameIdx = i }
            else if (['soyad', 'soyisim', 'surname', 'last name'].includes(h)) surnameIdx = i
            else if (['telefon', 'phone', 'tel', 'mobile', 'cep', 'gsm'].some(k => h.includes(k))) phoneIdx = i
            else if (['e-posta', 'email', 'mail', 'eposta'].some(k => h.includes(k))) emailIdx = i
            else if (['firma', 'şirket', 'company', 'kurum'].some(k => h.includes(k))) companyIdx = i
            else if (['kaynak', 'source', 'kanal'].some(k => h.includes(k))) sourceIdx = i
            else if (['not', 'note', 'açıklama', 'notes'].some(k => h.includes(k))) noteIdx = i
            else if (['şehir', 'il', 'city'].some(k => h.includes(k))) cityIdx = i
            else if (['etiket', 'tag', 'segment', 'grup'].some(k => h.includes(k))) tagIdx = i
        })

        // Auto-detect if no header match
        if (nameIdx === -1 && phoneIdx === -1) {
            for (let i = 0; i < headers.length; i++) {
                const sample = rows[1]?.[i]
                if (sample && typeof sample === 'string' && sample.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/)) { nameIdx = i; break }
            }
            for (let i = 0; i < headers.length; i++) {
                if (i === nameIdx) continue
                const sample = String(rows[1]?.[i] || '')
                if (sample.replace(/\D/g, '').length >= 10) { phoneIdx = i; break }
            }
        }

        const adminSupabase = createAdminClient()
        const contacts: any[] = []
        let skipped = 0
        let duplicates = 0

        // Get existing phones for dedup
        const { data: existingContacts } = await adminSupabase
            .from('contacts')
            .select('phone, email')
            .eq('tenant_id', profile.tenant_id)

        const existingPhones = new Set((existingContacts || []).map(c => c.phone?.replace(/\D/g, '')).filter(Boolean))
        const existingEmails = new Set((existingContacts || []).map(c => c.email?.toLowerCase()).filter(Boolean))

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            let fullName = ''
            if (nameIdx >= 0) fullName = String(row[nameIdx] || '').trim()
            if (surnameIdx >= 0) fullName = `${fullName} ${String(row[surnameIdx] || '').trim()}`.trim()

            const phone = phoneIdx >= 0 ? String(row[phoneIdx] || '').trim() : ''
            const email = emailIdx >= 0 ? String(row[emailIdx] || '').trim().toLowerCase() : ''

            if (!fullName && !phone && !email) { skipped++; continue }

            // Dedup check
            const cleanPhone = phone.replace(/\D/g, '')
            if (cleanPhone && existingPhones.has(cleanPhone)) { duplicates++; continue }
            if (email && existingEmails.has(email)) { duplicates++; continue }

            if (cleanPhone) existingPhones.add(cleanPhone)
            if (email) existingEmails.add(email)

            const rowTags = [...importTags]
            if (tagIdx >= 0 && row[tagIdx]) {
                const extraTags = String(row[tagIdx]).split(/[,;]/).map(t => t.trim()).filter(Boolean)
                rowTags.push(...extraTags)
            }

            contacts.push({
                tenant_id: profile.tenant_id,
                full_name: fullName || 'İsimsiz',
                phone: phone || null,
                email: email || null,
                company: companyIdx >= 0 ? String(row[companyIdx] || '').trim() || null : null,
                source: sourceIdx >= 0 ? String(row[sourceIdx] || '').trim() || 'Excel Import' : 'Excel Import',
                notes: noteIdx >= 0 ? String(row[noteIdx] || '').trim() || null : null,
                city: cityIdx >= 0 ? String(row[cityIdx] || '').trim() || null : null,
                tags: [...new Set(rowTags)],
                created_by: user.id
            })
        }

        if (contacts.length === 0) {
            return { error: `Aktarılacak kontak bulunamadı. (${skipped} boş satır, ${duplicates} mükerrer)` }
        }

        // Batch insert
        let inserted = 0
        for (let i = 0; i < contacts.length; i += 500) {
            const batch = contacts.slice(i, i + 500)
            const { error } = await adminSupabase.from('contacts').insert(batch)
            if (error) {
                console.error('Batch insert error:', error)
                return { error: `${inserted} kontak eklendi, hata: ${error.message}`, inserted }
            }
            inserted += batch.length
        }

        revalidatePath('/crm/contacts')
        return {
            success: true,
            inserted,
            skipped,
            duplicates,
            message: `${inserted} kontak başarıyla aktarıldı.${duplicates > 0 ? ` ${duplicates} mükerrer atlandı.` : ''}${skipped > 0 ? ` ${skipped} boş satır atlandı.` : ''}`
        }
    } catch (err: any) {
        console.error('importContactsFromExcel error:', err)
        return { error: `Dosya işlenirken hata: ${err.message}` }
    }
}

// ─── EXPORT CONTACTS ───
export async function exportContacts(filters?: { search?: string; source?: string; tag?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Yetkisiz erişim' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return { error: 'Tenant bulunamadı' }

    const adminSupabase = createAdminClient()
    let query = adminSupabase
        .from('contacts')
        .select('full_name, phone, email, company, title, source, tags, notes, city, district, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

    if (filters?.source) query = query.eq('source', filters.source)
    if (filters?.tag) query = query.contains('tags', [filters.tag])

    const { data, error } = await query

    if (error) return { error: error.message }

    try {
        const XLSX = await import('xlsx')
        const rows = (data || []).map(c => ({
            'Ad Soyad': c.full_name,
            'Telefon': c.phone || '',
            'E-Posta': c.email || '',
            'Firma': c.company || '',
            'Ünvan': c.title || '',
            'Kaynak': c.source || '',
            'Etiketler': (c.tags || []).join(', '),
            'Not': c.notes || '',
            'Şehir': c.city || '',
            'İlçe': c.district || '',
            'Eklenme Tarihi': c.created_at ? new Date(c.created_at).toLocaleString('tr-TR') : ''
        }))

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Kontaklar')
        const buf = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })

        return { success: true, base64: buf, filename: `kontaklar_${new Date().toISOString().slice(0, 10)}.xlsx`, count: rows.length }
    } catch (err: any) {
        return { error: `Export hatası: ${err.message}` }
    }
}
