import { getMessagingSessions } from './actions'
import ConversationLayoutClient from './ConversationLayoutClient'

export default async function ConversationsLayout({
    children
}: {
    children: React.ReactNode
}) {
    const sessions = await getMessagingSessions()

    return (
        <ConversationLayoutClient sessions={sessions}>
            {children}
        </ConversationLayoutClient>
    )
}
