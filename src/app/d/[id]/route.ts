import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decodeUuid } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const rawId = params.id;
    if (!rawId) {
        return new NextResponse('Invalid ID', { status: 400 });
    }

    const decodedId = decodeUuid(rawId);
    if (!decodedId) {
        return new NextResponse('Invalid ID Format', { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Check document_library
    const { data: libDoc } = await supabase
        .from('document_library')
        .select('file_url')
        .eq('id', decodedId)
        .maybeSingle();

    if (libDoc?.file_url) {
        return NextResponse.redirect(libDoc.file_url, 307);
    }

    // 2. Check project_documents
    const { data: projDoc } = await supabase
        .from('project_documents')
        .select('file_url')
        .eq('id', decodedId)
        .maybeSingle();

    if (projDoc?.file_url) {
        return NextResponse.redirect(projDoc.file_url, 307);
    }

    return new NextResponse('Document not found', { status: 404 });
}
