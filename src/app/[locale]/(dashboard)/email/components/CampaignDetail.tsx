'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    ArrowLeft, Send, Eye, MousePointerClick, AlertTriangle, RefreshCw,
    CheckCircle2, XCircle, Clock, Mail, Users, BarChart3, Loader2
} from 'lucide-react'
import { useRouter } from '@/i18n/routing'
import { getCampaignSends, launchCampaign } from '../actions'
import { toast } from 'sonner'

export function CampaignDetail({ campaign }: { campaign: any }) {
    const [sends, setSends] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [launching, setLaunching] = useState(false)
    const router = useRouter()

    useEffect(() => {
        getCampaignSends(campaign.id).then(s => { setSends(s); setLoading(false) })
    }, [campaign.id])

    const openRate = campaign.total_sent > 0 ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1) : '0'
    const clickRate = campaign.total_opened > 0 ? ((campaign.total_clicked / campaign.total_opened) * 100).toFixed(1) : '0'
    const bounceRate = campaign.total_sent > 0 ? ((campaign.total_bounced / campaign.total_sent) * 100).toFixed(1) : '0'

    const statusIcon = (status: string) => {
        const map: Record<string, React.ReactNode> = {
            sent: <CheckCircle2 className="h-3 w-3 text-emerald-400" />,
            delivered: <CheckCircle2 className="h-3 w-3 text-blue-400" />,
            opened: <Eye className="h-3 w-3 text-purple-400" />,
            clicked: <MousePointerClick className="h-3 w-3 text-amber-400" />,
            bounced: <XCircle className="h-3 w-3 text-red-400" />,
            complained: <AlertTriangle className="h-3 w-3 text-red-500" />,
            failed: <XCircle className="h-3 w-3 text-red-400" />,
            pending: <Clock className="h-3 w-3 text-slate-400" />,
        }
        return map[status] || map.pending
    }

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            sent: 'Gönderildi', delivered: 'Teslim', opened: 'Açıldı',
            clicked: 'Tıklandı', bounced: 'Bounce', complained: 'Şikayet',
            failed: 'Başarısız', pending: 'Bekliyor',
        }
        return map[status] || status
    }

    const handleLaunch = async () => {
        setLaunching(true)
        const res = await launchCampaign(campaign.id)
        setLaunching(false)
        if (res.error) toast.error(res.error)
        else {
            toast.success(`✅ ${'sent' in res ? res.sent : 0} email gönderildi!`)
            router.refresh()
        }
    }

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push('/email')} className="gap-1 text-xs">
                        <ArrowLeft className="h-3.5 w-3.5" /> Geri
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Mail className="h-5 w-5 text-blue-400" />
                            {campaign.name}
                        </h1>
                        <p className="text-xs text-muted-foreground">{campaign.subject}</p>
                    </div>
                </div>
                {campaign.status === 'draft' && (
                    <Button onClick={handleLaunch} disabled={launching} className="gap-1 bg-blue-600 hover:bg-blue-700">
                        {launching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        {launching ? 'Gönderiliyor...' : 'Kampanyayı Gönder'}
                    </Button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <Card className="p-3 text-center bg-blue-500/5 border-blue-500/20">
                    <Users className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.total_recipients}</p>
                    <p className="text-[9px] text-muted-foreground">Alıcı</p>
                </Card>
                <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
                    <Send className="h-4 w-4 mx-auto text-emerald-400 mb-1" />
                    <p className="text-lg font-bold">{campaign.total_sent}</p>
                    <p className="text-[9px] text-muted-foreground">Gönderildi</p>
                </Card>
                <Card className="p-3 text-center bg-purple-500/5 border-purple-500/20">
                    <Eye className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                    <p className="text-lg font-bold">{openRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Açılma</p>
                </Card>
                <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
                    <MousePointerClick className="h-4 w-4 mx-auto text-amber-400 mb-1" />
                    <p className="text-lg font-bold">{clickRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Tıklanma</p>
                </Card>
                <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
                    <XCircle className="h-4 w-4 mx-auto text-red-400 mb-1" />
                    <p className="text-lg font-bold">{bounceRate}%</p>
                    <p className="text-[9px] text-muted-foreground">Bounce</p>
                </Card>
                <Card className="p-3 text-center bg-red-600/5 border-red-600/20">
                    <AlertTriangle className="h-4 w-4 mx-auto text-red-500 mb-1" />
                    <p className="text-lg font-bold">{campaign.total_complained}</p>
                    <p className="text-[9px] text-muted-foreground">Şikayet</p>
                </Card>
            </div>

            {/* Meta Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <Card className="p-3">
                    <span className="text-muted-foreground block">Durum</span>
                    <Badge variant="outline" className="mt-1">{campaign.status}</Badge>
                </Card>
                <Card className="p-3">
                    <span className="text-muted-foreground block">Şablon</span>
                    <span className="font-medium">{campaign.email_templates?.name || '—'}</span>
                </Card>
                <Card className="p-3">
                    <span className="text-muted-foreground block">Segment</span>
                    <span className="font-medium">{campaign.outreach_segments?.name || '—'}</span>
                </Card>
                <Card className="p-3">
                    <span className="text-muted-foreground block">Gönderim</span>
                    <span className="font-medium">{campaign.sent_at ? new Date(campaign.sent_at).toLocaleString('tr-TR') : '—'}</span>
                </Card>
            </div>

            {/* Sends Table */}
            <div>
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    Gönderim Detayları ({sends.length})
                </h3>
                {loading ? (
                    <Card className="p-6 text-center text-muted-foreground text-sm">Yükleniyor...</Card>
                ) : sends.length === 0 ? (
                    <Card className="p-6 text-center border-dashed text-muted-foreground text-sm">
                        Henüz gönderim yok
                    </Card>
                ) : (
                    <div className="space-y-1 max-h-[500px] overflow-y-auto">
                        {sends.map(s => (
                            <Card key={s.id} className="p-2 flex items-center gap-3 text-xs">
                                {statusIcon(s.status)}
                                <span className="font-mono text-[10px] min-w-[180px]">{s.email}</span>
                                <span className="text-muted-foreground truncate flex-1">{s.customers?.full_name || '—'}</span>
                                <Badge variant="outline" className="text-[9px]">{statusLabel(s.status)}</Badge>
                                {s.opened_at && (
                                    <span className="text-[9px] text-purple-400">
                                        Açıldı: {new Date(s.opened_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {s.error_message && (
                                    <span className="text-[9px] text-red-400 truncate max-w-[150px]">{s.error_message}</span>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
