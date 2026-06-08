import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Geri yükleme sırası — FK bağımlılıklarına göre (parent → child)
 * Önce bağımsız tablolar, sonra bağımlı olanlar
 */
const RESTORE_ORDER = [
    'tenants',
    'profiles',
    'customers',
    'projects',
    'units',
    'unit_types',
    'unit_field_options',
    'payment_plan_templates',
    'sales',
    'activities',
    'contracts',
    'payments',
    'payment_items',
    'offers',
    'offer_negotiations',
    'inbound_calls',
    'lead_qualifications',
    'commission_rules',
    'sales_commissions',
    'notification_settings',
    'tenant_email_accounts',
    'conversations',
    'messages',
    'contract_activities',
    'contract_documents',
    'contract_relationships',
    'finance_supplier_payments',
    'deposits',
    'deposit_refunds',
    'inventory_items',
    'inventory_movements',
    'hr_employees',
    'broker_profiles',
    'broker_leads',
    'broker_applications',
    'broker_documents',
    'broker_project_access',
    'broker_commission_earnings',
    'broker_commission_payouts',
    'outreach_campaigns',
    'outreach_segments',
    'outreach_executions',
    'outreach_scripts',
    'system_logs',
    'notifications',
    'inbox_items',
    'public_links',
    'shared_reports',
]

/**
 * POST /api/backup/restore
 * JSON yedek dosyasından geri yükleme yapar
 */
export async function POST(req: NextRequest) {
    const startTime = Date.now()

    try {
        // 1. Auth kontrolü
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })
        }

        // 2. Rol kontrolü — sadece owner
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role, full_name')
            .eq('id', user.id)
            .single()

        if (!profile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 })
        }

        if (profile.role !== 'owner') {
            return NextResponse.json({ error: 'Geri yükleme sadece şirket sahibi (owner) tarafından yapılabilir.' }, { status: 403 })
        }

        const tenantId = profile.tenant_id
        const adminSupabase = createAdminClient()

        // 3. Yedek dosyasını parse et
        const body = await req.json()

        if (!body._meta || !body.data) {
            return NextResponse.json({ error: 'Geçersiz yedek dosyası formatı. _meta ve data alanları gerekli.' }, { status: 400 })
        }

        if (body._meta.version !== '1.0') {
            return NextResponse.json({ error: `Desteklenmeyen yedek versiyonu: ${body._meta.version}` }, { status: 400 })
        }

        // Tenant kontrolü — yedek başka tenant'a ait olmamalı
        if (body._meta.tenant_id && body._meta.tenant_id !== tenantId) {
            return NextResponse.json({
                error: 'Bu yedek farklı bir şirkete ait. Güvenlik nedeniyle başka şirketin yedeğini geri yükleyemezsiniz.',
            }, { status: 403 })
        }

        // 4. Restore history kaydı oluştur
        const { data: restoreRecord } = await adminSupabase
            .from('backup_history')
            .insert({
                tenant_id: tenantId,
                created_by: user.id,
                backup_type: 'restore',
                status: 'in_progress',
                started_at: new Date().toISOString(),
                file_name: `restore_from_${body._meta.created_at || 'unknown'}`,
            })
            .select('id')
            .single()

        const restoreId = restoreRecord?.id

        // 5. Tabloları sırayla geri yükle
        const results: Record<string, { status: string; count: number; error?: string }> = {}
        let totalRestored = 0
        let tableCount = 0
        const errors: string[] = []

        for (const tableName of RESTORE_ORDER) {
            const tableData = body.data[tableName]
            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
                continue
            }

            try {
                // Upsert — mevcut kayıtları güncelle, yenilerini ekle
                // Batch halinde upsert (500'er kayıt)
                const batchSize = 500
                let totalUpserted = 0

                for (let i = 0; i < tableData.length; i += batchSize) {
                    const batch = tableData.slice(i, i + batchSize)

                    // tenant_id'yi zorla (güvenlik)
                    const safeBatch = batch.map((row: any) => {
                        const safeRow = { ...row }
                        if ('tenant_id' in safeRow) {
                            safeRow.tenant_id = tenantId
                        }
                        // Temizle: undefined değerleri kaldır
                        Object.keys(safeRow).forEach(key => {
                            if (safeRow[key] === undefined) {
                                delete safeRow[key]
                            }
                        })
                        return safeRow
                    })

                    const { error: upsertError } = await adminSupabase
                        .from(tableName)
                        .upsert(safeBatch, {
                            onConflict: 'id',
                            ignoreDuplicates: false,
                        })

                    if (upsertError) {
                        throw upsertError
                    }

                    totalUpserted += batch.length
                }

                results[tableName] = { status: 'success', count: totalUpserted }
                totalRestored += totalUpserted
                tableCount++
            } catch (err: any) {
                const errorMsg = `${tableName}: ${err.message}`
                errors.push(errorMsg)
                results[tableName] = { status: 'error', count: 0, error: err.message }
            }
        }

        // 6. Restore history güncelle
        if (restoreId) {
            await adminSupabase
                .from('backup_history')
                .update({
                    status: errors.length > 0 ? (tableCount > 0 ? 'completed' : 'failed') : 'completed',
                    tables_included: results,
                    table_count: tableCount,
                    record_count: totalRestored,
                    completed_at: new Date().toISOString(),
                    error_message: errors.length > 0 ? errors.join('; ') : null,
                })
                .eq('id', restoreId)
        }

        return NextResponse.json({
            success: true,
            summary: {
                tables_restored: tableCount,
                total_records: totalRestored,
                errors: errors.length,
                duration_ms: Date.now() - startTime,
            },
            details: results,
            errors: errors.length > 0 ? errors : undefined,
        })

    } catch (error: any) {
        console.error('[Backup Restore] Fatal error:', error)
        return NextResponse.json({
            error: 'Geri yükleme sırasında bir hata oluştu: ' + error.message,
        }, { status: 500 })
    }
}

/**
 * GET /api/backup/restore — Preview mode
 * Yedek dosyasının içeriğini analiz eder (geri yüklemeden)
 */
export async function GET() {
    return NextResponse.json({
        message: 'Geri yükleme için POST metodu kullanın.',
        format: {
            _meta: { version: '1.0', app: 'NovoCRM', tenant_id: 'UUID' },
            data: { table_name: ['...rows'] },
        },
    })
}
