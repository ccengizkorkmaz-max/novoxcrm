import { getBrokerBySlug } from '@/app/broker/actions'
import { notFound } from 'next/navigation'
import PublicLeadForm from './components/PublicLeadForm'
import PublicInventoryView from './components/PublicInventoryView'
import { getTranslations } from 'next-intl/server'
import { getPublicInventoryLinkBySlug } from '../../(dashboard)/inventory/actions'

export default async function PublicPage(props: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { locale, slug } = await props.params
    const t = await getTranslations('CRM.newSale')

    // First check if it's a shared inventory catalog
    const catalog = await getPublicInventoryLinkBySlug(slug)

    if (catalog) {
        if ('expired' in catalog && catalog.expired) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                    <div className="max-w-md space-y-4">
                        <h1 className="text-2xl font-bold text-slate-900">Bu Linkin Süresi Dolmuş</h1>
                        <p className="text-slate-500">Bu paylaşım linki artık aktif değil. Lütfen gayrimenkul danışmanınızdan yeni bir link talep edin.</p>
                    </div>
                </div>
            )
        }
        return <PublicInventoryView linkData={catalog} />
    }

    // Then check if it's a broker lead form
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
                    <p className="text-slate-400 text-sm font-medium">{t('poweredBy')}</p>
                </div>
            </div>
        </div>
    )
}
