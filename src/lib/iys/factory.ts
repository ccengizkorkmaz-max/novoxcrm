import { createAdminClient } from '@/lib/supabase/admin';
import { BaseIYSProvider } from './providers/base';
import { PoliDijitalProvider } from './providers/polidijital';
import { NoopIYSProvider } from './providers/noop';

export async function getIYSProvider(tenantId: string): Promise<BaseIYSProvider> {
    const supabase = createAdminClient();

    // Query tenant setting
    const { data: tenant, error } = await supabase
        .from('tenants')
        .select('iys_provider, iys_config, iys_sync_enabled')
        .eq('id', tenantId)
        .single();

    if (error || !tenant) {
        console.warn(`[IYS Factory] Tenant config not found for tenantId ${tenantId}. Defaulting to Noop.`);
        return new NoopIYSProvider(tenantId, {});
    }

    const providerType = (tenant.iys_provider || 'none').toLowerCase().trim();
    const config = tenant.iys_config || {};

    if (!tenant.iys_sync_enabled) {
        console.log(`[IYS Factory] IYS sync is disabled for tenantId ${tenantId}. Using Noop.`);
        return new NoopIYSProvider(tenantId, config);
    }

    switch (providerType) {
        case 'polidijital':
            return new PoliDijitalProvider(tenantId, config);
        default:
            console.log(`[IYS Factory] No active provider class for type: ${providerType}. Using Noop.`);
            return new NoopIYSProvider(tenantId, config);
    }
}
