'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ExternalLink, Copy, Link as LinkIcon, CheckCircle2, Loader2 } from "lucide-react"
import { updateBrokerSlug } from '@/app/broker/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function BrokerSlugManager({ initialSlug }: { initialSlug: string }) {
    const [slug, setSlug] = useState(initialSlug)
    const [loading, setLoading] = useState(false)
    const [copied, setCopied] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const publicUrl = mounted ? `${window.location.protocol}//${window.location.host}/p/${slug}` : ''

    async function handleUpdate() {
        if (!slug) return
        setLoading(true)
        const res = await updateBrokerSlug(slug.toLowerCase().trim())
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Bağlantı adresiniz güncellendi.')
            router.refresh()
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
        <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden border border-slate-100">
            <CardHeader className="px-4 py-3 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <LinkIcon className="h-3 w-3 text-blue-500" />
                    Profil Linki
                </CardTitle>
                {initialSlug && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-0.5">
                        Önizle <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                )}
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            placeholder="kullanici-adiniz"
                            className="rounded-lg border-slate-200 h-9 text-xs focus-visible:ring-blue-500"
                        />
                        <Button
                            onClick={handleUpdate}
                            disabled={loading || slug === initialSlug}
                            className="rounded-lg h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800"
                        >
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Kaydet"}
                        </Button>
                    </div>
                </div>

                {initialSlug ? (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Paylaşılabilir Linkiniz</p>
                        <div className="bg-white p-2 px-3 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 break-all leading-relaxed">
                            {mounted ? publicUrl : '...'}
                        </div>
                        <Button
                            onClick={copyToClipboard}
                            variant="outline"
                            className="w-full rounded-lg bg-white border-slate-200 hover:bg-slate-50 gap-2 h-8 text-[10px] font-bold"
                        >
                            {copied ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Kopyalandı" : "Linki Kopyala"}
                        </Button>
                    </div>
                ) : (
                    <div className="p-3 bg-blue-50/50 text-blue-700 rounded-xl text-[10px] font-medium border border-blue-100 leading-relaxed italic">
                        Müşterilerinize göndermek için bir kullanıcı adı belirleyin.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
