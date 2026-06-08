import { OldMarketingPage } from '@/components/marketing/OldMarketingPage'
import type { Metadata } from 'next'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Detaylı Tanıtım | ${brandName}`,
        description: `${brandName} özellikleri, çözümleri ve modülleri hakkında detaylı bilgi edinin.`
    }
}

export default async function DetayliTanitimPage({ params }: { params: Promise<{ locale: string }> }) {
    return <OldMarketingPage params={params} />
}
