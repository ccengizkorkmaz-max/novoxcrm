'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Copy, Check, Loader2, Link as LinkIcon, Lock } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createPublicInventoryLink } from '../actions'

import { useParams } from 'next/navigation'
import { useRef } from 'react'

interface PublicLinkCreatorProps {
    unitIds: string[]
    unitsCount: number
}

export function PublicLinkCreator({ unitIds, unitsCount }: PublicLinkCreatorProps) {
    const { locale } = useParams()
    const inputRef = useRef<HTMLInputElement>(null)
    const [open, setOpen] = useState(false)
    const [title, setTitle] = useState('')
    const [password, setPassword] = useState('')
    const [expiryDays, setExpiryDays] = useState(7)
    const [loading, setLoading] = useState(false)
    const [createdSlug, setCreatedSlug] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleCreate = async () => {
        if (unitsCount === 0) {
            toast.error('Paylaşılacak ünite bulunamadı.')
            return
        }

        setLoading(true)
        const result = await createPublicInventoryLink(
            title || 'Fiyat Listesi ve Katalog',
            unitIds,
            expiryDays,
            password
        )
        setLoading(false)

        if (result.success && result.slug) {
            setCreatedSlug(result.slug)
            toast.success('Paylaşım linki oluşturuldu.')
        } else {
            toast.error(result.error || 'Link oluşturulamadı.')
        }
    }
    const shareUrl = createdSlug ? `${window.location.origin}/${locale}/p/${createdSlug}` : ''

    const copyToClipboard = () => {
        if (!shareUrl) return

        // Prefer selecting the input directly if available
        if (inputRef.current) {
            inputRef.current.select()
            inputRef.current.setSelectionRange(0, 99999) // For mobile devices
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    handleCopySuccess()
                })
                .catch(err => {
                    console.error('Clipboard API failed', err)
                    performFallbackCopy()
                })
        } else {
            performFallbackCopy()
        }
    }

    const handleCopySuccess = () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toast.success('Link kopyalandı.')
    }

    const performFallbackCopy = () => {
        try {
            const successful = document.execCommand('copy')
            if (successful) {
                handleCopySuccess()
            } else {
                // Last ditch effort with hidden textarea
                const textArea = document.createElement("textarea")
                textArea.value = shareUrl
                textArea.style.position = "fixed"
                textArea.style.left = "-9999px"
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                const secondTry = document.execCommand('copy')
                document.body.removeChild(textArea)

                if (secondTry) handleCopySuccess()
                else throw new Error('Copy failed')
            }
        } catch (err) {
            console.error('Copy failed', err)
            toast.error('Kopyalanamadı. Lütfen linke sağ tıklayıp kopyalayın.')
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) {
                setCreatedSlug(null)
                setTitle('')
                setPassword('')
            }
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1.5 border-amber-200 hover:bg-amber-50 text-amber-700 font-bold"
                >
                    <Share2 className="h-3 w-3" />
                    Müşteriyle Paylaş
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-amber-600" />
                        Kamuya Açık Katalog Oluştur
                    </DialogTitle>
                </DialogHeader>

                {!createdSlug ? (
                    <div className="space-y-4 py-4">
                        <div className="p-3 bg-slate-50 rounded-lg border text-xs text-slate-600">
                            <strong>{unitsCount}</strong> ünite içeren özel bir teklif/katalog sayfası oluşturulacaktır.
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-xs">Liste Başlığı</Label>
                            <Input
                                id="title"
                                placeholder="Örn: Novo Park Vista Özel Fiyat Listesi"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-9 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="expiry" className="text-xs">Geçerlilik Süresi (Gün)</Label>
                                <Input
                                    id="expiry"
                                    type="number"
                                    value={expiryDays}
                                    onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="pass" className="text-xs flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> Şifre (Opsiyonel)
                                </Label>
                                <Input
                                    id="pass"
                                    type="password"
                                    placeholder="Gizli liste için..."
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-9 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-6 space-y-4 text-center">
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                            <Check className="h-6 w-6" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-slate-900">Linkiniz Hazır!</h3>
                            <p className="text-xs text-slate-500">Bu linki kopyalayıp müşterinize WhatsApp veya e-posta ile iletebilirsiniz.</p>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded border">
                            <Input
                                ref={inputRef}
                                value={shareUrl}
                                readOnly
                                onClick={copyToClipboard}
                                className="border-none bg-transparent h-8 text-xs focus-visible:ring-0 cursor-pointer"
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={copyToClipboard}>
                                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {!createdSlug ? (
                        <>
                            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Vazgeç</Button>
                            <Button onClick={handleCreate} disabled={loading || unitsCount === 0} className="bg-amber-600 hover:bg-amber-700">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Share2 className="h-4 w-4 mr-2" />}
                                Linki Oluştur
                            </Button>
                        </>
                    ) : (
                        <Button className="w-full" onClick={() => setOpen(false)}>Kapat</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
