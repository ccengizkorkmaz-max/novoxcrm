import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getIYSProvider } from '@/lib/iys/factory';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
    // Verify authorization
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    let processedCount = 0;
    let errorCount = 0;

    try {
        console.log('[IYS Sync Cron] Fetching outreach consent logs...');

        // Process 2: Fetch logs where transfer_target = 'integrator', status = 'active', and status_detail = 'ready_to_send'
        const { data: logs, error: fetchError } = await supabase
            .from('communication_consent_logs')
            .select('*')
            .eq('transfer_target', 'integrator')
            .eq('status', 'active')
            .eq('status_detail', 'ready_to_send')
            .limit(50); // limit to 50 items per cron run to avoid timeout

        if (fetchError) {
            throw new Error(`Failed to fetch logs: ${fetchError.message}`);
        }

        if (!logs || logs.length === 0) {
            console.log('[IYS Sync Cron] No logs ready to sync.');
            return NextResponse.json({ success: true, processed: 0 });
        }

        console.log(`[IYS Sync Cron] Processing ${logs.length} log entries...`);

        for (const log of logs) {
            try {
                // Get IYS Provider for tenant
                const provider = await getIYSProvider(log.tenant_id);

                // Send consent update to IYS integrator
                const result = await provider.updateConsent(
                    log.value,
                    log.consent_type,
                    log.consent_status as 'yes' | 'no',
                    new Date(log.consent_date)
                );

                if (result.success) {
                    // Update log status to 'sent'
                    await supabase
                        .from('communication_consent_logs')
                        .update({ status_detail: 'sent', raw_log: JSON.stringify(result.raw_response) })
                        .eq('id', log.id);

                    // Find corresponding active communication info and update it
                    let infoId = log.communication_info_id;
                    if (!infoId) {
                        const { data: info } = await supabase
                            .from('customer_communication_infos')
                            .select('id')
                            .eq('tenant_id', log.tenant_id)
                            .eq('value', log.value)
                            .eq('status', 'active')
                            .limit(1)
                            .maybeSingle();

                        if (info) infoId = info.id;
                    }

                    // Update local CRM consent fields for both Kişi (Customer) and İletişim Bilgisi (Info)
                    const updatePayload: any = {};
                    const customerUpdate: any = {};

                    if (log.consent_type === 'sms') {
                        updatePayload.sms_consent = log.consent_status;
                        updatePayload.sms_last_updated_at = log.consent_date;
                        customerUpdate.sms_consent = log.consent_status;
                        customerUpdate.sms_last_updated_at = log.consent_date;
                    } else if (log.consent_type === 'call') {
                        updatePayload.call_consent = log.consent_status;
                        updatePayload.call_last_updated_at = log.consent_date;
                        customerUpdate.call_consent = log.consent_status;
                        customerUpdate.call_last_updated_at = log.consent_date;
                    } else if (log.consent_type === 'email') {
                        updatePayload.email_consent = log.consent_status;
                        updatePayload.email_last_updated_at = log.consent_date;
                        customerUpdate.email_consent = log.consent_status;
                        customerUpdate.email_last_updated_at = log.consent_date;
                    }

                    // Update info record
                    if (infoId) {
                        await supabase
                            .from('customer_communication_infos')
                            .update({ ...updatePayload, updated_at: new Date().toISOString() })
                            .eq('id', infoId);
                    }

                    // Update customer record
                    if (log.customer_id) {
                        await supabase
                            .from('customers')
                            .update(customerUpdate)
                            .eq('id', log.customer_id);
                    }

                    processedCount++;
                } else {
                    // Update log with error state
                    await supabase
                        .from('communication_consent_logs')
                        .update({
                            status_detail: 'error',
                            raw_log: JSON.stringify({
                                error: result.error_message,
                                details: result.raw_response
                            })
                        })
                        .eq('id', log.id);

                    errorCount++;
                }
            } catch (err: any) {
                console.error(`[IYS Sync Cron] Error processing log ${log.id}:`, err);
                await supabase
                    .from('communication_consent_logs')
                    .update({ status_detail: 'error', raw_log: err.message })
                    .eq('id', log.id);

                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: processedCount,
            errors: errorCount,
            timestamp: new Date().toISOString(),
        });

    } catch (error: any) {
        console.error('[IYS Sync Cron] Main Error:', error.message);
        return NextResponse.json({
            success: false,
            error: error.message,
        }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    return GET(req);
}
