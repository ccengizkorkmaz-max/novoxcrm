'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'

export default function ConversationReply() {
    const [message, setMessage] = useState('')
    const [isSending, setIsSending] = useState(false)
    const params = useParams()
    const router = useRouter()
    const sessionId = params.id as string

    async function handleSend() {
        if (!message.trim() || isSending) return

        setIsSending(true)
        try {
            const response = await fetch('/api/conversations/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    message: message.trim()
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Mesaj gönderilemedi')
            }

            setMessage('')
            toast.success('Mesaj başarıyla gönderildi')
            router.refresh()
        } catch (error: any) {
            console.error('Send message error:', error)
            toast.error(error.message || 'Bir hata oluştu')
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10">
            <div className="flex gap-2 max-w-[1400px] mx-auto">
                <Input
                    placeholder="Mesajınızı yazın..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    disabled={isSending}
                    className="flex-1 rounded-xl border-slate-200 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                    onClick={handleSend}
                    disabled={isSending || !message.trim()}
                    className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
            </div>
        </div>
    )
}
