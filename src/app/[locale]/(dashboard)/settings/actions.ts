'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateTenantProfile(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        console.error('updateTenantProfile: No tenant found for user', user.id)
        return { error: 'No tenant found' }
    }

    const updates = {
        name: formData.get('name') as string,
        logo_url: formData.get('logo_url') as string,
        country: formData.get('country') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update Tenant Error:', error)
        return { error: 'Failed to update tenant profile' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateFinancialSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yetkisiz işlem' }
    }

    const updates = {
        installment_start_rule: formData.get('installment_start_rule') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update Financial Settings Error:', error)
        return { error: 'Finansal ayarlar güncellenirken bir hata oluştu. (Sütun eksik olabilir, lütfen yöneticiye başvurun)' }
    }

    revalidatePath('/settings')
    return { success: true }
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function addUser(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) {
        console.error('addUser: No tenant found for user', user.id)
        return { error: 'No tenant found' }
    }

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string || 'user'
    const phone = formData.get('phone') as string

    if (!password || password.length < 6) {
        return { error: 'Şifre en az 6 karakter olmalıdır.' }
    }

    try {
        const adminClient = createAdminClient()

        // --- Limit Check ---
        // 1. Get Tenant Limit
        const { data: tenant, error: tenantErr } = await adminClient
            .from('tenants')
            .select('user_limit')
            .eq('id', profile.tenant_id)
            .single()

        if (tenantErr) throw tenantErr

        // 2. Count current users
        const { count, error: countErr } = await adminClient
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', profile.tenant_id)

        if (countErr) throw countErr

        if (count && count >= tenant.user_limit) {
            return { error: `Kullanıcı limitine ulaşıldı (${tenant.user_limit}). Yeni kullanıcı eklemek için paketinizi yükseltin.` }
        }
        // --- End Limit Check ---

        const { data, error } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role,
                tenant_id: profile.tenant_id,
                is_external: formData.get('is_external') === 'on'
            }
        })

        if (error) {
            console.error('Create User Error:', error)
            return { error: `Kullanıcı oluşturulamadı: ${error.message}` }
        }

        // Ensure is_external and phone are updated in profiles if the trigger didn't pick it up from metadata
        if (data.user) {
            await adminClient
                .from('profiles')
                .update({ 
                    is_external: formData.get('is_external') === 'on',
                    phone: phone || null 
                })
                .eq('id', data.user.id)
        }

        revalidatePath('/settings')
        return { success: true }
    } catch (e: any) {
        if (e.message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
            return { error: 'Sistem hatası: SUPABASE_SERVICE_ROLE_KEY tanımlanmamış. Lütfen yöneticiye başvurun.' }
        }
        return { error: 'Bir hata oluştu: ' + e.message }
    }
}

export async function createPaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .insert({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })

    if (error) {
        console.error('Create Template Error:', error)
        return { error: 'Failed to create template' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deletePaymentPlanTemplate(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('payment_plan_templates').delete().eq('id', id)
    if (error) {
        return { error: 'Failed to delete template' }
    }
    revalidatePath('/settings')
    return { success: true }
}

export async function updatePaymentPlanTemplate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const down_payment_rate = formData.get('down_payment_rate')
    const installment_count = formData.get('installment_count')
    const interims_json = formData.get('interims_json') as string

    // Parse interims if present
    let interim_payment_structure = []
    if (interims_json) {
        try {
            interim_payment_structure = JSON.parse(interims_json)
        } catch (e) {
            console.error('JSON Parse Error', e)
        }
    }

    const { error } = await supabase
        .from('payment_plan_templates')
        .update({
            name,
            down_payment_rate: Number(down_payment_rate),
            installment_count: Number(installment_count),
            interim_payment_structure,
        })
        .eq('id', id)

    if (error) {
        console.error('Update Template Error:', error)
        return { error: 'Failed to update template' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function getLeadCountForUser(userId: string) {
    const supabase = await createClient()
    const { count } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', userId)
    return count || 0
}

export async function deleteUser(userId: string, transferToUserId?: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check if user is owner/admin
    const { data: adminProfile } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', user.id)
        .single()

    if (!adminProfile || !['owner', 'admin'].includes(adminProfile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Protect self-deletion
    if (userId === user.id) {
        return { error: 'Kendi hesabınızı buradan silemezsiniz.' }
    }

    // Get target user info before deletion
    const { data: targetProfile } = await supabase
        .from('profiles')
        .select('full_name, email, role')
        .eq('id', userId)
        .single()

    let transferToName = ''
    if (transferToUserId) {
        const { data: transferProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', transferToUserId)
            .single()
        transferToName = transferProfile?.full_name || 'Bilinmiyor'
    }

    try {
        const adminClient = createAdminClient()

        // Transfer report tracker
        const report: { table: string; column: string; count: number; action: 'transfer' | 'delete' }[] = []

        // Helper: safely update a table column and track count
        const safeUpdate = async (table: string, column: string, newValue: string | null, label?: string) => {
            try {
                // Count first
                const { count } = await adminClient.from(table).select('*', { count: 'exact', head: true }).eq(column, userId)
                const affected = count || 0
                if (affected > 0) {
                    const { error } = await adminClient.from(table).update({ [column]: newValue }).eq(column, userId)
                    if (error) {
                        console.warn(`deleteUser: ${table}.${column} update warning:`, error.message)
                    } else {
                        report.push({ table: label || table, column, count: affected, action: 'transfer' })
                    }
                }
            } catch (e: any) {
                console.warn(`deleteUser: ${table}.${column} skipped:`, e.message)
            }
        }

        // Helper: safely delete rows from a table and track count
        const safeDelete = async (table: string, column: string) => {
            try {
                const { count } = await adminClient.from(table).select('*', { count: 'exact', head: true }).eq(column, userId)
                const affected = count || 0
                if (affected > 0) {
                    const { error } = await adminClient.from(table).delete().eq(column, userId)
                    if (error) {
                        console.warn(`deleteUser: ${table}.${column} delete warning:`, error.message)
                    } else {
                        report.push({ table, column, count: affected, action: 'delete' })
                    }
                }
            } catch (e: any) {
                console.warn(`deleteUser: ${table}.${column} delete skipped:`, e.message)
            }
        }

        const target = transferToUserId || null

        // 1. Core CRM tables
        await safeUpdate('sales', 'assigned_to', target, 'Lead\'ler')

        // Activities - all FK columns
        await safeUpdate('activities', 'owner_id', target, 'Aktiviteler (sahip)')
        await safeUpdate('activities', 'user_id', target, 'Aktiviteler (oluşturan)')
        await safeUpdate('activities', 'assigned_to', target, 'Aktiviteler (atanan)')
        await safeUpdate('activities', 'assigned_by_id', target, 'Aktiviteler (atayan)')

        // Contracts
        await safeUpdate('contracts', 'sales_rep_id', target, 'Sözleşmeler (temsilci)')
        await safeUpdate('contracts', 'created_by', target, 'Sözleşmeler (oluşturan)')

        // Offers & Negotiations
        await safeUpdate('offers', 'user_id', target, 'Teklifler')
        await safeUpdate('offer_negotiations', 'proposed_by', target, 'Müzakereler')

        // Customers
        await safeUpdate('customers', 'created_by', target, 'Müşteriler (oluşturan)')

        // 2. Contract sub-tables
        await safeUpdate('contract_activities', 'performed_by', target, 'Sözleşme aktiviteleri')
        await safeUpdate('contract_documents', 'uploaded_by', target, 'Sözleşme dokümanları')

        // 3. Broker module tables
        await safeUpdate('broker_leads', 'broker_id', target, 'Broker lead\'leri (broker)')
        await safeUpdate('broker_leads', 'assigned_to', target, 'Broker lead\'leri (atanan)')
        await safeUpdate('broker_lead_status_history', 'changed_by', target, 'Broker durum geçmişi')
        await safeUpdate('broker_applications', 'processed_by', target, 'Broker başvuruları')
        await safeUpdate('broker_documents', 'verified_by', target, 'Broker dokümanları (onaylayan)')
        await safeUpdate('broker_documents', 'uploaded_by', target, 'Broker dokümanları (yükleyen)')

        // 4. Finance & Commissions
        await safeUpdate('sales_commissions', 'user_id', target, 'Satış primleri')
        await safeUpdate('finance_supplier_payments', 'profile_id', target, 'Tedarikçi ödemeleri')
        await safeUpdate('finance_supplier_payments', 'created_by', target, 'Tedarikçi ödemeleri (oluşturan)')

        // 5. Inbox & Public links
        await safeUpdate('inbox_items', 'approved_by', target, 'Gelen kutusu')
        await safeUpdate('public_links', 'created_by', target, 'Herkese açık linkler')

        // 6. HR module
        await safeUpdate('hr_employees', 'profile_id', target, 'İK çalışanları')

        // 7. System logs
        await safeUpdate('system_logs', 'user_id', target, 'Sistem logları')

        // 8. Inventory
        await safeUpdate('inventory_movements', 'created_by', target, 'Envanter hareketleri')

        // 9. Broker finance tables (cascade, but be safe)
        await safeDelete('broker_commission_payouts', 'broker_id')
        await safeDelete('broker_commission_earnings', 'broker_id')
        await safeDelete('broker_project_access', 'broker_id')
        await safeDelete('broker_notifications', 'user_id')

        // 10. Remove from team memberships (Many-to-Many always delete)
        await safeDelete('team_members', 'profile_id')
        
        // 11. Handle notifications 
        await safeDelete('notifications', 'user_id')

        // 12. Deactivate profile and remove tenant relation
        await adminClient
            .from('profiles')
            .update({ is_active: false, tenant_id: null })
            .eq('id', userId)

        // 13. Delete profile row
        const { error: profileDeleteError } = await adminClient
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileDeleteError) {
            console.error('Profile delete error (non-fatal):', profileDeleteError.message)
        }

        // 14. Delete from Supabase Auth
        const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
        if (authError) throw authError

        // 15. Send email report to the admin who performed the deletion
        const deletedUserName = targetProfile?.full_name || targetProfile?.email || userId
        const adminEmail = adminProfile.email || user.email
        if (adminEmail && process.env.RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(process.env.RESEND_API_KEY)

                const transferredItems = report.filter(r => r.action === 'transfer')
                const deletedItems = report.filter(r => r.action === 'delete')

                const transferRows = transferredItems.length > 0
                    ? transferredItems.map(r => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${r.table}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;">${r.count}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">✅ ${transferToName ? `${transferToName}'a aktarıldı` : 'NULL yapıldı'}</td></tr>`).join('')
                    : '<tr><td colspan="3" style="padding:8px 12px;color:#888;">Aktarılacak kayıt bulunamadı</td></tr>'

                const deleteRows = deletedItems.length > 0
                    ? deletedItems.map(r => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;">${r.table}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;">${r.count}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">🗑️ Silindi</td></tr>`).join('')
                    : ''

                const totalTransferred = transferredItems.reduce((sum, r) => sum + r.count, 0)
                const totalDeleted = deletedItems.reduce((sum, r) => sum + r.count, 0)

                await resend.emails.send({
                    from: 'NovoCRM <no-reply@novoxcrm.com>',
                    to: adminEmail,
                    subject: `✅ Kullanıcı Silindi: ${deletedUserName}`,
                    html: `
                        <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;">
                            <div style="background:linear-gradient(135deg,#1e293b,#0f172a);color:white;padding:24px;border-radius:12px 12px 0 0;">
                                <h2 style="margin:0;font-size:18px;">🗂️ Kullanıcı Silme Raporu</h2>
                                <p style="margin:8px 0 0;opacity:0.8;font-size:13px;">${new Date().toLocaleString('tr-TR')}</p>
                            </div>
                            <div style="background:white;border:1px solid #e2e8f0;border-top:0;padding:24px;border-radius:0 0 12px 12px;">
                                <div style="background:#fef3c7;border:1px solid #fde68a;padding:12px 16px;border-radius:8px;margin-bottom:16px;">
                                    <strong style="color:#92400e;">Silinen Kullanıcı:</strong> ${deletedUserName} (${targetProfile?.role || ''})
                                    ${transferToName ? `<br/><strong style="color:#92400e;">Kayıtlar aktarıldı:</strong> ${transferToName}` : ''}
                                    <br/><strong style="color:#92400e;">İşlemi yapan:</strong> ${adminProfile.full_name || adminEmail}
                                </div>
                                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                                    <thead><tr style="background:#f8fafc;">
                                        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">Kayıt Türü</th>
                                        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0;">Sayı</th>
                                        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0;">İşlem</th>
                                    </tr></thead>
                                    <tbody>${transferRows}${deleteRows}</tbody>
                                    <tfoot><tr style="background:#f0fdf4;">
                                        <td style="padding:8px 12px;font-weight:bold;">Toplam</td>
                                        <td style="padding:8px 12px;text-align:center;font-weight:bold;">${totalTransferred + totalDeleted}</td>
                                        <td style="padding:8px 12px;font-size:12px;">${totalTransferred} aktarıldı, ${totalDeleted} silindi</td>
                                    </tr></tfoot>
                                </table>
                            </div>
                        </div>
                    `,
                })
            } catch (emailErr: any) {
                console.error('Delete user email report error:', emailErr.message)
            }
        }

        revalidatePath('/settings')
        revalidatePath('/crm')
        return { success: true, report }
    } catch (e: any) {
        console.error('deleteUser fatal error:', e)
        return { error: 'Silme işlemi başarısız: ' + e.message }
    }
}

export async function updateUser(userId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const full_name = formData.get('name') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string
    const is_external = formData.get('is_external') === 'on'
    const phone = formData.get('phone') as string

    // 1. Update Profile
    const { error } = await supabase
        .from('profiles')
        .update({ full_name, role, is_external, phone: phone || null })
        .eq('id', userId)

    if (error) {
        return { error: 'Profil güncellenemedi: ' + error.message }
    }

    // 2. Update Password if provided
    if (password && password.length >= 6) {
        try {
            const adminClient = createAdminClient()
            const { error: passError } = await adminClient.auth.admin.updateUserById(userId, {
                password: password
            })

            if (passError) throw passError
        } catch (e: any) {
            console.error('Password Update Error:', e)
            // We don't fail the whole request if profile update worked, but ideally should warn
            return { error: 'Profil güncellendi ancak şifre değiştirilemedi: ' + e.message }
        }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateUserRole(userId: string, newRole: string) {
    const supabase = await createClient()

    // Check permission (Owner only)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (currentUserProfile?.role !== 'owner' && currentUserProfile?.role !== 'admin') {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Prevent changing own role (safety mechanism)
    if (userId === user.id) {
        return { error: 'Kendi rolünüzü değiştiremezsiniz.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

    if (error) {
        return { error: 'Rol güncellenemedi: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

// --- Unit Types Actions ---

export async function getUnitTypes() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('unit_types')
        .select('*')
        .order('order_index', { ascending: true })

    return data || []
}

export async function createUnitType(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const order_index = Number(formData.get('order_index')) || 0

    if (!name) return { error: 'İsim zorunludur' }

    const { error } = await supabase.from('unit_types').insert({
        name,
        description,
        order_index,
        tenant_id: (await getTenantId(supabase, user.id))
    })

    if (error) return { error: 'Oluşturulamadı: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateUnitType(formData: FormData) {
    const supabase = await createClient()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const order_index = Number(formData.get('order_index')) || 0
    const is_active = formData.get('is_active') === 'true'

    const { error } = await supabase.from('unit_types').update({
        name,
        description,
        order_index,
        is_active
    }).eq('id', id)

    if (error) return { error: 'Güncellenemedi: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteUnitType(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('unit_types').delete().eq('id', id)

    if (error) return { error: 'Silinemedi: ' + error.message }

    revalidatePath('/settings')
    return { success: true }
}

async function getTenantId(supabase: any, userId: string) {
    const { data } = await supabase.from('profiles').select('tenant_id').eq('id', userId).single()
    return data?.tenant_id
}

export async function initializeUnitTypes() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const defaultTypes = [
        { name: 'Stüdyo (1+0)', order_index: 10 },
        { name: '1+1', order_index: 20 },
        { name: '1.5+1', order_index: 30 },
        { name: '2+0', order_index: 40 },
        { name: '2+1', order_index: 50 },
        { name: '2.5+1', order_index: 60 },
        { name: '2+2', order_index: 70 },
        { name: '3+0', order_index: 80 },
        { name: '3+1', order_index: 90 },
        { name: '3.5+1', order_index: 100 },
        { name: '3+2', order_index: 110 },
        { name: '3+3', order_index: 120 },
        { name: '4+0', order_index: 130 },
        { name: '4+1', order_index: 140 },
        { name: '4.5+1', order_index: 150 },
        { name: '4.5+2', order_index: 160 },
        { name: '4+2', order_index: 170 },
        { name: '4+3', order_index: 180 },
        { name: '4+4', order_index: 190 },
        { name: '5+1', order_index: 200 },
        { name: '5.5+1', order_index: 210 },
        { name: '5+2', order_index: 220 },
        { name: 'Villa', order_index: 300 },
        { name: 'Ticari', order_index: 310 },
        { name: 'Ofis', order_index: 320 },
        { name: 'Depo', order_index: 330 },
        { name: 'Dubleks', order_index: 340 },
        { name: 'Penthouse', order_index: 350 }
    ]

    const tenantId = await getTenantId(supabase, user.id)

    // Fallback: Try inserting one by one ignoring errors
    for (const t of defaultTypes) {
        const { error } = await supabase.from('unit_types').insert({ ...t, tenant_id: tenantId }).select()
        if (error) {
            console.log('Skipping existing type or error:', t.name, error.message)
        }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateAiSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates: Record<string, any> = {
        openai_api_key: formData.get('openai_api_key') as string,
        gemini_api_key: formData.get('gemini_api_key') as string,
        gemini_model: formData.get('gemini_model') as string || 'gemini-2.5-flash',
        openai_model: formData.get('openai_model') as string || 'gpt-4o-mini',
        is_openai_enabled: formData.get('is_openai_enabled') === 'on',
        is_gemini_enabled: formData.get('is_gemini_enabled') === 'on',
    }

    // Messaging integration fields (only update if provided)
    const waPhoneNumberId = formData.get('wa_phone_number_id') as string
    const fbPageId = formData.get('fb_page_id') as string
    const waAccessToken = formData.get('wa_access_token') as string

    if (waPhoneNumberId !== null) updates.wa_phone_number_id = waPhoneNumberId || null
    if (fbPageId !== null) updates.fb_page_id = fbPageId || null
    if (waAccessToken !== null) updates.wa_access_token = waAccessToken || null

    // WhatsApp Otomasyon fields
    const waAutoTemplateName = formData.get('wa_auto_template_name') as string
    const waAutoTemplateRule = formData.get('wa_auto_template_rule') as string
    const waAutoTemplateEnabled = formData.get('wa_auto_template_enabled')

    if (waAutoTemplateName !== null) updates.wa_auto_template_name = waAutoTemplateName || 'novo_talep_alindi'
    if (waAutoTemplateRule !== null) updates.wa_auto_template_rule = waAutoTemplateRule || 'new_lead'
    updates.wa_auto_template_enabled = waAutoTemplateEnabled === 'on'

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update AI Settings Error:', error)
        return { error: 'Ayarlar güncellenirken bir hata oluştu.' }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateAiAssistantCharacter(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates = {
        ai_assistant_name: formData.get('ai_assistant_name') as string,
        ai_assistant_personality: formData.get('ai_assistant_personality') as string,
        ai_assistant_gender: formData.get('ai_assistant_gender') as string,
        ai_assistant_instructions: formData.get('ai_assistant_instructions') as string,
        ai_knowledge_base: formData.get('ai_knowledge_base') as string,
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update AI Character Error:', error)
        return { error: 'Karakter ayarları güncellenirken bir hata oluştu.' }
    }

    // Sync with Vapi API if configured
    if (process.env.VAPI_API_KEY && process.env.VAPI_ASSISTANT_ID) {
        try {
            let combinedPrompt = formData.get('ai_assistant_instructions') as string || '';
            const knowledgeBase = formData.get('ai_knowledge_base') as string;
            
            if (knowledgeBase) {
                combinedPrompt += `\n\n--- ŞİRKET BİLGİ BANKASI VE AKTİF PROJELER ---\n${knowledgeBase}`;
            }

            // You can also add personality instructions here if you want
            const personality = formData.get('ai_assistant_personality') as string;
            if (personality) {
                combinedPrompt = `Kişilik/Üslup: ${personality}\n\n` + combinedPrompt;
            }

            await fetch(`https://api.vapi.ai/assistant/${process.env.VAPI_ASSISTANT_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: {
                        model: 'gpt-4o', // or keep existing
                        messages: [
                            {
                                role: 'system',
                                content: combinedPrompt
                            }
                        ]
                    }
                })
            });
            console.log('✅ Synced AI instructions with Vapi Assistant');
        } catch (vapiErr) {
            console.error('Vapi Sync Error:', vapiErr);
            // Don't fail the whole action if Vapi fails
        }
    }

    // Comprehensive revalidation
    revalidatePath('/(dashboard)/settings', 'page')
    revalidatePath('/ai', 'layout')
    revalidatePath('/ai/[slug]', 'page')

    return { success: true }
}

export async function saveEmailAccount(data: any) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yetkisiz işlem.' }
    }

    // Default other accounts to false if this one is primary
    if (data.is_default) {
        await supabase
            .from('tenant_email_accounts')
            .update({ is_default: false })
            .eq('tenant_id', profile.tenant_id)
    }

    if (data.id) {
        const { id, ...updates } = data
        const { error } = await supabase
            .from('tenant_email_accounts')
            .update(updates)
            .eq('id', id)
            .eq('tenant_id', profile.tenant_id)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('tenant_email_accounts')
            .insert({ ...data, tenant_id: profile.tenant_id })

        if (error) return { error: error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function deleteEmailAccount(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
        return { error: 'Yetkisiz işlem.' }
    }

    const { error } = await supabase
        .from('tenant_email_accounts')
        .delete()
        .eq('id', id)
        .eq('tenant_id', profile.tenant_id)

    if (error) return { error: 'Silinemedi.' }

    revalidatePath('/settings')
    return { success: true }
}

import { sendPoliSms } from '@/lib/sms'

export async function updateSmsSettings(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get tenant_id from profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile?.tenant_id) return { error: 'No tenant found' }
    if (profile.role !== 'owner' && profile.role !== 'admin') {
        return { error: 'Yalnızca yönetici yetkisi olanlar bu ayarları değiştirebilir.' }
    }

    const updates = {
        sms_provider: formData.get('sms_provider') as string,
        sms_api_user: formData.get('sms_api_user') as string,
        sms_api_password: formData.get('sms_api_password') as string,
        sms_sender_id: formData.get('sms_sender_id') as string,
        is_sms_notifications_enabled: formData.get('is_sms_notifications_enabled') === 'on',
    }

    const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', profile.tenant_id)

    if (error) {
        console.error('Update SMS Settings Error:', error)
        return { error: 'Ayarlar güncellenirken bir hata oluştu: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function testSms(phoneNumber?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, role, full_name')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('testSms Profile Error:', profileError)
    }

    console.log('testSms called with:', phoneNumber)
    const targetPhone = phoneNumber
    console.log('Effective targetPhone:', targetPhone)
    console.log('Profile found:', !!profile)

    if (!profile) {
        return { error: 'Profil bilgilerine ulaşılamadı. Lütfen tekrar giriş yapın.' }
    }

    if (!targetPhone) {
        return { error: 'Test SMS göndermek için bir telefon numarası belirtilmelidir. (Yazdığınızdan veya profilinizde kayıtlı olduğundan emin olun)' }
    }

    const { data: tenant } = await supabase
        .from('tenants')
        .select('sms_api_user, sms_api_password, sms_sender_id')
        .eq('id', profile.tenant_id)
        .single()

    if (!tenant?.sms_api_user || !tenant?.sms_api_password) {
        return { error: 'Önce API kullanıcı bilgilerini yukarıdaki formdan kaydediniz.' }
    }

    const result = await sendPoliSms({
        user: tenant.sms_api_user,
        pass: tenant.sms_api_password,
        header: tenant.sms_sender_id || 'NOVOEMLAK',
        contacts: [targetPhone],
        message: `NovoCRM Test Mesajı\n\nMerhaba ${profile.full_name}, SMS altyapınız Polidijital ile başarıyla bağlandı!\n\n${new Date().toLocaleString('tr-TR')}`
    })

    return result
}

export async function toggleUserExternal(userId: string, isExternal: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Admin/Owner)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ is_external: isExternal })
        .eq('id', userId)

    if (error) {
        return { error: 'Güncelleme başarısız: ' + error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/crm')
    return { success: true }
}

export async function toggleUserActive(userId: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Admin/Owner)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Prevent deactivating self
    if (userId === user.id) {
        return { error: 'Kendi hesabınızı pasif yapamazsınız.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

    if (error) {
        return { error: 'Durum güncellenemedi: ' + error.message }
    }

    revalidatePath('/settings')
    revalidatePath('/crm')
    return { success: true }
}

export async function toggleHotLeadManager(userId: string, isHotLeadManager: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Admin/Owner)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    // Check if the user has a phone number set (required for WhatsApp notifications)
    if (isHotLeadManager) {
        const { data: targetProfile } = await supabase.from('profiles').select('phone').eq('id', userId).single()
        if (!targetProfile?.phone) {
            return { error: 'Hot Lead Manager aktif etmek için önce kullanıcının telefon numarasını tanımlayın.' }
        }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ is_hot_lead_manager: isHotLeadManager })
        .eq('id', userId)

    if (error) {
        return { error: 'Hot Lead Manager güncellenemedi: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}

export async function updateUserPhone(userId: string, phone: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check permissions (Admin/Owner)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['owner', 'admin'].includes(profile.role)) {
        return { error: 'Bu işlem için yetkiniz yok.' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({ phone: phone || null })
        .eq('id', userId)

    if (error) {
        return { error: 'Telefon güncellenemedi: ' + error.message }
    }

    revalidatePath('/settings')
    return { success: true }
}
