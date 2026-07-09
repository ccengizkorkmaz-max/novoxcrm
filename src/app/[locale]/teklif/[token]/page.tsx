import { notFound } from 'next/navigation'
import { getProposalDataByToken } from '@/app/[locale]/(dashboard)/offers/proposal-actions'
import type { Metadata } from 'next'
import ProposalPageClient from './ProposalPageClient'

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
    const { token } = await params
    const { data } = await getProposalDataByToken(token)

    if (!data) {
        return { title: 'Teklif Bulunamadı' }
    }

    return {
        title: `Teklif - ${data.offerNumber} | ${data.companyName}`,
        description: `${data.customerName} için hazırlanan ${data.projectName} - ${data.unitNumber} teklif belgesi`,
        robots: { index: false, follow: false }
    }
}

export default async function ProposalPublicPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const { data, error } = await getProposalDataByToken(token)

    if (!data || error) {
        return notFound()
    }

    const isExpired = data.validUntil ? new Date(data.validUntil) < new Date() : false

    return <ProposalPageClient data={data} isExpired={isExpired} />
}
