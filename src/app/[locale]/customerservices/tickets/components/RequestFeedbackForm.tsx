'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { submitRequestFeedback } from '@/app/[locale]/(dashboard)/customer-support/actions'
import { toast } from 'sonner'

interface RequestFeedbackFormProps {
    requestId: string
}

export function RequestFeedbackForm({ requestId }: RequestFeedbackFormProps) {
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [hover, setHover] = useState(0)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('service_request_id', requestId)
            formData.append('rating', String(rating))
            formData.append('comment', comment)

            const res = await submitRequestFeedback(formData)
            if (res.success) {
                toast.success('Değerlendirmeniz ve geri bildiriminiz başarıyla iletildi.')
                window.location.reload() // Reload to show updated state
            } else {
                toast.error(res.error || 'İşlem başarısız oldu.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-emerald-50/20 p-6 rounded-2xl border border-emerald-100/50 shadow-sm">
            <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-sm">Hizmet Kalitemizi Değerlendirin</h4>
                <p className="text-slate-500 text-xs">Bu servis talebini nasıl değerlendirirsiniz? Memnuniyetiniz bizim için önemlidir.</p>
            </div>

            <div className="flex items-center gap-1.5 py-1">
                {Array.from({ length: 5 }).map((_, i) => {
                    const ratingValue = i + 1
                    return (
                        <button
                            type="button"
                            key={i}
                            className="focus:outline-none transition-transform active:scale-95"
                            onClick={() => setRating(ratingValue)}
                            onMouseEnter={() => setHover(ratingValue)}
                            onMouseLeave={() => setHover(0)}
                        >
                            <Star
                                className={`h-8 w-8 ${
                                    ratingValue <= (hover || rating)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-200'
                                }`}
                            />
                        </button>
                    )
                })}
            </div>

            <div className="space-y-2">
                <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Görüşleriniz veya eklemek istedikleriniz..."
                    className="text-xs focus-visible:ring-emerald-500"
                    rows={3}
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 px-4 rounded-xl shadow-sm border-none"
            >
                {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
            </Button>
        </form>
    )
}
