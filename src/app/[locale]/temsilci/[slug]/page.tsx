import { getProfileBySlug, checkAuth } from './actions'
import Client from './Client'
import { notFound } from 'next/navigation'

export const metadata = {
    title: 'Temsilci - Lead Sayfası',
    robots: 'noindex, nofollow'
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = await params
    const profile = await getProfileBySlug(resolvedParams.slug)
    
    if (!profile) {
        notFound()
    }

    const isAuthed = await checkAuth(resolvedParams.slug)

    return <Client initialAuthed={isAuthed} slug={resolvedParams.slug} agentName={profile.full_name} />
}
