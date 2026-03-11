import { getMessagingSessions } from './actions'
import ConversationSidebar from './ConversationSidebar'

export default async function ConversationsLayout({
    children
}: {
    children: React.ReactNode
}) {
    const sessions = await getMessagingSessions()

    return (
        <div className="flex bg-slate-100 rounded-3xl h-[calc(100vh-140px)] shadow-2xl border border-white overflow-hidden m-4 lg:m-8">
            <ConversationSidebar sessions={sessions} />
            <main className="flex-1 overflow-hidden relative conversation-main-content bg-white">
                {children}
            </main>
        </div>
    )
}
