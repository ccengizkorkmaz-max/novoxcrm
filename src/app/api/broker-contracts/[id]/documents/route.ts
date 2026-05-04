import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await request.formData()
        const file = formData.get('file') as File
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

        // Upload to Supabase Storage
        const buffer = Buffer.from(await file.arrayBuffer())
        const storagePath = `contracts/${id}/${Date.now()}_${file.name}`

        // Try contract-documents bucket, fallback to portfolio-images
        let publicUrl = ''
        const { error: uploadError } = await supabase.storage
            .from('contract-documents')
            .upload(storagePath, buffer, { contentType: file.type, upsert: false })

        if (uploadError) {
            // Fallback to existing bucket
            const { error: retryError } = await supabase.storage
                .from('portfolio-images')
                .upload(storagePath, buffer, { contentType: file.type, upsert: false })
            if (retryError) throw retryError
            const { data: urlData } = supabase.storage.from('portfolio-images').getPublicUrl(storagePath)
            publicUrl = urlData.publicUrl
        } else {
            const { data: urlData } = supabase.storage.from('contract-documents').getPublicUrl(storagePath)
            publicUrl = urlData.publicUrl
        }

        // Save document record
        const { data: doc, error: insertError } = await supabase
            .from('contract_documents')
            .insert({
                contract_id: id,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                url: publicUrl,
                storage_path: storagePath,
                uploaded_by: user.id,
            })
            .select()
            .single()

        if (insertError) throw insertError
        return NextResponse.json(doc)
    } catch (err: any) {
        console.error('Document upload error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
