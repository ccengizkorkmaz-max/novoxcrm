'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, Send, CheckCircle2, AlertTriangle, Loader2, ExternalLink, FileText, RefreshCw } from 'lucide-react'

export default function SeoSettingsTab() {
    const [indexNowLoading, setIndexNowLoading] = useState(false)
    const [sitemapLoading, setSitemapLoading] = useState(false)
    const [indexNowResult, setIndexNowResult] = useState<any>(null)
    const [sitemapResult, setSitemapResult] = useState<any>(null)

    const handleIndexNow = async () => {
        setIndexNowLoading(true)
        setIndexNowResult(null)
        try {
            const res = await fetch('/api/indexnow', { method: 'GET' })
            const data = await res.json()
            setIndexNowResult(data)
        } catch (err: any) {
            setIndexNowResult({ error: err.message })
        } finally {
            setIndexNowLoading(false)
        }
    }

    const handleSitemapSubmit = async () => {
        setSitemapLoading(true)
        setSitemapResult(null)
        try {
            const res = await fetch('/api/seo/submit-sitemap', { method: 'POST' })
            const data = await res.json()
            setSitemapResult(data)
        } catch (err: any) {
            setSitemapResult({ error: err.message })
        } finally {
            setSitemapLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-blue-600" />
                        SEO & Arama Motoru Ayarları
                    </CardTitle>
                    <CardDescription>
                        Google Search Console, IndexNow ve sitemap yönetimi
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50 border-emerald-200">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-900">Sitemap</p>
                                <a href="https://novoxcrm.com/sitemap.xml" target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1">
                                    novoxcrm.com/sitemap.xml <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-emerald-50 border-emerald-200">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-emerald-900">Robots.txt</p>
                                <a href="https://novoxcrm.com/robots.txt" target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1">
                                    novoxcrm.com/robots.txt <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 border-blue-200">
                            <Globe className="h-5 w-5 text-blue-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900">Search Console</p>
                                <a href="https://search.google.com/search-console?resource_id=https://novoxcrm.com" target="_blank" rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1">
                                    Console'u Aç <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Google Search Console - Sitemap Submit */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Google Sitemap Gönderimi
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Google Search Console API üzerinden sitemap'i tekrar gönder
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleSitemapSubmit}
                            disabled={sitemapLoading}
                            size="sm"
                            className="gap-2"
                        >
                            {sitemapLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {sitemapLoading ? 'Gönderiliyor...' : 'Sitemap Gönder'}
                        </Button>
                    </div>
                </CardHeader>
                {sitemapResult && (
                    <CardContent>
                        <div className={`p-3 rounded-lg border ${sitemapResult.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {sitemapResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-sm font-medium">
                                    {sitemapResult.success
                                        ? '✅ Sitemap başarıyla Google Search Console\'a gönderildi!'
                                        : `❌ Hata: ${sitemapResult.error}`
                                    }
                                </p>
                            </div>
                            {sitemapResult.sitemaps && (
                                <div className="mt-3 space-y-2">
                                    <p className="text-xs font-semibold">Kayıtlı Sitemap'ler:</p>
                                    {sitemapResult.sitemaps.map((sm: any, i: number) => (
                                        <div key={i} className="text-xs flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px]">{sm.path}</Badge>
                                            <span>Son indirme: {sm.lastDownloaded || 'Bekliyor'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* IndexNow */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-purple-600" />
                                IndexNow — Anlık İndeksleme
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Bing, Yandex ve diğer arama motorlarına tüm URL'leri anında bildir (IndexNow protokolü)
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleIndexNow}
                            disabled={indexNowLoading}
                            size="sm"
                            variant="outline"
                            className="gap-2"
                        >
                            {indexNowLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                            {indexNowLoading ? 'Gönderiliyor...' : 'IndexNow Gönder'}
                        </Button>
                    </div>
                </CardHeader>
                {indexNowResult && (
                    <CardContent>
                        <div className={`p-3 rounded-lg border ${indexNowResult.success
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                            }`}>
                            <div className="flex items-center gap-2">
                                {indexNowResult.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-sm font-medium">
                                    {indexNowResult.success
                                        ? `✅ ${indexNowResult.totalUrls} URL başarıyla gönderildi!`
                                        : `❌ Hata: ${indexNowResult.error || 'Bilinmeyen hata'}`
                                    }
                                </p>
                            </div>
                            {indexNowResult.results && (
                                <div className="mt-2 space-y-1">
                                    {indexNowResult.results.map((r: any, i: number) => (
                                        <p key={i} className="text-xs">
                                            Batch {r.batchIndex + 1}: {r.count} URL → HTTP {r.status} {r.statusText}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Service Account Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">🔑 Google Service Account</CardTitle>
                    <CardDescription>
                        Google Search Console API erişimi için kullanılan servis hesabı bilgileri
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg border bg-slate-50">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Service Account Email</p>
                                <p className="text-xs font-mono text-slate-700 mt-1 break-all">
                                    novoxcrmservice@gen-lang-client-0849039006.iam.gserviceaccount.com
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border bg-slate-50">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Project ID</p>
                                <p className="text-xs font-mono text-slate-700 mt-1">
                                    gen-lang-client-0849039006
                                </p>
                            </div>
                        </div>
                        <div className="p-3 rounded-lg border bg-amber-50 border-amber-200">
                            <p className="text-xs text-amber-800">
                                <strong>Not:</strong> Bu servis hesabının Google Search Console'da <strong>novoxcrm.com</strong> property'sine
                                Owner olarak eklenmiş olması gerekmektedir. Ayrıca Google Cloud projesinde
                                <a href="https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=16158435903"
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-amber-900 underline font-semibold ml-1">
                                    Search Console API aktif
                                </a> olmalıdır.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
