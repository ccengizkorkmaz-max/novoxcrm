'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Loader2, Trash2, Link2, Clock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createSharedReport, deactivateSharedReport, getActiveShares } from './share-actions'
import { toast } from 'sonner'

export default function ShareReportButton() {
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState('')
    const [expiryHours, setExpiryHours] = useState<string>('0') // 0 = süresiz
    const [loading, setLoading] = useState(false)
    const [generatedLink, setGeneratedLink] = useState('')
    const [copied, setCopied] = useState(false)
    const [shares, setShares] = useState<any[]>([])
    const [loadingShares, setLoadingShares] = useState(false)

    const handleOpen = async () => {
        setOpen(true)
        setGeneratedLink('')
        setPassword('')
        setExpiryHours('0')
        setCopied(false)
        // Load existing shares
        setLoadingShares(true)
        const result = await getActiveShares()
        if ('shares' in result) setShares(result.shares || [])
        setLoadingShares(false)
    }

    const handleCreate = async () => {
        if (password.length < 4) {
            toast.error('Şifre en az 4 karakter olmalıdır')
            return
        }
        setLoading(true)
        const hours = parseInt(expiryHours) || null // 0 or null = süresiz
        const result = await createSharedReport(password, hours === 0 ? null : hours)
        setLoading(false)

        if ('error' in result) {
            toast.error(result.error)
            return
        }

        const link = `${window.location.origin}/shared/ads-analytics/${result.token}`
        setGeneratedLink(link)
        toast.success('Paylaşım linki oluşturuldu')

        // Refresh shares list
        const updated = await getActiveShares()
        if ('shares' in updated) setShares(updated.shares || [])
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedLink)
        setCopied(true)
        toast.success('Link kopyalandı')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDeactivate = async (id: string) => {
        const result = await deactivateSharedReport(id)
        if ('error' in result) {
            toast.error(result.error)
            return
        }
        toast.success('Paylaşım devre dışı bırakıldı')
        setShares(shares.filter(s => s.id !== id))
    }

    const expiryOptions = [
        { label: 'Süresiz', value: '0' },
        { label: '1 Saat', value: '1' },
        { label: '24 Saat', value: '24' },
        { label: '7 Gün', value: '168' },
        { label: '30 Gün', value: '720' },
    ]

    return (
        <>
            <Button variant="outline" size="sm" onClick={handleOpen} className="gap-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/80">
                <Share2 className="w-4 h-4 text-slate-500" />
                Paylaş
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg bg-white dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-blue-600" />
                            Rapor Paylaşımı
                        </DialogTitle>
                        <DialogDescription>
                            Şifre korumalı bir bağlantı oluşturun. Kullanıcı girişi gerekmez.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="share-password">Erişim Şifresi</Label>
                            <Input
                                id="share-password"
                                type="text"
                                placeholder="En az 4 karakter..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-900/50"
                            />
                        </div>

                        {/* Expiry */}
                        <div className="space-y-2">
                            <Label>Geçerlilik Süresi</Label>
                            <div className="flex flex-wrap gap-2">
                                {expiryOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setExpiryHours(opt.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                            expiryHours === opt.value
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                                                : 'bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button onClick={handleCreate} disabled={loading || password.length < 4} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                            Paylaşım Linki Oluştur
                        </Button>

                        {/* Generated Link */}
                        {generatedLink && (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 space-y-2">
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">✅ Link oluşturuldu</p>
                                <div className="flex gap-2">
                                    <Input value={generatedLink} readOnly className="text-xs bg-white dark:bg-slate-900" />
                                    <Button variant="outline" size="icon" onClick={handleCopy} className="bg-white dark:bg-slate-900">
                                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                    Şifre: <strong>{password}</strong> — Bu şifreyi link ile birlikte paylaşın.
                                </p>
                            </div>
                        )}

                        {/* Active Shares */}
                        {shares.length > 0 && (
                            <div className="border-t dark:border-slate-800 pt-4 space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase">Aktif Paylaşımlar</p>
                                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1">
                                    {shares.map(share => (
                                        <div key={share.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800/80">
                                            <div className="flex items-center gap-2 text-xs">
                                                <Link2 className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-mono text-slate-500">...{share.token.slice(-8)}</span>
                                                {share.expires_at ? (
                                                    <Badge variant="outline" className="text-[10px] gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(share.expires_at).toLocaleDateString('tr-TR')}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-[10px]">Süresiz</Badge>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDeactivate(share.id)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
