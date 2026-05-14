'use client'

import { useState } from 'react'
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
import { useRouter } from 'next/navigation'

interface DomainSettingsTabProps {
    currentDomain: string | null
    domainVerified: boolean
    verificationRecord: any
}

export default function DomainSettingsTab({ currentDomain, domainVerified, verificationRecord }: DomainSettingsTabProps) {
    const router = useRouter()
    const [domain, setDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [verifyLoading, setVerifyLoading] = useState(false)
    const [localDomain, setLocalDomain] = useState(currentDomain)
    const [localVerified, setLocalVerified] = useState(domainVerified)
    const [localVerification, setLocalVerification] = useState(verificationRecord?.verification || [])

    const callDomainApi = async (action: string, domain?: string) => {
        const res = await fetch('/api/domains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, domain }),
        })
        return res.json()
    }

    const handleSetDomain = async () => {
        if (!domain.trim()) {
            toast.error('Lutfen gecerli bir domain girin.')
            return
        }

        setLoading(true)
        try {
            const result = await callDomainApi('set', domain.trim())
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Domain basariyla eklendi!')
                setLocalDomain(domain.trim().toLowerCase())
                setLocalVerified(result.verified || false)
                setLocalVerification(result.verification || [])
                setDomain('')
                router.refresh()
            }
        } catch {
            toast.error('Bir hata olustu.')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        setVerifyLoading(true)
        try {
            const result = await callDomainApi('verify')
            if (result.error) {
                toast.error(result.error)
            } else if (result.verified) {
                toast.success('DNS dogrulandi! Domain aktif.')
                setLocalVerified(true)
                setLocalVerification([])
                router.refresh()
            } else {
                toast.warning('DNS henuz dogrulanmadi.')
                setLocalVerification(result.verification || [])
            }
        } catch {
            toast.error('Dogrulama basarisiz.')
        } finally {
            setVerifyLoading(false)
        }
    }

    const handleRemove = async () => {
        setLoading(true)
        try {
            const result = await callDomainApi('remove')
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Domain kaldirildi.')
                setLocalDomain(null)
                setLocalVerified(false)
                setLocalVerification([])
                router.refresh()
            }
        } catch {
            toast.error('Hata olustu.')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Kopyalandi!')
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Custom Domain
                    </CardTitle>
                    <CardDescription>
                        Kendi domain adresinizi baglayarak CRM platformunuza ozel URL ile erisim saglayin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {localDomain ? (
                        <>
                            <div className="p-4 rounded-lg border bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Globe className="h-5 w-5 text-blue-600" />
                                        <div>
                                            <p className="font-semibold text-lg">{localDomain}</p>
                                            <p className="text-xs text-muted-foreground">Aktif Custom Domain</p>
                                        </div>
                                    </div>
                                    {localVerified ? (
                                        <Badge className="bg-green-100 text-green-700 gap-1">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Vercel&apos;e Eklendi
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            DNS Bekleniyor
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {/* DNS Configuration - always show */}
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg border border-blue-200 bg-blue-50 space-y-3">
                                    <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        DNS Yapilandirmasi
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                        Asagidaki DNS kayitlarini domain saglayicinizin (Cloudflare, GoDaddy vb.) DNS ayarlarina ekleyin:
                                    </p>

                                    {/* Detect apex vs subdomain */}
                                    {(() => {
                                        const parts = localDomain.split('.')
                                        const isApex = parts.length <= 2 || (parts.length === 3 && parts[2] === 'tr')
                                        return (
                                            <div className="bg-white rounded-md border p-4 space-y-4">
                                                <div className="grid grid-cols-4 gap-3 text-xs font-medium text-muted-foreground border-b pb-2">
                                                    <span>Tur</span>
                                                    <span>Ad / Host</span>
                                                    <span>Deger / Content</span>
                                                    <span>Proxy</span>
                                                </div>
                                                {isApex ? (
                                                    <>
                                                        <div className="grid grid-cols-4 gap-3 text-sm items-center">
                                                            <span className="font-mono font-bold text-red-600">A</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono">@</span>
                                                                <button onClick={() => copyToClipboard('@')} className="text-muted-foreground hover:text-foreground">
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono font-semibold">76.76.21.21</span>
                                                                <button onClick={() => copyToClipboard('76.76.21.21')} className="text-muted-foreground hover:text-foreground">
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <span className="text-xs text-orange-600 font-medium">KAPALI (gri bulut)</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-3 text-sm items-center opacity-70">
                                                            <span className="font-mono font-bold">CNAME</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono">www</span>
                                                                <button onClick={() => copyToClipboard('www')} className="text-muted-foreground hover:text-foreground">
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="font-mono">cname.vercel-dns.com</span>
                                                                <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="text-muted-foreground hover:text-foreground">
                                                                    <Copy className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                            <span className="text-xs text-orange-600 font-medium">KAPALI</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground italic">* www kaydi opsiyoneldir (www yonlendirmesi icin)</p>
                                                    </>
                                                ) : (
                                                    <div className="grid grid-cols-4 gap-3 text-sm items-center">
                                                        <span className="font-mono font-bold">CNAME</span>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono">{parts[0]}</span>
                                                            <button onClick={() => copyToClipboard(parts[0])} className="text-muted-foreground hover:text-foreground">
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-mono">cname.vercel-dns.com</span>
                                                            <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="text-muted-foreground hover:text-foreground">
                                                                <Copy className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        <span className="text-xs text-orange-600 font-medium">KAPALI (gri bulut)</span>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {localVerification && localVerification.length > 0 && (
                                        <div className="bg-white rounded-md border p-4 space-y-2">
                                            <p className="text-xs font-medium text-muted-foreground">Ek Dogrulama Kaydi (Vercel):</p>
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

                                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-1">
                                        <p className="text-xs font-semibold text-orange-800">Onemli Notlar:</p>
                                        <ul className="text-xs text-orange-700 list-disc list-inside space-y-1">
                                            <li>Cloudflare kullaniyorsaniz <strong>Proxy (turuncu bulut) mutlaka KAPALI</strong> olmalidir</li>
                                            <li>DNS degisiklikleri 1-48 saat icerisinde yayilir</li>
                                            <li>SSL sertifikasi DNS yayildiktan sonra Vercel tarafindan otomatik olusturulur</li>
                                        </ul>
                                    </div>
                                </div>

                                <Button onClick={handleVerify} disabled={verifyLoading} variant="outline" className="gap-2">
                                    {verifyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    DNS Durumunu Kontrol Et
                                </Button>
                            </div>

                            <div className="pt-4 border-t">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2">
                                            <Trash2 className="h-4 w-4" />
                                            Domain Baglantisini Kaldir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Domain kaldirmak istediginize emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <strong>{localDomain}</strong> baglantisi kaldirilacak.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleRemove} className="bg-red-600 hover:bg-red-700" disabled={loading}>
                                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Kaldir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="custom-domain">Domain Adresi</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="custom-domain"
                                        placeholder="crm.firmaadi.com"
                                        value={domain}
                                        onChange={(e) => setDomain(e.target.value)}
                                        disabled={loading}
                                        className="flex-1"
                                    />
                                    <Button onClick={handleSetDomain} disabled={loading || !domain.trim()} className="gap-2 min-w-[140px]">
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                        Domain Ekle
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Ornek: <code className="bg-slate-100 px-1 rounded">crm.firmaadi.com</code> veya <code className="bg-slate-100 px-1 rounded">portal.firmaadi.com.tr</code>
                                </p>
                            </div>

                            <div className="p-4 rounded-lg border bg-blue-50/50 space-y-3">
                                <h4 className="font-semibold text-sm text-blue-800">Nasil Calisir?</h4>
                                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                                    <li>Yukariya kendi domain adresinizi girin</li>
                                    <li>Sistem size gerekli DNS kaydini gosterecek</li>
                                    <li>Domain saglayicinizda DNS kaydini ekleyin</li>
                                    <li>DNS yayilimi sonrasi domain otomatik aktif olacaktir</li>
                                    <li>SSL sertifikasi Vercel tarafindan ucretsiz saglanir</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
