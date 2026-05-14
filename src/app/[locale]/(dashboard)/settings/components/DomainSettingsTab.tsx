'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Globe, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, Copy, ExternalLink } from 'lucide-react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { setCustomDomain, checkDomainVerification, removeCustomDomain } from '../actions/domain-actions'

interface DomainSettingsTabProps {
    currentDomain: string | null
    domainVerified: boolean
    verificationRecord: any
}

export default function DomainSettingsTab({ currentDomain, domainVerified, verificationRecord }: DomainSettingsTabProps) {
    const [domain, setDomain] = useState('')
    const [isPending, startTransition] = useTransition()
    const [verifyPending, setVerifyPending] = useState(false)
    const [localDomain, setLocalDomain] = useState(currentDomain)
    const [localVerified, setLocalVerified] = useState(domainVerified)
    const [localVerification, setLocalVerification] = useState(verificationRecord?.verification || [])

    const handleSetDomain = () => {
        if (!domain.trim()) {
            toast.error('Lütfen geçerli bir domain girin.')
            return
        }

        startTransition(async () => {
            const result = await setCustomDomain(domain.trim())
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Domain başarıyla eklendi!')
                setLocalDomain(domain.trim().toLowerCase())
                setLocalVerified(result.verified || false)
                setLocalVerification(result.verification || [])
                setDomain('')
            }
        })
    }

    const handleVerify = async () => {
        setVerifyPending(true)
        try {
            const result = await checkDomainVerification()
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.verified) {
                toast.success('DNS doğrulandı! Domain aktif.')
                setLocalVerified(true)
                setLocalVerification([])
            } else {
                toast.warning('DNS henüz doğrulanmadı. Lütfen DNS kayıtlarınızı kontrol edin.')
                setLocalVerification(result?.verification || [])
            }
        } catch {
            toast.error('Doğrulama kontrolü başarısız oldu.')
        } finally {
            setVerifyPending(false)
        }
    }

    const handleRemove = async () => {
        startTransition(async () => {
            const result = await removeCustomDomain()
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Domain başarıyla kaldırıldı.')
                setLocalDomain(null)
                setLocalVerified(false)
                setLocalVerification([])
            }
        })
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Panoya kopyalandı!')
    }

    return (
        <div className="space-y-6">
            {/* Current Domain Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Custom Domain
                    </CardTitle>
                    <CardDescription>
                        Kendi domain adresinizi bağlayarak CRM platformunuza özel URL ile erişim sağlayın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {localDomain ? (
                        <>
                            {/* Active Domain Display */}
                            <div className="p-4 rounded-lg border bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-lg">{localDomain}</p>
                                            <p className="text-xs text-muted-foreground">Aktif Custom Domain</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {localVerified ? (
                                            <Badge className="bg-green-100 text-green-700 gap-1">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Doğrulandı
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                DNS Bekleniyor
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {localVerified && (
                                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>Domain aktif ve SSL sertifikası Vercel tarafından sağlanıyor.</span>
                                        <a
                                            href={`https://${localDomain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto flex items-center gap-1 text-green-800 hover:underline font-medium"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Aç
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* DNS Instructions (if not verified) */}
                            {!localVerified && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 space-y-3">
                                        <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            DNS Yapılandırma Gerekli
                                        </h4>
                                        <p className="text-sm text-yellow-700">
                                            Aşağıdaki DNS kaydını domain sağlayıcınızın (GoDaddy, Cloudflare, vb.) DNS ayarlarına ekleyin:
                                        </p>

                                        <div className="bg-white rounded-md border p-4 space-y-3">
                                            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground">
                                                <span>Tür</span>
                                                <span>Ad / Host</span>
                                                <span>Değer / Target</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm items-center">
                                                <span className="font-mono font-bold">CNAME</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono">{localDomain.split('.')[0]}</span>
                                                    <button onClick={() => copyToClipboard(localDomain.split('.')[0])} className="text-muted-foreground hover:text-foreground">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono">cname.vercel-dns.com</span>
                                                    <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="text-muted-foreground hover:text-foreground">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* If Vercel returned specific verification records */}
                                        {localVerification && localVerification.length > 0 && (
                                            <div className="bg-white rounded-md border p-4 space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">Ek Doğrulama Kaydı (gerekli olabilir):</p>
                                                {localVerification.map((v: any, i: number) => (
                                                    <div key={i} className="grid grid-cols-3 gap-4 text-sm items-center">
                                                        <span className="font-mono font-bold">{v.type}</span>
                                                        <span className="font-mono text-xs">{v.domain}</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono text-xs truncate">{v.value}</span>
                                                            <button onClick={() => copyToClipboard(v.value)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <p className="text-xs text-yellow-600">
                                            Not: DNS değişiklikleri genellikle 1-48 saat içinde yayılır. Cloudflare kullanıyorsanız proxy&apos;yi (turuncu bulut) kapatın.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleVerify}
                                        disabled={verifyPending}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        {verifyPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        DNS Durumunu Kontrol Et
                                    </Button>
                                </div>
                            )}

                            {/* Remove Domain */}
                            <div className="pt-4 border-t">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Domain Bağlantısını Kaldır
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Domain bağlantısını kaldırmak istediğinize emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <strong>{localDomain}</strong> domain bağlantısı kaldırılacak ve platformunuza bu adres üzerinden erişilemeyecektir.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleRemove}
                                                className="bg-red-600 hover:bg-red-700"
                                                disabled={isPending}
                                            >
                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Kaldır
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Add Domain Form */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="custom-domain">Domain Adresi</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="custom-domain"
                                            placeholder="crm.firmaadi.com"
                                            value={domain}
                                            onChange={(e) => setDomain(e.target.value)}
                                            disabled={isPending}
                                            className="flex-1"
                                        />
                                        <Button
                                            onClick={handleSetDomain}
                                            disabled={isPending || !domain.trim()}
                                            className="gap-2 min-w-[140px]"
                                        >
                                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                            Domain Ekle
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Örnek: <code className="bg-slate-100 px-1 rounded">crm.firmaadi.com</code> veya <code className="bg-slate-100 px-1 rounded">portal.firmaadi.com.tr</code>
                                    </p>
                                </div>

                                {/* How it works */}
                                <div className="p-4 rounded-lg border bg-blue-50/50 space-y-3">
                                    <h4 className="font-semibold text-sm text-blue-800">Nasıl Çalışır?</h4>
                                    <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                                        <li>Yukarıya kendi domain adresinizi girin</li>
                                        <li>Sistem size gerekli DNS kaydını gösterecek</li>
                                        <li>Domain sağlayıcınızda (GoDaddy, Cloudflare vb.) DNS kaydını ekleyin</li>
                                        <li>DNS yayılımı sonrası domain otomatik aktif olacaktır</li>
                                        <li>SSL sertifikası Vercel tarafından ücretsiz olarak sağlanır</li>
                                    </ol>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
