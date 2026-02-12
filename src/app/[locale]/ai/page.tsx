import SalesAssistant from '@/components/ai/SalesAssistant'

export default async function GlobalAiAssistantPage() {
    // This is the generic entrance for the AI Assistant
    // It doesn't fetch a specific project, so it becomes a portfolio assistant
    return (
        <div className="min-h-screen bg-[#0a0a0b]">
            <SalesAssistant project={null} />
        </div>
    )
}
