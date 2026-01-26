import { getBrokerBySlug } from '@/app/broker/actions'
import { notFound } from 'next/navigation'
import PublicLeadForm from './components/PublicLeadForm'

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const broker = await getBrokerBySlug(slug)

    if (!broker) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-12 md:py-20">
            <div className="w-full max-w-lg">
                <PublicLeadForm
                    brokerId={broker.id}
                    tenantId={broker.tenant_id}
                    brokerName={broker.full_name}
                />

                <div className="mt-12 text-center">
                    <p className="text-slate-400 text-sm font-medium">Powered by NovoxCRM</p>
                </div>
            </div>
        </div>
    )
}
