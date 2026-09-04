import { BackButton } from '@/components/back-button'
import { getCallCenterPerformanceData } from './actions'
import CallCenterPerformanceClient from './CallCenterPerformanceClient'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
    title: 'Temsilci Arama & Çağrı Merkezi Raporu | NovoCRM',
    description: 'Satış temsilcilerinin telefon görüşmeleri, konuşma süreleri, arama başarı oranları ve santral dökümü.'
}

export default async function CallCenterPerformancePage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const data = await getCallCenterPerformanceData({ period: 'month' })

    if ('error' in data) {
        return (
            <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-4">
                    <BackButton variant="ghost" size="icon" />
                    <h1 className="text-2xl font-bold tracking-tight">Temsilci Arama & Çağrı Merkezi Raporu</h1>
                </div>
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-2xl border border-red-200">
                    Hata: {data.error}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-2 sm:p-4 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-4">
                <BackButton variant="ghost" size="icon" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Temsilci Arama & Çağrı Merkezi Raporu
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                        Satış danışmanlarının giden/gelen arama hacimleri, toplam konuşma süreleri, ulaşılma ve randevu dönüşüm oranları.
                    </p>
                </div>
            </div>

            <CallCenterPerformanceClient
                initialData={data}
                profiles={data.profiles || []}
            />
        </div>
    )
}
