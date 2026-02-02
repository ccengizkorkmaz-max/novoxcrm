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
