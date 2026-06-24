import { createClient } from '@/lib/supabase/server'
import CustomerForm from '../components/CustomerForm'

export const dynamic = 'force-dynamic'

export default async function NewCustomerPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    let crmMode: 'basic' | 'advance' = 'basic'

    if (user) {
        const { data: userProfile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', user.id)
            .single()

        if (userProfile?.tenant_id) {
            const { data: tenant } = await supabase
                .from('tenants')
                .select('crm_mode')
                .eq('id', userProfile.tenant_id)
                .single()
            if (tenant?.crm_mode === 'advance') {
                crmMode = 'advance'
            }
        }
    }

    return (
        <div className="p-4 sm:p-6">
            <CustomerForm crmMode={crmMode} />
        </div>
    )
}
