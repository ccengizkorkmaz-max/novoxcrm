import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; docId: string }> }) {
    try {
        const { docId } = await params
        const supabase = await createClient()
        
        // Get doc to find storage path
        const { data: doc } = await supabase
            .from('contract_documents')
            .select('storage_path')
            .eq('id', docId)
            .single()

        // Delete from storage
        if (doc?.storage_path) {
            await supabase.storage.from('contract-documents').remove([doc.storage_path])
        }

        // Delete record
        const { error } = await supabase
            .from('contract_documents')
            .delete()
            .eq('id', docId)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
