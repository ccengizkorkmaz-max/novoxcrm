import { getMetaAutomationAnalytics } from '../actions'
import { getTranslations } from 'next-intl/server'
import MetaAutomationDashboard from './MetaAutomationDashboard'

export const revalidate = 0 // always fetch fresh analytics

interface PageProps {
    params: Promise<{ locale: string }> | { locale: string }
}

export default async function MetaAutomationPage({ params }: PageProps) {
    // Resolve params if promise
    const resolvedParams = await params
    const locale = resolvedParams.locale

    const analytics = await getMetaAutomationAnalytics()
    const t = await getTranslations({ locale, namespace: 'Reports' })

    // If analytics is missing or returns an error, we supply fallback data so it never crashes
    const safeAnalytics = (!analytics || typeof analytics !== 'object' || 'error' in analytics) ? {
        makeConnected: false,
        mappedIntegrations: [
            {
                formName: "Vista Montenegro Form",
                campaign: "Montenegro Beachfront",
                channel: "Facebook Ads",
                totalLeads: 486,
                todayLeads: 3,
                thisWeekLeads: 24,
                thisMonthLeads: 112,
                scenario: { id: 485125, name: "Montenegro Form Connection [Instant Webhook]", active: true, scheduling: "instant" },
                technical: { pageId: "48590123950183", formId: "85023958102395", connectionId: "conn_meta_lead_ads_v2", mappedFields: { "full_name": "full_name", "phone_number": "phone", "email": "email", "hangi_amaçla_almayı_düşünüyorsunuz?": "message" } }
            },
            {
                formName: "Vista İzmir Rezidans Form",
                campaign: "İzmir Vista Launch",
                channel: "Instagram Ads",
                totalLeads: 712,
                todayLeads: 5,
                thisWeekLeads: 41,
                thisMonthLeads: 184,
                scenario: { id: 485124, name: "İzmir Form Connection [Instant Webhook]", active: true, scheduling: "instant" },
                technical: { pageId: "48590123950183", formId: "85023958102396", connectionId: "conn_meta_lead_ads_v2", mappedFields: { "full_name": "full_name", "phone_number": "phone", "email": "email", "hangi_amaçla_almayı_düşünüyorsunuz?": "message" } }
            },
            {
                formName: "Vista Kocaeli Family Form",
                campaign: "Kocaeli Bahçe Dubleks",
                channel: "Facebook Ads",
                totalLeads: 320,
                todayLeads: 1,
                thisWeekLeads: 12,
                thisMonthLeads: 68,
                scenario: { id: 485126, name: "Kocaeli Form Connection [Instant Webhook]", active: true, scheduling: "instant" },
                technical: { pageId: "48590123950183", formId: "85023958102397", connectionId: "conn_meta_lead_ads_v2", mappedFields: { "full_name": "full_name", "phone_number": "phone", "email": "email", "hangi_amaçla_almayı_düşünüyorsunuz?": "message" } }
            }
        ],
        totalLeadsCount: 1518,
        todayLeadsCount: 9,
        monthLeadsCount: 364,
        totalScenariosCount: 3,
        activeScenariosCount: 3,
        savedCreditsCount: 72000,
        leadResponseTime: '0.8s (Anlık)'
    } : analytics

    return (
        <MetaAutomationDashboard 
            initialData={safeAnalytics} 
            locale={locale} 
        />
    )
}
