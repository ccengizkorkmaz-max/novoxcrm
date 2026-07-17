export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getTranslations } from 'next-intl/server'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import { OikosMarketingPage } from '@/components/marketing/OikosMarketingPage'
import { OldMarketingPage } from '@/components/marketing/OldMarketingPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Index' });
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    // For Oikos CRM, we can customize metadata title and description directly
    if (brandName === 'Oikos CRM') {
        return {
            title: 'Oikos CRM – Gayrimenkul AI',
            description: 'Müşteri yolculuğunu uçtan uca yapay zeka ile yönetin. Gayrimenkul geliştirme şirketleri & ulusal/uluslararası emlak ağları için AI CRM.',
            alternates: {
                canonical: '/',
                languages: {
                    'tr': '/',
                    'en': '/en',
                },
            },
        }
    }

    return {
        title: t('title').replace(/Novo CRM/gi, brandName),
        description: t('description').replace(/Novo CRM/gi, brandName),
        alternates: {
            canonical: '/',
            languages: {
                'tr': '/',
                'en': '/en',
            },
        },
    };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: string }> }) {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    if (brandName === 'Oikos CRM') {
        return <OikosMarketingPage />
    }

    return <OldMarketingPage params={params} />
}
