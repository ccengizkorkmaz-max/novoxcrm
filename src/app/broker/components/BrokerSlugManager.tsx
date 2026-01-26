'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Copy, Link as LinkIcon, CheckCircle2, Loader2 } from "lucide-react"
import { updateBrokerSlug } from '@/app/broker/actions'
import { toast } from 'sonner'

export default function BrokerSlugManager({ initialSlug }: { initialSlug: string }) {
    const [slug, setSlug] = useState(initialSlug)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)

    const publicUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}/p/${slug}` : ''

    async function handleUpdate() {
        if (!slug) return
        setLoading(true)
        const res = await updateBrokerSlug(slug.toLowerCase().trim())
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Bağlantı adresiniz güncellendi.')
        }
        setLoading(false)
    }

    function copyToClipboard() {
        if (!slug) {
            toast.error('Lütfen önce bir kullanıcı adı belirleyin.')
            return
        }
        navigator.clipboard.writeText(publicUrl)
        setCopied(true)
        toast.success('Bağlantı kopyalandı!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-blue-600" />
                    Kişisel Lead Formu
                </CardTitle>
                <CardDescription>Size özel link ile web üzerinden lead toplayın.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kullanıcı Adınız (Slug)</p>
                    <div className="flex gap-2">
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="orn-broker-adi"
                            className="rounded-xl border-slate-200"
                        />
                        <Button
                            onClick={handleUpdate}
                            disabled={loading || slug === initialSlug}
                            variant="secondary"
                            className="rounded-xl"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Kaydet"}
                        </Button>
                    </div>
                </div>

                {initialSlug && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paylaşım Linkiniz</p>
                        <div className="flex items-center gap-2 bg-white p-2 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 truncate">
                            {publicUrl}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={copyToClipboard} className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 gap-2 h-10 text-xs">
                                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? "Kopyalandı" : "Linki Kopyala"}
                            </Button>
                            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-none">
                                <Button variant="outline" className="rounded-xl gap-2 h-10 text-xs border-slate-200">
                                    <ExternalLink className="h-4 w-4" />
                                    Önizle
                                </Button>
                            </a>
                        </div>
                    </div>
                )}

                {!initialSlug && (
                    <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-100">
                        Kendi lead formunuzu oluşturmak için bir kullanıcı adı belirleyin.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
