'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileText, Send, Mail, MessageSquare, Loader2, ExternalLink, Copy, Check, Link2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
    createProposalLink,
    shareProposalViaWhatsApp,
    shareProposalViaEmail
} from '../proposal-actions'

interface ProposalShareButtonProps {
    offerId: string
    compact?: boolean
}

export default function ProposalShareButton({ offerId, compact = false }: ProposalShareButtonProps) {
    const [loading, setLoading] = useState(false)
    const [action, setAction] = useState<'link' | 'whatsapp' | 'email' | null>(null)
    const [proposalUrl, setProposalUrl] = useState<string | null>(null)
    const [waLink, setWaLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleCreateLink = async () => {
        setLoading(true)
        setAction('link')
        try {
            const { url, error } = await createProposalLink(offerId)
            if (error || !url) {
                toast.error(error || 'Link oluşturulamadı.')
                return
            }
            setProposalUrl(url)
            // Auto-copy to clipboard
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Teklif linki oluşturuldu ve kopyalandı!')
            setTimeout(() => setCopied(false), 3000)
        } catch (err: any) {
            console.error('Link Error:', err)
            toast.error('Link oluşturulurken hata oluştu.')
        } finally {
            setLoading(false)
            setAction(null)
        }
    }

    const handleSendWhatsApp = async () => {
        setLoading(true)
        setAction('whatsapp')
        setWaLink(null)
        try {
            const res = await shareProposalViaWhatsApp(offerId)

            if (res.success) {
                toast.success('Teklif linki WhatsApp ile gönderildi!')
            } else if (res.waLink) {
                setWaLink(res.waLink)
                toast.info('WhatsApp API kullanılamadı. Linki kullanarak manuel gönderebilirsiniz.', { duration: 5000 })
            } else {
                toast.error(res.error || 'WhatsApp gönderim hatası.')
            }
        } catch (err: any) {
            console.error('WhatsApp Error:', err)
            toast.error('WhatsApp gönderiminde hata oluştu.')
        } finally {
            setLoading(false)
            setAction(null)
        }
    }

    const handleSendEmail = async () => {
        setLoading(true)
        setAction('email')
        try {
            const res = await shareProposalViaEmail(offerId)

            if (res.success) {
                toast.success('Teklif linki e-posta ile gönderildi!')
            } else {
                toast.error(res.error || 'E-posta gönderim hatası.')
            }
        } catch (err: any) {
            console.error('Email Error:', err)
            toast.error('E-posta gönderiminde hata oluştu.')
        } finally {
            setLoading(false)
            setAction(null)
        }
    }

    const handleCopyLink = async () => {
        if (proposalUrl) {
            await navigator.clipboard.writeText(proposalUrl)
            setCopied(true)
            toast.success('Link kopyalandı!')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handlePreview = () => {
        if (proposalUrl) {
            window.open(proposalUrl, '_blank')
        }
    }

    if (compact) {
        return (
            <div className="flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={loading}
                            title="Teklif Oluştur & Paylaş"
                            className="h-8 w-8 hover:bg-blue-50"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            ) : (
                                <FileText className="h-4 w-4 text-blue-600" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={handleCreateLink} className="cursor-pointer gap-2">
                            <Link2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Link Oluştur & Kopyala</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSendWhatsApp} className="cursor-pointer gap-2">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                            <span className="font-medium">WhatsApp Gönder</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSendEmail} className="cursor-pointer gap-2">
                            <Mail className="h-4 w-4 text-violet-600" />
                            <span className="font-medium">E-posta Gönder</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {proposalUrl && (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handlePreview} className="h-8 w-8 hover:bg-blue-50" title="Önizle">
                            <Eye className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCopyLink} className="h-8 w-8 hover:bg-slate-50" title="Link Kopyala">
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                        </Button>
                    </div>
                )}

                {waLink && (
                    <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-green-50" title="WhatsApp Aç">
                            <ExternalLink className="h-4 w-4 text-green-600" />
                        </Button>
                    </a>
                )}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="gap-2 h-9 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 font-bold hover:from-blue-100 hover:to-indigo-100 transition-all select-none shadow-sm"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                        Teklif Gönder
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1">
                    <DropdownMenuItem onClick={handleCreateLink} className="cursor-pointer gap-3 py-2.5 rounded-lg">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Link2 className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">Link Kopyala</p>
                            <p className="text-[10px] text-slate-400">Teklif sayfası linki</p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSendWhatsApp} className="cursor-pointer gap-3 py-2.5 rounded-lg">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">WhatsApp Gönder</p>
                            <p className="text-[10px] text-slate-400">Müşteriye link gönder</p>
                        </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSendEmail} className="cursor-pointer gap-3 py-2.5 rounded-lg">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-violet-600" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-slate-800">E-posta Gönder</p>
                            <p className="text-[10px] text-slate-400">Müşteriye e-posta at</p>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {proposalUrl && (
                <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreview}
                        className="gap-2 h-9 rounded-xl bg-slate-50 border-slate-200 text-slate-700 font-bold"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Önizle
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCopyLink} className="h-9 rounded-xl">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                    </Button>
                </div>
            )}

            {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="animate-in slide-in-from-right-2">
                    <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl bg-green-50 border-green-200 text-green-700 font-bold">
                        <ExternalLink className="h-3.5 w-3.5" />
                        WhatsApp Aç
                    </Button>
                </a>
            )}
        </div>
    )
}
