'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Helper function to log contract activities
async function logContractActivity(
    supabase: any,
    contractId: string,
    activityType: string,
    description: string,
    metadata?: any
) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user?.id)
        .single()

    if (!profile?.tenant_id || !user) return

    await supabase.from('contract_activities').insert({
        tenant_id: profile.tenant_id,
        contract_id: contractId,
        activity_type: activityType,
        description: description,
        metadata: metadata,
        performed_by: user.id
    })
}

export async function uploadContractDocument(formData: FormData) {
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

    const contractId = formData.get('contract_id') as string
    const file = formData.get('file') as File
    const documentName = formData.get('document_name') as string
    const description = formData.get('description') as string

    if (!file || !documentName) {
        return { error: 'Dosya ve döküman adı gereklidir' }
    }

    try {
        // Upload file to storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
        const filePath = `contract-documents/${contractId}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('crm-images')
            .upload(filePath, file)

        if (uploadError) {
            console.error('Upload Error:', uploadError)
            return { error: 'Dosya yüklenemedi' }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('crm-images')
            .getPublicUrl(filePath)

        // Save metadata to database
        const { error: dbError } = await supabase
            .from('contract_documents')
            .insert({
                tenant_id: profile.tenant_id,
                contract_id: contractId,
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
            return { error: 'Döküman kaydedilemedi' }
        }

        // Log activity
        await logContractActivity(
            supabase,
            contractId,
            'document_uploaded',
            `"${documentName}" dökümanı yüklendi`,
            { file_name: file.name, file_size: file.size, file_type: file.type }
        )

        revalidatePath(`/contracts/${contractId}`)
        return { success: true }
    } catch (error) {
        console.error('Upload Document Error:', error)
        return { error: 'Bir hata oluştu' }
    }
}

export async function deleteContractDocument(documentId: string, contractId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get document info
    const { data: document } = await supabase
        .from('contract_documents')
        .select('file_url')
        .eq('id', documentId)
        .single()

    if (!document) return { error: 'Döküman bulunamadı' }

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
        .from('contract_documents')
        .delete()
        .eq('id', documentId)

    if (error) {
        console.error('Delete Error:', error)
        return { error: 'Döküman silinemedi' }
    }

    // Log activity
    await logContractActivity(
        supabase,
        contractId,
        'document_deleted',
        `Döküman silindi`,
        { document_id: documentId }
    )

    revalidatePath(`/contracts/${contractId}`)
    return { success: true }
}
