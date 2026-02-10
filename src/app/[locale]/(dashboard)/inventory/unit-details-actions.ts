'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Unit Documents ---
export async function getUnitDocuments(unitId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('unit_documents')
        .select('*, profiles:uploaded_by(full_name)')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })

    return data || []
}

export async function uploadUnitDocument(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Oturum açmanız gerekiyor.' }

    const unitId = formData.get('unit_id') as string
    const file = formData.get('file') as File

    if (!unitId || !file) return { error: 'Eksik bilgi.' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return { error: 'Profil bulunamadı.' }

    // Upload to Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${unitId}/${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
        .from('unit-documents')
        .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) return { error: 'Dosya yüklenemedi: ' + uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('unit-documents').getPublicUrl(fileName)

    // Save to DB
    const { error: dbError } = await supabase.from('unit_documents').insert({
        unit_id: unitId,
        name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        size_bytes: file.size,
        tenant_id: profile.tenant_id,
        uploaded_by: user.id
    })

    if (dbError) return { error: 'Veritabanı kaydı başarısız.' }

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}

export async function deleteUnitDocument(documentId: string, unitId: string) {
    const supabase = await createClient()

    // 1. Get file path
    const { data: doc } = await supabase.from('unit_documents').select('file_url').eq('id', documentId).single()

    if (doc?.file_url) {
        const path = doc.file_url.split('/unit-documents/')[1]
        if (path) {
            await supabase.storage.from('unit-documents').remove([path])
        }
    }

    // 2. Delete record
    const { error } = await supabase.from('unit_documents').delete().eq('id', documentId)

    if (error) return { error: 'Silinemedi.' }

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}


// --- Unit Notes ---
export async function getUnitNotes(unitId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('unit_notes')
        .select('*, profiles:created_by(full_name)')
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })

    return data || []
}

export async function addUnitNote(unitId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()

    const { error } = await supabase.from('unit_notes').insert({
        unit_id: unitId,
        content,
        tenant_id: profile?.tenant_id,
        created_by: user.id
    })

    if (error) return { error: 'Not eklenemedi.' }

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}

export async function deleteUnitNote(noteId: string, unitId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('unit_notes').delete().eq('id', noteId)

    if (error) return { error: 'Silinemedi.' }

    revalidatePath(`/inventory/${unitId}`)
    return { success: true }
}
