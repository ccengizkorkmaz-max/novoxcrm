import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const templateName = (formData.get('templateName') as string) || 'campaign'

        if (!file) {
            return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'Sadece görsel dosyalar yüklenebilir' }, { status: 400 })
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'Dosya boyutu 5MB\'ı aşamaz' }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ error: 'Supabase yapılandırması eksik' }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Generate file path: kampanya/{template_name}_{timestamp}.{ext}
        const ext = file.name.split('.').pop() || 'jpg'
        const sanitizedName = templateName.replace(/[^a-zA-Z0-9_-]/g, '_')
        const fileName = `kampanya/${sanitizedName}_${Date.now()}.${ext}`

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { data, error } = await supabase.storage
            .from('crm-images')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json({ error: 'Görsel yüklenemedi: ' + error.message }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('crm-images')
            .getPublicUrl(fileName)

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            path: fileName,
        })
    } catch (error: any) {
        console.error('Upload header image error:', error)
        return NextResponse.json({ error: error.message || 'Sunucu hatası' }, { status: 500 })
    }
}
