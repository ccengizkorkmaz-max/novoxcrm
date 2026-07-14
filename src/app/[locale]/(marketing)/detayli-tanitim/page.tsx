import { OldMarketingPage } from '@/components/marketing/OldMarketingPage'
import type { Metadata } from 'next'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Detaylı Tanıtım | ${brandName}`,
        description: `${brandName} özellikleri, çözümleri ve modülleri hakkında detaylı bilgi edinin.`,
        alternates: {
            canonical: locale === 'en' ? `/en/detayli-tanitim` : `/detayli-tanitim`,
            languages: {
                tr: `/detayli-tanitim`,
                en: `/en/detayli-tanitim`,
            }
        }
    }
}

export default async function DetayliTanitimPage({ params }: { params: Promise<{ locale: string }> }) {
    return <OldMarketingPage params={params} showPricing={false} />
}
