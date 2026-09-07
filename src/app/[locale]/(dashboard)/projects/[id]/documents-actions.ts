'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadDocument(formData: FormData) {
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
    const documentName = formData.get('document_name') as string
    const description = formData.get('description') as string

    if (!file || !documentName) {
        return { error: 'File and document name are required' }
    }

    try {
        // Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `project-documents/${projectId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('crm-images')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Upload Error:', uploadError)
            return { error: 'Failed to upload file' }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('crm-images')
            .getPublicUrl(filePath)

        const isCustomerShareableRaw = formData.get('is_customer_shareable')
        const isCustomerShareable = isCustomerShareableRaw !== null 
            ? (isCustomerShareableRaw === 'on' || isCustomerShareableRaw === 'true' || isCustomerShareableRaw === '1')
            : true

        // Save metadata to database
        const { error: dbError } = await supabase
            .from('project_documents')
            .insert({
                tenant_id: profile.tenant_id,
                project_id: projectId,
                file_name: file.name,
                file_url: urlData.publicUrl,
                file_type: file.type,
                file_size: file.size,
                document_name: documentName,
                description: description,
                is_customer_shareable: isCustomerShareable,
                permissions: isCustomerShareable ? 'public' : 'internal',
                uploaded_by: user.id
            })

        if (dbError) {
            console.error('Database Error:', dbError)
            return { error: 'Failed to save document metadata' }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error('Upload Document Error:', error)
        return { error: 'An error occurred' }
    }
}

export async function deleteDocument(documentId: string, projectId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get document info
    const { data: document } = await supabase
        .from('project_documents')
        .select('file_url')
        .eq('id', documentId)
        .single()

    if (!document) return { error: 'Document not found' }

    // Extract file path from URL
    const urlParts = document.file_url.split('/crm-images/')
    if (urlParts.length > 1) {
        const filePath = urlParts[1]

        // Delete from storage
        await supabase.storage
            .from('crm-images')
            .remove([filePath])
    }

    // Delete from database
    const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId)

    if (error) {
        console.error('Delete Error:', error)
        return { error: 'Failed to delete document' }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function saveDocumentMetadata(metadata: {
    projectId: string
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    documentName: string
    description: string
    category?: string
    permissions?: string
    isCustomerShareable?: boolean
}) {
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

    const isShareable = metadata.isCustomerShareable !== undefined
        ? metadata.isCustomerShareable
        : (metadata.permissions !== 'internal')

    const { error: dbError } = await supabase
        .from('project_documents')
        .insert({
            tenant_id: profile.tenant_id,
            project_id: metadata.projectId,
            file_name: metadata.fileName,
            file_url: metadata.fileUrl,
            file_type: metadata.fileType,
            file_size: metadata.fileSize,
            document_name: metadata.documentName,
            description: metadata.description,
            category: metadata.category || 'brochure',
            permissions: isShareable ? (metadata.permissions || 'public') : 'internal',
            is_customer_shareable: isShareable,
            uploaded_by: user.id
        })

    if (dbError) {
        console.error('Database Error:', dbError)
        return { error: 'Failed to save document metadata' }
    }

    revalidatePath(`/projects/${metadata.projectId}`)
    return { success: true }
}

export async function toggleDocumentShareable(documentId: string, projectId: string, isShareable: boolean) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('project_documents')
        .update({
            is_customer_shareable: isShareable,
            permissions: isShareable ? 'public' : 'internal'
        })
        .eq('id', documentId)

    if (error) {
        console.error('toggleDocumentShareable error:', error)
        return { error: 'Doküman paylaşım durumu güncellenemedi' }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function updateDocument(documentId: string, projectId: string, data: {
    documentName: string
    description?: string
    category: string
    permissions?: string
    isCustomerShareable: boolean
    fileUrl?: string
    fileName?: string
    fileType?: string
    fileSize?: number
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const updatePayload: any = {
        document_name: data.documentName,
        description: data.description || '',
        category: data.category,
        permissions: data.isCustomerShareable ? (data.permissions || 'public') : 'internal',
        is_customer_shareable: data.isCustomerShareable,
    }

    if (data.fileUrl) {
        updatePayload.file_url = data.fileUrl
        if (data.fileName) updatePayload.file_name = data.fileName
        if (data.fileType) updatePayload.file_type = data.fileType
        if (data.fileSize) updatePayload.file_size = data.fileSize
    }

    const { error } = await supabase
        .from('project_documents')
        .update(updatePayload)
        .eq('id', documentId)

    if (error) {
        console.error('updateDocument error:', error)
        return { error: 'Doküman güncellenemedi' }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

// ========================
// Construction Site Photos
// ========================

export interface ConstructionMediaPayload {
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
    documentName: string
    description?: string
    folderName: string
    progressDate?: string | null
    progressPercentage?: number | null
}

export async function saveConstructionMediaBatch(projectId: string, items: ConstructionMediaPayload[]) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    if (!items || items.length === 0) {
        return { error: 'Kayıt edilecek medya bulunamadı.' }
    }

    const records = items.map(item => ({
        tenant_id: profile.tenant_id,
        project_id: projectId,
        file_name: item.fileName,
        file_url: item.fileUrl,
        file_type: item.fileType,
        file_size: item.fileSize,
        document_name: item.documentName || item.fileName,
        description: item.description || null,
        category: 'construction_photo',
        folder_name: (item.folderName || 'Genel İlerlemeler').trim(),
        progress_date: item.progressDate || new Date().toISOString().split('T')[0],
        progress_percentage: typeof item.progressPercentage === 'number' && !isNaN(item.progressPercentage)
            ? item.progressPercentage
            : null,
        permissions: 'internal',
        is_customer_shareable: false,
        uploaded_by: user.id
    }))

    const { data: inserted, error: dbError } = await supabase
        .from('project_documents')
        .insert(records)
        .select()

    if (dbError) {
        console.error('saveConstructionMediaBatch DB error:', dbError)
        return { error: 'Veritabanı kaydı sırasında hata oluştu: ' + dbError.message }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true, count: inserted?.length || records.length }
}

export async function uploadConstructionPhotos(projectId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }

    const rawFiles = formData.getAll('photos').concat(formData.getAll('files')) as File[]
    const files = rawFiles.filter(f => f && f.size > 0)
    const caption = (formData.get('caption') as string) || ''
    const folder_name = ((formData.get('folder_name') as string) || 'Genel İlerlemeler').trim()
    const progress_date = (formData.get('progress_date') as string) || null
    const progress_percentage_raw = formData.get('progress_percentage') as string
    const progress_percentage = progress_percentage_raw ? parseInt(progress_percentage_raw, 10) : null

    if (!files || files.length === 0) {
        return { error: 'En az bir dosya (fotoğraf, video veya belge) seçmelisiniz.' }
    }

    const results: { success: boolean; fileName?: string; error?: string }[] = []

    for (const file of files) {
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        const isDoc = file.type === 'application/pdf' || 
            file.type.includes('word') || 
            file.type.includes('sheet') || 
            file.type.includes('document') ||
            file.name.toLowerCase().endsWith('.pdf') ||
            file.name.toLowerCase().endsWith('.docx')

        if (!isImage && !isVideo && !isDoc) {
            results.push({ success: false, fileName: file.name, error: 'Sadece fotoğraf, video veya PDF/belge dosyaları yüklenebilir.' })
            continue
        }

        try {
            const fileExt = file.name.split('.').pop()
            const prefix = isVideo ? 'video' : isDoc ? 'doc' : 'img'
            const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
            const filePath = `construction-media/${projectId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('crm-images')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Construction media upload error:', uploadError)
                results.push({ success: false, fileName: file.name, error: 'Yükleme hatası' })
                continue
            }

            const { data: urlData } = supabase.storage
                .from('crm-images')
                .getPublicUrl(filePath)

            const defaultTitle = isVideo 
                ? `Şantiye Videosu - ${new Date().toLocaleDateString('tr-TR')}` 
                : isDoc 
                    ? file.name 
                    : `Şantiye Fotoğrafı - ${new Date().toLocaleDateString('tr-TR')}`

            const { error: dbError } = await supabase
                .from('project_documents')
                .insert({
                    tenant_id: profile.tenant_id,
                    project_id: projectId,
                    file_name: file.name,
                    file_url: urlData.publicUrl,
                    file_type: file.type || (isVideo ? 'video/mp4' : isDoc ? 'application/pdf' : 'image/jpeg'),
                    file_size: file.size,
                    document_name: caption || defaultTitle,
                    description: caption,
                    category: 'construction_photo',
                    folder_name: folder_name || 'Genel İlerlemeler',
                    progress_date: progress_date || new Date().toISOString().split('T')[0],
                    progress_percentage: Number.isInteger(progress_percentage) ? progress_percentage : null,
                    permissions: 'internal',
                    is_customer_shareable: false,
                    uploaded_by: user.id
                })

            if (dbError) {
                console.error('Construction media DB error:', dbError)
                results.push({ success: false, fileName: file.name, error: 'Kayıt hatası' })
                continue
            }

            results.push({ success: true, fileName: file.name })
        } catch (err) {
            console.error('Construction media error:', err)
            results.push({ success: false, fileName: file.name, error: 'Beklenmeyen hata' })
        }
    }

    revalidatePath(`/projects/${projectId}`)
    const successCount = results.filter(r => r.success).length
    return { success: successCount > 0, uploaded: successCount, total: files.length, results }
}

export async function deleteConstructionPhoto(photoId: string, projectId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get document info
    const { data: document } = await supabase
        .from('project_documents')
        .select('file_url')
        .eq('id', photoId)
        .in('category', ['construction_photo', 'construction_media'])
        .single()

    if (!document) return { error: 'Media not found' }

    // Delete from storage
    const urlParts = document.file_url.split('/crm-images/')
    if (urlParts.length > 1) {
        const filePath = urlParts[1]
        await supabase.storage
            .from('crm-images')
            .remove([filePath])
    }

    // Delete from database
    const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', photoId)

    if (error) {
        console.error('Delete construction media error:', error)
        return { error: 'Silme başarısız' }
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}

export async function deleteConstructionFolder(projectId: string, folderName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: docs } = await supabase
        .from('project_documents')
        .select('id, file_url')
        .eq('project_id', projectId)
        .eq('folder_name', folderName)
        .in('category', ['construction_photo', 'construction_media'])

    if (docs && docs.length > 0) {
        const filePaths = docs.map(d => {
            const parts = d.file_url.split('/crm-images/')
            return parts.length > 1 ? parts[1] : null
        }).filter(Boolean) as string[]

        if (filePaths.length > 0) {
            await supabase.storage.from('crm-images').remove(filePaths)
        }

        await supabase
            .from('project_documents')
            .delete()
            .eq('project_id', projectId)
            .eq('folder_name', folderName)
            .in('category', ['construction_photo', 'construction_media'])
    }

    revalidatePath(`/projects/${projectId}`)
    return { success: true }
}
