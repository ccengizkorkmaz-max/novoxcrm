import { getProfileBySlug, checkAuth } from './actions'
import Client from './Client'
import { notFound } from 'next/navigation'

export const metadata = {
    title: 'Temsilci - Lead Sayfası',
    robots: 'noindex, nofollow'
}

export default async function AgentPage({ params }: { params: { slug: string } }) {
    const profile = await getProfileBySlug(params.slug)
    
    if (!profile) {
        notFound()
    }

    const isAuthed = await checkAuth(params.slug)

    return <Client initialAuthed={isAuthed} slug={params.slug} agentName={profile.full_name} />
}
