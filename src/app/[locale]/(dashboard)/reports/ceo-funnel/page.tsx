import React from 'react'
import CeoFunnelDashboard from './CeoFunnelDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'CEO Satış Hunisi & Gelir Projeksiyonu Kokpiti | NovoXCRM',
    description: 'Satış hunisi dönüşüm oranları, aşama kaçakları ve dönemsel geçmiş analizi'
}

export default function CeoFunnelPage() {
    return (
        <div className="p-4 md:p-8 max-w-[1700px] mx-auto animate-in fade-in duration-500">
            <CeoFunnelDashboard />
        </div>
    )
}
