import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

    const { data, error } = await supabase
        .from('unit_field_options')
        .select('*')
        .eq('tenant_id', profile.tenant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ fields: data || [] })
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
    if (!profile?.tenant_id) return NextResponse.json({ error: 'No tenant' }, { status: 400 })

    const isAdmin = profile.role === 'admin' || profile.role === 'owner'
    if (!isAdmin) return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 })

    const body = await request.json()
    const { fields } = body

    if (!fields || !Array.isArray(fields)) {
        return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Upsert each field
    for (const field of fields) {
        const { error } = await supabase
            .from('unit_field_options')
            .upsert({
                tenant_id: profile.tenant_id,
                field_name: field.field_name,
                field_label: field.field_label,
                options: field.options,
                updated_at: new Date().toISOString()
            }, { onConflict: 'tenant_id,field_name' })

        if (error) {
            console.error('Upsert field option error:', error)
            return NextResponse.json({ error: `${field.field_label} kaydedilemedi: ${error.message}` }, { status: 500 })
        }
    }

    return NextResponse.json({ success: true })
}
