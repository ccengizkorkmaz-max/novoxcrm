import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import CommissionStats from './components/CommissionStats'
import CommissionList from './components/CommissionList'
import { getCommissions, getCommissionStats } from './actions'

export default async function CommissionsPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const t = await getTranslations('Commissions')

    // Parallel data fetching
    const [stats, commissions] = await Promise.all([
        getCommissionStats(),
        getCommissions()
    ])

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Prim Takibi</h1>
                <p className="text-muted-foreground">
                    Satışlardan hakedilen primlerin durumunu ve detaylarını inceleyin.
                </p>
            </div>

            <CommissionStats stats={stats} />
            <CommissionList commissions={commissions || []} />
        </div>
    )
}
