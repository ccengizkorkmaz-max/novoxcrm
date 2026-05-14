'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Globe, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, Copy, ExternalLink, Cloud, Key } from 'lucide-react'
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
import {
    setCustomDomain,
    checkDomainVerification,
    removeCustomDomain,
    checkDnsProvider,
    autoConfigureCloudflare,
    detectCloudflareZone,
} from '../actions/domain-actions'

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

    // Cloudflare state
    const [isCloudflare, setIsCloudflare] = useState(false)
    const [cfToken, setCfToken] = useState('')
    const [cfZoneId, setCfZoneId] = useState('')
    const [cfZoneName, setCfZoneName] = useState('')
    const [cfDetecting, setCfDetecting] = useState(false)
    const [cfConfiguring, setCfConfiguring] = useState(false)
    const [cfDone, setCfDone] = useState(false)

    const handleSetDomain = () => {
        if (!domain.trim()) {
            toast.error('Lutfen gecerli bir domain girin.')
            return
        }

        startTransition(async () => {
            const result = await setCustomDomain(domain.trim())
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Domain basariyla eklendi!')
                const cleanDomain = domain.trim().toLowerCase()
                setLocalDomain(cleanDomain)
                setLocalVerified(result.verified || false)
                setLocalVerification(result.verification || [])
                setDomain('')

                // Auto-detect DNS provider
                setCfDetecting(true)
                try {
                    const providerResult = await checkDnsProvider(cleanDomain)
                    if (providerResult.provider === 'cloudflare') {
                        setIsCloudflare(true)
                        toast.info('Cloudflare DNS algilandi! Otomatik yapilandirma yapabilirsiniz.')
                    }
                } catch {
                    // Silent fail
                } finally {
                    setCfDetecting(false)
                }
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
                toast.success('DNS dogrulandi! Domain aktif.')
                setLocalVerified(true)
                setLocalVerification([])
            } else {
                toast.warning('DNS henuz dogrulanmadi. Lutfen DNS kayitlarinizi kontrol edin.')
                setLocalVerification(result?.verification || [])
            }
        } catch {
            toast.error('Dogrulama kontrolu basarisiz oldu.')
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
                toast.success('Domain basariyla kaldirildi.')
                setLocalDomain(null)
                setLocalVerified(false)
                setLocalVerification([])
                setIsCloudflare(false)
                setCfDone(false)
                setCfToken('')
                setCfZoneId('')
            }
        })
    }

    const handleCfTokenSubmit = async () => {
        if (!cfToken.trim()) {
            toast.error('Cloudflare API Token gerekli.')
            return
        }

        setCfDetecting(true)
        try {
            // Auto-detect zone ID from token
            const zoneResult = await detectCloudflareZone(cfToken.trim(), localDomain || '')
            if (zoneResult.error) {
                toast.error('Zone algilanamadi: ' + zoneResult.error)
                return
            }

            if (zoneResult.zoneId) {
                setCfZoneId(zoneResult.zoneId)
                setCfZoneName(zoneResult.zoneName || '')
                toast.success(`Zone algilandi: ${zoneResult.zoneName}`)
            } else {
                toast.warning('Zone otomatik algılanamadi. Lutfen Zone ID girin.')
            }
        } catch {
            toast.error('Zone algilamasi basarisiz.')
        } finally {
            setCfDetecting(false)
        }
    }

    const handleCloudflareAutoConfig = async () => {
        if (!cfToken.trim() || !cfZoneId.trim() || !localDomain) {
            toast.error('API Token ve Zone ID gerekli.')
            return
        }

        setCfConfiguring(true)
        try {
            const result = await autoConfigureCloudflare(cfToken.trim(), cfZoneId.trim(), localDomain)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('DNS kaydi basariyla eklendi! Dogrulama birkac dakika surebilir.')
                setCfDone(true)

                // Auto-verify after a short delay
                setTimeout(async () => {
                    await handleVerify()
                }, 5000)
            }
        } catch {
            toast.error('DNS yapilandirmasi basarisiz.')
        } finally {
            setCfConfiguring(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Panoya kopyalandi!')
    }

    const handleRedetectCf = async () => {
        if (!localDomain) return
        setCfDetecting(true)
        try {
            const providerResult = await checkDnsProvider(localDomain)
            setIsCloudflare(providerResult.provider === 'cloudflare')
            if (providerResult.provider === 'cloudflare') {
                toast.info('Cloudflare DNS algilandi!')
            } else {
                toast.info('Cloudflare algılanmadi. Manuel DNS yapilandirmasi gerekli.')
            }
        } catch {
            // silent
        } finally {
            setCfDetecting(false)
        }
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
                                                Dogrulandi
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
                                        <span>Domain aktif ve SSL sertifikasi Vercel tarafindan saglaniyor.</span>
                                        <a
                                            href={`https://${localDomain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-auto flex items-center gap-1 text-green-800 hover:underline font-medium"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Ac
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* DNS Instructions (if not verified) */}
                            {!localVerified && (
                                <div className="space-y-4">
                                    {/* Cloudflare Auto-Config Section */}
                                    {(isCloudflare || cfDetecting) && !cfDone && (
                                        <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Cloud className="h-5 w-5 text-orange-600" />
                                                <h4 className="font-semibold text-orange-800">
                                                    {cfDetecting ? 'DNS saglayici algilaniyor...' : 'Cloudflare DNS Algilandi!'}
                                                </h4>
                                                {cfDetecting && <Loader2 className="h-4 w-4 animate-spin text-orange-600" />}
                                            </div>

                                            {!cfDetecting && (
                                                <>
                                                    <p className="text-sm text-orange-700">
                                                        Domain&apos;inizin DNS&apos;i Cloudflare tarafindan yonetiliyor.
                                                        API Token girerseniz CNAME kaydini otomatik olarak ekleyebiliriz.
                                                    </p>

                                                    <div className="bg-white rounded-md border p-4 space-y-3">
                                                        <div className="space-y-2">
                                                            <Label htmlFor="cf-token" className="flex items-center gap-1.5 text-sm font-medium">
                                                                <Key className="h-3.5 w-3.5" />
                                                                Cloudflare API Token
                                                            </Label>
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    id="cf-token"
                                                                    type="password"
                                                                    placeholder="Cloudflare API Token'iniz"
                                                                    value={cfToken}
                                                                    onChange={(e) => setCfToken(e.target.value)}
                                                                    disabled={cfConfiguring}
                                                                    className="flex-1"
                                                                />
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={handleCfTokenSubmit}
                                                                    disabled={!cfToken.trim() || cfDetecting}
                                                                    className="shrink-0"
                                                                >
                                                                    {cfDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zone Algila'}
                                                                </Button>
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground">
                                                                Cloudflare Dashboard &rarr; My Profile &rarr; API Tokens &rarr; Create Token &rarr;
                                                                &quot;Edit zone DNS&quot; sablonunu kullanin.
                                                            </p>
                                                        </div>

                                                        {cfZoneId && (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                    <span className="font-medium">Zone: {cfZoneName || cfZoneId}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!cfZoneId && cfToken && (
                                                            <div className="space-y-2">
                                                                <Label htmlFor="cf-zone" className="text-sm font-medium">Zone ID (manuel)</Label>
                                                                <Input
                                                                    id="cf-zone"
                                                                    placeholder="Cloudflare Zone ID"
                                                                    value={cfZoneId}
                                                                    onChange={(e) => setCfZoneId(e.target.value)}
                                                                    disabled={cfConfiguring}
                                                                />
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    Cloudflare Dashboard &rarr; Domain seciniz &rarr; Sag panelde &quot;Zone ID&quot;
                                                                </p>
                                                            </div>
                                                        )}

                                                        {(cfZoneId || cfToken) && (
                                                            <Button
                                                                onClick={handleCloudflareAutoConfig}
                                                                disabled={cfConfiguring || !cfToken.trim() || !cfZoneId.trim()}
                                                                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                                                            >
                                                                {cfConfiguring ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Cloud className="h-4 w-4" />
                                                                )}
                                                                DNS Kaydini Otomatik Ekle
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <p className="text-[11px] text-orange-600">
                                                        Not: API Token&apos;iniz sadece bu islem icin kullanilir ve saklanmaz.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Cloudflare Done */}
                                    {cfDone && (
                                        <div className="p-4 rounded-lg border border-green-200 bg-green-50 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                <h4 className="font-semibold text-green-800">Cloudflare DNS Yapilandirildi!</h4>
                                            </div>
                                            <p className="text-sm text-green-700">
                                                CNAME kaydi basariyla eklendi. SSL sertifikasi birkac dakika icinde aktif olacaktir.
                                            </p>
                                        </div>
                                    )}

                                    {/* Manual DNS Instructions */}
                                    <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-yellow-800 flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4" />
                                                {isCloudflare ? 'Manuel DNS Yapilandirmasi (alternatif)' : 'DNS Yapilandirmasi Gerekli'}
                                            </h4>
                                            {!isCloudflare && !cfDetecting && (
                                                <Button variant="ghost" size="sm" onClick={handleRedetectCf} className="text-xs h-7 gap-1">
                                                    <Cloud className="h-3 w-3" />
                                                    Cloudflare kontrol et
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-sm text-yellow-700">
                                            Asagidaki DNS kaydini domain saglayicinizin DNS ayarlarina ekleyin:
                                        </p>

                                        <div className="bg-white rounded-md border p-4 space-y-3">
                                            <div className="grid grid-cols-3 gap-4 text-xs font-medium text-muted-foreground">
                                                <span>Tur</span>
                                                <span>Ad / Host</span>
                                                <span>Deger / Target</span>
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

                                        {localVerification && localVerification.length > 0 && (
                                            <div className="bg-white rounded-md border p-4 space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground">Ek Dogrulama Kaydi (gerekli olabilir):</p>
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
                                            Not: DNS degisiklikleri 1-48 saat icerisinde yayilir. Cloudflare kullaniyorsaniz proxy&apos;yi (turuncu bulut) kapatin.
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
                                            Domain Baglantisini Kaldir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Domain baglantisini kaldirmak istediginize emin misiniz?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <strong>{localDomain}</strong> domain baglantisi kaldirilacak ve platformunuza bu adres uzerinden erisilemeyecektir.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Vazgec</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleRemove}
                                                className="bg-red-600 hover:bg-red-700"
                                                disabled={isPending}
                                            >
                                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Kaldir
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
                                        Ornek: <code className="bg-slate-100 px-1 rounded">crm.firmaadi.com</code> veya <code className="bg-slate-100 px-1 rounded">portal.firmaadi.com.tr</code>
                                    </p>
                                </div>

                                {/* How it works */}
                                <div className="p-4 rounded-lg border bg-blue-50/50 space-y-3">
                                    <h4 className="font-semibold text-sm text-blue-800">Nasil Calisir?</h4>
                                    <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
                                        <li>Yukariya kendi domain adresinizi girin</li>
                                        <li>Sistem DNS saglayicinizi otomatik algilar</li>
                                        <li>Cloudflare kullaniyorsaniz DNS kaydi otomatik eklenir</li>
                                        <li>Diger saglayicilar icin size gerekli DNS kaydini gosterir</li>
                                        <li>SSL sertifikasi Vercel tarafindan ucretsiz saglanir</li>
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
