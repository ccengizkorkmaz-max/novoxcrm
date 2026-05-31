import { checkRole } from '@/lib/auth'
import { getAICallsForReview, getFeedbackAnalytics, getPromptVersions } from './actions'
import AIFeedbackDashboard from './AIFeedbackDashboard'
import { getCurrentUserRole } from '@/lib/auth'

export const revalidate = 0

interface PageProps {
    params: Promise<{ locale: string }> | { locale: string }
}

export default async function AIFeedbackPage({ params }: PageProps) {
    const resolvedParams = await params
    const locale = resolvedParams.locale

    const role = await getCurrentUserRole()
    const isAdmin = ['admin', 'owner'].includes(role)

    let calls: any[] = []
    let analytics: any = null
    let promptVersions: any[] = []

    try {
        calls = await getAICallsForReview(50)
    } catch (e) {
        console.error('Failed to fetch calls for review:', e)
    }

    try {
        analytics = await getFeedbackAnalytics()
    } catch (e) {
        console.error('Failed to fetch analytics:', e)
    }

    if (isAdmin) {
        try {
            promptVersions = await getPromptVersions()
        } catch (e) {
            console.error('Failed to fetch prompt versions:', e)
        }
    }

    return (
        <AIFeedbackDashboard
            calls={calls}
            analytics={analytics}
            promptVersions={promptVersions}
            isAdmin={isAdmin}
            locale={locale}
        />
    )
}
