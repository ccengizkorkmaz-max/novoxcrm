import { checkAuth } from './actions'
import BunyaminClient from './BunyaminClient'

export const metadata = {
    title: 'Bünyamin Saraç - Lead Sayfası',
    robots: 'noindex, nofollow'
}

export default async function BunyaminPage() {
    const isAuthed = await checkAuth()

    return <BunyaminClient initialAuthed={isAuthed} />
}
