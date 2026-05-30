'use client'

import { usePathname } from 'next/navigation'
import ConversationSidebar from './ConversationSidebar'
import { cn } from '@/lib/utils'

interface ConversationLayoutClientProps {
    sessions: any[]
    children: React.ReactNode
}

export default function ConversationLayoutClient({ sessions, children }: ConversationLayoutClientProps) {
    const pathname = usePathname()
    
    // Check if the current route is a details page (e.g. /conversations/123-abc)
    // Pathname structure: /[locale]/conversations/[id]
    const isDetailPage = pathname.includes('/conversations/') && pathname.split('/conversations/')[1]?.length > 0

    return (
        <div className="flex bg-slate-100 md:rounded-xl h-[calc(100vh-90px)] lg:h-[calc(100vh-80px)] border overflow-hidden -mx-2 sm:-mx-4 -mt-2">
            {/* Sidebar is hidden on mobile if we are viewing a conversation detail */}
            <div className={cn(
                "w-full lg:w-96 shrink-0 h-full",
                isDetailPage ? "hidden lg:block" : "block"
            )}>
                <ConversationSidebar sessions={sessions} />
            </div>

            {/* Main content is hidden on mobile if we are viewing the general list */}
            <main className={cn(
                "flex-1 overflow-hidden relative conversation-main-content bg-white h-full",
                isDetailPage ? "block" : "hidden lg:block"
            )}>
                {children}
            </main>
        </div>
    )
}
