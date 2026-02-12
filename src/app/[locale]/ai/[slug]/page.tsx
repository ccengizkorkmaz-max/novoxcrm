import { getProjectBySlug, createLeadFromAi } from '@/app/[locale]/ai/actions'
import SalesAssistant from '@/components/ai/SalesAssistant'
import { notFound } from 'next/navigation'

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

    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            <SalesAssistant project={project} />
        </div>
    )
}
