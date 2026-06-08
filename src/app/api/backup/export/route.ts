import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Yedeklenecek tablolar — FK bağımlılık sırasına göre
 * tenant_filtered: true → tenant_id filtresine tabi
 * filter_column: 'id' → tenants tablosu gibi, id ile filtrelenir
 */
type BackupTable = { name: string; tenant_filtered: boolean; filter_column?: string }
const BACKUP_TABLES: BackupTable[] = [
    { name: 'tenants', tenant_filtered: false, filter_column: 'id' },
    { name: 'profiles', tenant_filtered: true },
    { name: 'customers', tenant_filtered: true },
    { name: 'projects', tenant_filtered: true },
    { name: 'units', tenant_filtered: true },
    { name: 'sales', tenant_filtered: true },
    { name: 'activities', tenant_filtered: true },
    { name: 'contracts', tenant_filtered: true },
    { name: 'payments', tenant_filtered: true },
    { name: 'offers', tenant_filtered: true },
    { name: 'offer_negotiations', tenant_filtered: true },
    { name: 'payment_items', tenant_filtered: true },
    { name: 'inbound_calls', tenant_filtered: true },
    { name: 'lead_qualifications', tenant_filtered: true },
    { name: 'commission_rules', tenant_filtered: true },
    { name: 'sales_commissions', tenant_filtered: true },
    { name: 'notification_settings', tenant_filtered: true },
    { name: 'tenant_email_accounts', tenant_filtered: true },
    { name: 'unit_types', tenant_filtered: true },
    { name: 'unit_field_options', tenant_filtered: true },
    { name: 'payment_plan_templates', tenant_filtered: false },
    { name: 'conversations', tenant_filtered: true },
    { name: 'messages', tenant_filtered: true },
    { name: 'contract_activities', tenant_filtered: true },
    { name: 'contract_documents', tenant_filtered: true },
    { name: 'contract_relationships', tenant_filtered: false },
    { name: 'finance_supplier_payments', tenant_filtered: true },
    { name: 'deposits', tenant_filtered: true },
    { name: 'deposit_refunds', tenant_filtered: true },
    { name: 'inventory_items', tenant_filtered: true },
    { name: 'inventory_movements', tenant_filtered: true },
    { name: 'hr_employees', tenant_filtered: true },
    { name: 'broker_profiles', tenant_filtered: true },
    { name: 'broker_leads', tenant_filtered: true },
    { name: 'broker_applications', tenant_filtered: true },
    { name: 'broker_documents', tenant_filtered: true },
    { name: 'broker_project_access', tenant_filtered: true },
    { name: 'broker_commission_earnings', tenant_filtered: true },
    { name: 'broker_commission_payouts', tenant_filtered: true },
    { name: 'outreach_campaigns', tenant_filtered: true },
    { name: 'outreach_segments', tenant_filtered: true },
    { name: 'outreach_executions', tenant_filtered: true },
    { name: 'outreach_scripts', tenant_filtered: true },
    { name: 'system_logs', tenant_filtered: true },
    { name: 'notifications', tenant_filtered: true },
    { name: 'inbox_items', tenant_filtered: true },
    { name: 'public_links', tenant_filtered: true },
    { name: 'shared_reports', tenant_filtered: true },
    { name: 'backup_history', tenant_filtered: true },
]

// SaaS admin email whitelist — sadece bu hesaplar toplu yedek alabilir
const SUPER_ADMIN_EMAILS = [
    'ccengizkorkmaz@gmail.com',
    'cengiz@monix.media',
    'cengiz.korkmaz@monix.media',
]

/**
 * Paginated fetch — Supabase max 1000 satır döndürür
 */
async function fetchAllRows(
    adminSupabase: any,
    tableName: string,
    tenantId: string | null,
    table: BackupTable,
): Promise<{ rows: any[]; error?: string }> {
    let allRows: any[] = []
    let page = 0
    const pageSize = 1000

    while (true) {
        let query = adminSupabase.from(tableName).select('*')

        // Tenant filtresi uygula
        if (tenantId) {
            if (table.tenant_filtered) {
                query = query.eq('tenant_id', tenantId)
            } else if (table.filter_column === 'id') {
                query = query.eq('id', tenantId)
            }
            // filter_column yoksa ve tenant_filtered değilse → filtre yok (tüm veri)
        }
        // tenantId null ise (toplu yedek) → hiç filtre yok, tüm verileri çek

        const from = page * pageSize
        const to = from + pageSize - 1
        const { data, error } = await query.range(from, to)

        if (error) {
            if (error.code === '42P01' || error.code === 'PGRST205') {
                return { rows: [] } // Tablo yok, atla
            }
            return { rows: allRows, error: error.message }
        }

        if (data && data.length > 0) {
            allRows = allRows.concat(data)
            if (data.length < pageSize) break
            page++
        } else {
            break
        }
    }

    return { rows: allRows }
}

/**
 * POST /api/backup/export
 * 
 * Body params:
 *   mode: 'all' | 'tenant' (varsayılan: 'tenant')
 *   tenant_id?: string (belirli bir tenant için — SaaS admin kullanır)
 * 
 * mode='all'    → Tüm platform verisi (SaaS admin only)
 * mode='tenant' → Tek tenant verisi
 *   - tenant_id verilmişse o tenant'ı yedekler (SaaS admin)
 *   - tenant_id verilmemişse kullanıcının kendi tenant'ını yedekler
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

        // 2. Rol kontrolü
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, role, full_name, email')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profil bulunamadı' }, { status: 403 })
        }

        // 3. Request body parse
        let body: any = {}
        try {
            body = await req.json()
        } catch {
            // Body boş olabilir — varsayılan değerler kullanılacak
        }

        const mode = body.mode || 'tenant' // 'all' | 'tenant'
        const requestedTenantId = body.tenant_id || null
        const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user.email || '')

        // 4. Yetki kontrolü
        let targetTenantId: string | null = null
        let backupScope: string = 'tenant'
        let tenantName: string = ''

        if (mode === 'all') {
            // Toplu yedek — sadece super admin
            if (!isSuperAdmin) {
                return NextResponse.json({ error: 'Toplu yedek alma yetkisi sadece platform yöneticilerine aittir.' }, { status: 403 })
            }
            targetTenantId = null // filtre yok → tüm veri
            backupScope = 'all'
            tenantName = 'Tüm Platform'
        } else if (requestedTenantId) {
            // Belirli bir tenant'ın yedeği — super admin gerekli
            if (!isSuperAdmin) {
                return NextResponse.json({ error: 'Başka firmanın yedeğini alma yetkiniz yok.' }, { status: 403 })
            }
            targetTenantId = requestedTenantId
            backupScope = 'tenant'

            // Tenant adını al
            const adminSupabase = createAdminClient()
            const { data: tenantData } = await adminSupabase
                .from('tenants')
                .select('name')
                .eq('id', requestedTenantId)
                .single()
            tenantName = tenantData?.name || requestedTenantId
        } else {
            // Kullanıcının kendi tenant'ı
            if (!profile.tenant_id) {
                return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 403 })
            }
            if (profile.role !== 'owner' && profile.role !== 'admin') {
                return NextResponse.json({ error: 'Yedek alma yetkisi sadece yöneticilere aittir.' }, { status: 403 })
            }
            targetTenantId = profile.tenant_id
            backupScope = 'tenant'
        }

        const adminSupabase = createAdminClient()

        // 5. Backup history kaydı oluştur
        const historyTenantId = targetTenantId || profile.tenant_id
        let backupId: string | null = null
        if (historyTenantId) {
            const { data: backupRecord } = await adminSupabase
                .from('backup_history')
                .insert({
                    tenant_id: historyTenantId,
                    created_by: user.id,
                    backup_type: 'manual',
                    status: 'in_progress',
                    started_at: new Date().toISOString(),
                })
                .select('id')
                .single()
            backupId = backupRecord?.id || null
        }

        // 6. Tüm tabloları sorgula
        const tablesData: Record<string, any[]> = {}
        const tableStats: Record<string, number> = {}
        let totalRecords = 0
        let tableCount = 0
        const errors: string[] = []

        for (const table of BACKUP_TABLES) {
            try {
                const { rows, error } = await fetchAllRows(adminSupabase, table.name, targetTenantId, table)
                if (error) {
                    errors.push(`${table.name}: ${error}`)
                }
                if (rows.length > 0) {
                    tablesData[table.name] = rows
                    tableStats[table.name] = rows.length
                    totalRecords += rows.length
                    tableCount++
                }
            } catch (err: any) {
                errors.push(`${table.name}: ${err.message}`)
            }
        }

        // 7. Yedek dosyasını oluştur
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)
        const scopeLabel = backupScope === 'all' ? 'full_platform' : (tenantName || 'tenant').replace(/\s+/g, '_').toLowerCase()
        const fileName = `novocrm_backup_${scopeLabel}_${timestamp}.json`

        const backupPayload = {
            _meta: {
                version: '1.0',
                app: 'NovoCRM',
                backup_scope: backupScope,
                created_at: new Date().toISOString(),
                created_by: profile.full_name || user.email,
                tenant_id: targetTenantId,
                tenant_name: tenantName || undefined,
                table_count: tableCount,
                total_records: totalRecords,
                tables: tableStats,
                errors: errors.length > 0 ? errors : undefined,
            },
            data: tablesData,
        }

        const jsonString = JSON.stringify(backupPayload, null, 2)
        const fileSizeBytes = new Blob([jsonString]).size

        // 8. Backup history güncelle
        if (backupId) {
            await adminSupabase
                .from('backup_history')
                .update({
                    status: 'completed',
                    file_name: fileName,
                    file_size_bytes: fileSizeBytes,
                    tables_included: tableStats,
                    table_count: tableCount,
                    record_count: totalRecords,
                    completed_at: new Date().toISOString(),
                    error_message: errors.length > 0 ? errors.join('; ') : null,
                })
                .eq('id', backupId)
        }

        // 9. JSON dosyasını döndür
        return new NextResponse(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'X-Backup-Id': backupId || '',
                'X-Backup-Scope': backupScope,
                'X-Table-Count': String(tableCount),
                'X-Record-Count': String(totalRecords),
                'X-Duration-Ms': String(Date.now() - startTime),
            },
        })

    } catch (error: any) {
        console.error('[Backup Export] Fatal error:', error)
        return NextResponse.json({
            error: 'Yedekleme sırasında bir hata oluştu: ' + error.message,
        }, { status: 500 })
    }
}
