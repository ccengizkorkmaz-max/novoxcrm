import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantWebhooks } from '@/lib/webhooks/engine'
import { WebhookSettingsView } from './components/WebhookSettingsView'

export default async function WebhookSettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!['admin', 'owner'].includes(profile?.role || '')) redirect('/dashboard')

    const { data: tenant } = profile?.tenant_id ? await supabase
        .from('tenants')
        .select('tenant_type')
        .eq('id', profile.tenant_id)
        .single() : { data: null }

    if ((tenant as any)?.tenant_type !== 'broker') redirect('/dashboard')

    const webhooks = await getTenantWebhooks(profile?.tenant_id)

    // Get tenant integrations
    const { data: integrations } = await supabase
        .from('tenant_integrations')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .order('provider')

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Entegrasyonlar & Webhook</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Dış servislerle bağlantıları ve otomatik bildirim webhook'larını yönetin.
                </p>
            </div>
            <WebhookSettingsView
                webhooks={webhooks}
                integrations={integrations || []}
            />
        </div>
    )
}
