'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendRequestMessage } from '../actions'
import { Send } from 'lucide-react'

export function MessageForm({ requestId }: { requestId: string }) {
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!message.trim()) return

        setLoading(true)
        const res = await sendRequestMessage(requestId, message)
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            setMessage('')
        }
    }

    return (
        <div className="space-y-4">
            <Textarea
                placeholder="Mesajınızı buraya yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
            />
            <div className="flex justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !message.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {loading ? 'Gönderiliyor...' : 'Mesaj Gönder'}
                    <Send className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
