import React from 'react'
import { getCeoFunnelData } from './actions'
import CeoFunnelDashboard from './CeoFunnelDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'CEO Satış Hunisi & Pipeline Kokpiti | NovoXCRM',
    description: 'Boru hattı dönüşüm oranları, aşama kaçakları ve dönemsel geçmiş analizi'
}

export default async function CeoFunnelPage() {
    const data = await getCeoFunnelData({ period: 'this_month' })

    return (
        <div className="p-4 md:p-8 max-w-[1700px] mx-auto animate-in fade-in duration-500">
            <CeoFunnelDashboard initialData={data} />
        </div>
    )
}
