'use client'

import { useState } from 'react'
import { submitContactForm } from './actions'
import { Send, CheckCircle, Loader2 } from 'lucide-react'

interface ContactFormProps {
    brokerId: string
    brokerEmail: string
    brokerName: string
    tenantId: string | null
}

export function ContactForm({ brokerId, brokerEmail, brokerName, tenantId }: ContactFormProps) {
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        formData.set('broker_id', brokerId)
        formData.set('broker_email', brokerEmail)
        formData.set('broker_name', brokerName)
        formData.set('tenant_id', tenantId || '')

        const result = await submitContactForm(formData)

        if (result.success) {
            // Trigger Google Ads conversion tracking event
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'conversion', {
                    'send_to': 'AW-18295920582/CRPnCMvCjtAcEMavlpRE'
                });
            }
            setSubmitted(true)
        } else {
            setError(result.error || 'Bir hata oluştu.')
        }
        setLoading(false)
    }

    if (submitted) {
        return (
            <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Mesajınız İletildi!</h3>
                <p className="text-sm text-slate-500">En kısa sürede sizinle iletişime geçilecektir.</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Ad Soyad *</label>
                    <input
                        name="sender_name"
                        required
                        placeholder="Adınız Soyadınız"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Telefon</label>
                    <input
                        name="sender_phone"
                        type="tel"
                        placeholder="+90 555 123 45 67"
                        className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">E-posta</label>
                <input
                    name="sender_email"
                    type="email"
                    placeholder="ornek@email.com"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Konu</label>
                <input
                    name="subject"
                    placeholder="İlgilendiğiniz proje veya konu"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mesajınız *</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    placeholder="Mesajınızı buraya yazın..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
            >
                {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...</>
                ) : (
                    <><Send className="h-4 w-4" /> Mesaj Gönder</>
                )}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
                Bilgileriniz yalnızca iletişim amacıyla kullanılacaktır.
            </p>
        </form>
    )
}
