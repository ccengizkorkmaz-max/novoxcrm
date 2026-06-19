import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeTurkish } from '@/lib/whatsapp/parser';

/**
 * Test endpoint - Lead buton mantığını doğrudan test eder.
 * GET /api/test-lead-button?phone=905335914389&button=aradim+olumlu
 */
export async function GET(req: NextRequest) {
    const phone = req.nextUrl.searchParams.get('phone') || '905335914389';
    const button = req.nextUrl.searchParams.get('button') || 'Aradim Olumlu';
    
    const supabase = createAdminClient();
    const results: any = { phone, button, steps: [] };

    // Step 1: Tenant bul (query param veya ilk tenant)
    const tenantParam = req.nextUrl.searchParams.get('tenant');
    let tenantData: any = null;
    if (tenantParam) {
        const { data } = await supabase.from('tenants').select('id, wa_phone_number_id, wa_access_token').eq('id', tenantParam).single();
        tenantData = data;
    } else {
        const { data } = await supabase.from('tenants').select('id, wa_phone_number_id, wa_access_token').limit(1).single();
        tenantData = data;
    }
    if (!tenantData) {
        results.steps.push({ step: 'tenant', error: 'Tenant bulunamadı' });
        return NextResponse.json(results);
    }
    results.steps.push({ step: 'tenant', ok: true, tenantId: tenantData.id });

    // Step 2: Normalize
    const normalizedPhone = phone.replace(/\D/g, '');
    const phone10 = normalizedPhone.slice(-10);
    const leadBtnNorm = normalizeTurkish(button);
    results.steps.push({ step: 'normalize', phone10, leadBtnNorm });

    // Step 3: Profilleri çek ve eşleştir
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('tenant_id', tenantData.id);

    results.steps.push({ step: 'profiles', count: allProfiles?.length || 0, profiles: allProfiles?.map(p => ({ id: p.id, name: p.full_name, phone: p.phone, cleaned: p.phone?.replace(/\D/g, '') })) });

    const repProfile = allProfiles?.find(p => {
        if (!p.phone) return false;
        const clean = p.phone.replace(/\D/g, '');
        return clean.endsWith(phone10) || clean.includes(phone10);
    }) || null;

    results.steps.push({ step: 'rep_match', found: !!repProfile, rep: repProfile ? { id: repProfile.id, name: repProfile.full_name, phone: repProfile.phone } : null });

    if (!repProfile) {
        return NextResponse.json(results);
    }

    // Step 4: Sale bul
    const { data: recentSale, error: saleError } = await supabase
        .from('sales')
        .select('id, customer_id, status, customers(full_name)')
        .eq('assigned_to', repProfile.id)
        .in('status', ['Lead', 'Prospect'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    results.steps.push({ step: 'sale', found: !!recentSale, sale: recentSale, error: saleError?.message });

    return NextResponse.json(results, { status: 200 });
}
