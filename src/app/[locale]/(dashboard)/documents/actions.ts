'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const DOCUMENT_CATEGORIES = [
    'authorization', 'title_deed', 'identity', 'contract', 'appraisal',
    'zoning', 'floor_plan', 'energy_cert', 'insurance', 'invoice',
    'receipt', 'photo', 'other'
] as const

export async function uploadDocument(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    const entityType = formData.get('entity_type') as string
    const entityId = formData.get('entity_id') as string
    const category = formData.get('category') as string || 'other'
    const description = (formData.get('description') as string)?.trim() || null
    const expiryDate = (formData.get('expiry_date') as string)?.trim() || null
    const fileBase64 = formData.get('file_base64') as string
    const fileName = formData.get('file_name') as string
    const fileType = formData.get('file_type') as string
    const fileSize = Number(formData.get('file_size') || 0)

    if (!entityType || !entityId || !fileBase64 || !fileName) {
        throw new Error('Eksik bilgi')
    }

    // Upload to storage
    const base64Data = fileBase64.split(',')[1] || fileBase64
    const buffer = Buffer.from(base64Data, 'base64')
    const ext = fileName.split('.').pop() || 'pdf'
    const storagePath = `documents/${profile?.tenant_id}/${entityType}/${entityId}/${Date.now()}_${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
            contentType: fileType || 'application/octet-stream',
            upsert: false,
        })

    if (uploadError) {
        console.error('Document upload error:', uploadError)
        // Try with admin client
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = createAdminClient()
        const { error: adminUploadError } = await adminSupabase.storage
            .from('documents')
            .upload(storagePath, buffer, {
                contentType: fileType || 'application/octet-stream',
                upsert: false,
            })
        if (adminUploadError) throw new Error('Dosya yüklenemedi: ' + adminUploadError.message)
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(storagePath)

    // Insert record
    const { error: insertError } = await supabase.from('documents').insert({
        tenant_id: profile?.tenant_id,
        entity_type: entityType,
        entity_id: entityId,
        file_name: fileName,
        file_url: urlData.publicUrl,
        file_size: fileSize,
        file_type: fileType,
        category,
        description,
        expiry_date: expiryDate || null,
        uploaded_by: user.id,
    })

    if (insertError) {
        console.error('Document insert error:', insertError)
        throw new Error('Doküman kaydedilemedi: ' + insertError.message)
    }

    revalidatePath(`/portfolios/${entityId}`)
    revalidatePath(`/customers`)
    return { success: true }
}

export async function getDocuments(entityType: string, entityId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('documents')
        .select('*, profiles!uploaded_by(full_name), verifier:profiles!verified_by(full_name)')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Get documents error:', error)
        return []
    }
    return data || []
}

export async function deleteDocument(documentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isManager = ['manager', 'admin', 'owner', 'crm_manager'].includes(profile?.role || '')

    // Get document to check ownership
    const { data: doc } = await supabase.from('documents').select('uploaded_by, file_url').eq('id', documentId).single()
    if (!doc) throw new Error('Doküman bulunamadı')

    if (doc.uploaded_by !== user.id && !isManager) {
        throw new Error('Bu dokümanı silme yetkiniz yok')
    }

    // Delete from storage
    try {
        const url = new URL(doc.file_url)
        const storagePath = url.pathname.split('/storage/v1/object/public/documents/')[1]
        if (storagePath) {
            await supabase.storage.from('documents').remove([storagePath])
        }
    } catch { /* ignore storage delete errors */ }

    const { error } = await supabase.from('documents').delete().eq('id', documentId)
    if (error) throw new Error('Silinemedi: ' + error.message)

    return { success: true }
}

export async function verifyDocument(documentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { error } = await supabase.from('documents').update({
        is_verified: true,
        verified_by: user.id,
        verified_at: new Date().toISOString(),
    }).eq('id', documentId)

    if (error) throw new Error('Onaylanamadı')
    return { success: true }
}
