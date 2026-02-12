import { getProjectBySlug, getAiSettings } from '@/app/[locale]/ai/actions'
import SalesAssistant from '@/components/ai/SalesAssistant'
import { notFound } from 'next/navigation'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AiAssistantPage({
    params
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { slug } = await params
    const project = await getProjectBySlug(slug)

    if (!project) {
        notFound()
    }

    const aiSettings = await getAiSettings(project.tenant_id)

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            <SalesAssistant project={project} aiSettings={aiSettings} />
        </div>
    )
}
