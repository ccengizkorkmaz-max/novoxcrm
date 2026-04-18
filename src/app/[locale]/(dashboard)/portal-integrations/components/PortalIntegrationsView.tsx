'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { generatePortfolioFeed } from '../actions'
import { toast } from 'sonner'
import {
    Globe, Download, RefreshCw, Settings, ExternalLink,
    CheckCircle, AlertTriangle, Clock, FileText, Code,
    Copy, Loader2, Info
} from 'lucide-react'

interface Props {
    portals: any[]
    activePortfolioCount: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    not_configured: { label: 'Yapılandırılmadı', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Settings },
    pending: { label: 'Bekleniyor', color: 'bg-amber-100 text-amber-600 border-amber-200', icon: Clock },
    active: { label: 'Aktif', color: 'bg-emerald-100 text-emerald-600 border-emerald-200', icon: CheckCircle },
    error: { label: 'Hata', color: 'bg-red-100 text-red-600 border-red-200', icon: AlertTriangle },
}

export function PortalIntegrationsView({ portals, activePortfolioCount }: Props) {
    const [generating, setGenerating] = useState(false)
    const [feedData, setFeedData] = useState<string | null>(null)
    const [feedFormat, setFeedFormat] = useState<'xml' | 'json'>('xml')

    async function handleGenerateFeed(format: 'xml' | 'json') {
        setGenerating(true)
        try {
            const result = await generatePortfolioFeed(format)
            if (result.success && result.data) {
                setFeedData(result.data)
                setFeedFormat(format)
                toast.success(`${result.count} portföy ${format.toUpperCase()} olarak oluşturuldu`)
            } else {
                toast.error(result.error || 'Feed oluşturulamadı')
            }
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setGenerating(false)
        }
    }

    function downloadFeed() {
        if (!feedData) return
        const blob = new Blob([feedData], { type: feedFormat === 'xml' ? 'application/xml' : 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `portfolios_feed.${feedFormat}`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Dosya indirildi')
    }

    function copyFeed() {
        if (!feedData) return
        navigator.clipboard.writeText(feedData)
        toast.success('Panoya kopyalandı')
    }

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <Card className="border border-blue-200 bg-blue-50/50 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 space-y-1">
                            <p className="font-bold">İlan Portalı Entegrasyon Bilgilendirmesi</p>
                            <p>Sahibinden.com ve Hepsiemlak gibi platformlar herkese açık API sunmuyor. Entegrasyon için:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li><strong>Sahibinden:</strong> Kurumsal hesap ile XML feed aktarımı desteklenir. API için kurumsal@sahibinden.com</li>
                                <li><strong>Hepsiemlak:</strong> Ortaklık sözleşmesi gereklidir. İletişim: kurumsal@hepsiemlak.com</li>
                                <li><strong>Emlakjet:</strong> REST API mevcuttur. Kurumsal hesap ile erişim sağlanabilir.</li>
                            </ul>
                            <p className="font-medium mt-2">📤 Şu anda: Portföylerinizi XML/JSON feed olarak dışa aktarıp manuel olarak portallara yükleyebilirsiniz.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Portal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portals.map(portal => {
                    const sc = STATUS_CONFIG[portal.apiStatus] || STATUS_CONFIG.not_configured
                    const StatusIcon = sc.icon
                    return (
                        <Card key={portal.id} className="border shadow-sm hover:shadow-md transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <span className="text-xl">{portal.logo}</span>
                                        {portal.name}
                                    </CardTitle>
                                    <Badge className={cn("text-[9px] border font-bold gap-1", sc.color)}>
                                        <StatusIcon className="h-2.5 w-2.5" /> {sc.label}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex flex-wrap gap-1.5">
                                    {portal.supportsFeed && (
                                        <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-200">XML Feed</Badge>
                                    )}
                                    {portal.supportsApi && (
                                        <Badge variant="outline" className="text-[9px] bg-emerald-50 text-emerald-600 border-emerald-200">REST API</Badge>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground">{portal.notes}</p>
                                <div className="flex items-center gap-2 pt-2 border-t">
                                    <a href={portal.website} target="_blank" rel="noopener noreferrer">
                                        <Button variant="outline" size="sm" className="text-[10px] gap-1">
                                            <ExternalLink className="h-3 w-3" /> Siteye Git
                                        </Button>
                                    </a>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Feed Generator */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Code className="h-4 w-4 text-violet-500" />
                        Portföy Feed Oluşturucu
                        <Badge variant="outline" className="text-[10px] ml-auto">{activePortfolioCount} aktif portföy</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Aktif portföylerinizi XML veya JSON formatında dışa aktarın. Bu dosyayı ilan portallarına manuel olarak yükleyebilir veya API entegrasyonu için kullanabilirsiniz.
                    </p>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => handleGenerateFeed('xml')}
                            disabled={generating || activePortfolioCount === 0}
                            className="text-xs gap-1.5 bg-violet-600 hover:bg-violet-700"
                        >
                            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                            XML Feed Oluştur
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleGenerateFeed('json')}
                            disabled={generating || activePortfolioCount === 0}
                            className="text-xs gap-1.5"
                        >
                            <Code className="h-3.5 w-3.5" /> JSON Feed
                        </Button>
                    </div>

                    {feedData && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="text-xs gap-1" onClick={downloadFeed}>
                                    <Download className="h-3 w-3" /> İndir (.{feedFormat})
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={copyFeed}>
                                    <Copy className="h-3 w-3" /> Kopyala
                                </Button>
                            </div>
                            <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-[10px] overflow-x-auto max-h-96 font-mono leading-relaxed">
                                {feedData.slice(0, 3000)}{feedData.length > 3000 ? '\n\n... (kırpıldı)' : ''}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
