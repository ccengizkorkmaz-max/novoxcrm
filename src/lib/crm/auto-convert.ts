export async function autoConvertQualificationToSale(
    supabase: any,
    tenantId: string,
    customerId: string,
    score: string,
    notes?: string,
    fallbackProjectId?: string | null,
    fallbackAssignedTo?: string | null
) {
    if (!['hot', 'warm', 'call_requested'].includes(score)) {
        return { success: false, reason: 'Score is not hot or warm' };
    }

    try {
        console.log(`[AutoConvert] Checking qualification status for customer ${customerId} (Score: ${score})`);

        // 1. Find active lead qualification for this customer (not yet linked to a sale)
        const { data: qual, error: qualErr } = await supabase
            .from('lead_qualifications')
            .select('*')
            .eq('customer_id', customerId)
            .eq('tenant_id', tenantId)
            .is('sale_id', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (qualErr) {
            console.error('[AutoConvert] Error fetching qualification:', qualErr);
            return { success: false, error: qualErr.message };
        }

        if (!qual) {
            console.log(`[AutoConvert] No active lead qualification found for customer ${customerId}. Skipping auto-conversion.`);
            return { success: false, reason: 'No active qualification' };
        }

        // Project check: Must have an interested project
        if (!qual.project_id && !fallbackProjectId) {
            console.log(`[AutoConvert] Qualification ${qual.id} has no project_id. Skipping auto-conversion.`);
            return { success: false, reason: 'No project_id' };
        }

        // 2. Check if there is already an active sale for this customer
        const { data: existingSales, error: saleCheckErr } = await supabase
            .from('sales')
            .select('id')
            .eq('customer_id', customerId)
            .in('status', ['Lead', 'Prospect', 'Proposal', 'Reservation', 'Negotiation', 'Contract'])
            .limit(1);

        if (saleCheckErr) {
            console.error('[AutoConvert] Error checking existing sale:', saleCheckErr);
        }

        const existingSale = existingSales && existingSales.length > 0 ? existingSales[0] : null;
        let saleId = existingSale?.id;

        if (!saleId) {
            // Determine project_id and assigned_to
            const projectId = qual.project_id || fallbackProjectId || null;
            const assignedTo = qual.assigned_to || fallbackAssignedTo || null;

            // 3. Create new sale record
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    status: 'Lead', // Automatically converted as a Lead
                    assigned_to: assignedTo,
                    project_id: projectId,
                    lead_origin: 'company',
                    description: `AI tarafından otomatik olarak Satış Yönetimine aktarıldı (Skor: ${score.toUpperCase()})` + (notes ? ` - ${notes}` : '')
                })
                .select()
                .single();

            if (saleError) {
                console.error('[AutoConvert] Failed to auto create sale during qualification conversion:', saleError);
                return { success: false, error: saleError.message };
            }

            if (newSale) {
                saleId = newSale.id;
                console.log(`[AutoConvert] Created new sale record (ID: ${saleId}) for customer ${customerId}`);
            }
        } else {
            console.log(`[AutoConvert] Customer ${customerId} already has an active sale (ID: ${saleId}). Connecting qualification to it.`);
        }

        if (saleId) {
            // 4. Update the qualification record
            const { error: qualUpdateErr } = await supabase
                .from('lead_qualifications')
                .update({
                    status: 'qualified',
                    sale_id: saleId,
                    interest_level: score,
                    converted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', qual.id);

            if (qualUpdateErr) {
                console.error('[AutoConvert] Failed to update qualification record:', qualUpdateErr);
                return { success: false, error: qualUpdateErr.message };
            }

            console.log(`[AutoConvert] Successfully converted qualification ${qual.id} to qualified.`);

            // 5. Add activity log
            const { error: actError } = await supabase
                .from('activities')
                .insert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    type: 'System',
                    summary: 'Ön Değerlendirme Otomatik Onayı (AI)',
                    description: `Müşteri AI skorlamasında ${score.toUpperCase()} aldığı için otomatik olarak Satış Panosuna aktarıldı.`,
                    status: 'Completed'
                });

            if (actError) {
                console.error('[AutoConvert] Failed to insert activity log:', actError);
            }

            return { success: true, saleId };
        }

        return { success: false, reason: 'Failed to resolve sale ID' };
    } catch (e: any) {
        console.error('[AutoConvert] Unexpected error:', e);
        return { success: false, error: e.message };
    }
}
