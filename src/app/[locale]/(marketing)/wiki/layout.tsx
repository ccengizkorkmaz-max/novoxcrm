export const dynamic = "force-dynamic";

import type { Metadata } from 'next'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: 'Bilgi Bankası',
        description: `${brandName} gayrimenkul ve inşaat teknolojileri bilgi bankası. Sektörel rehberler, makaleler ve CRM stratejileri.`,
    }
}

export default function WikiLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
