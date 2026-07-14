import type { Metadata } from "next"
import { getBrandNameFromHost, getHostFromHeaders } from "@/lib/tenant/resolve-brand-from-host"
import RentalYieldCalculator from "./RentalYieldClient"

export async function generateMetadata(
    { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
    const { locale } = await params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Kira Getirisi ve Amortisman Hesaplayıcı | Ücretsiz Araç - ${brandName}`,
        description: 'Gayrimenkul yatırımınızın yıllık getirisini (ROI) ve kendini amorti etme süresini saniyeler içinde hesaplayın. 2026 güncel hesaplama motoru.',
        keywords: 'kira getirisi hesaplama, amortisman süresi hesaplama, gayrimenkul roi hesaplayıcı, emlak amortisman hesaplama',
        alternates: {
            canonical: locale === 'en' ? `/en/tools/kira-getirisi-hesaplayici` : `/tools/kira-getirisi-hesaplayici`,
            languages: {
                tr: `/tools/kira-getirisi-hesaplayici`,
                en: `/en/tools/kira-getirisi-hesaplayici`,
            }
        }
    }
}

export default async function RentalYieldPage() {
    return <RentalYieldCalculator />
}
