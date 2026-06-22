'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    Phone, MessageSquare, Mail, Clock, Users, ChevronDown, ChevronUp,
    PlayCircle, FileText, ThumbsUp, ThumbsDown, Minus, ArrowRight,
    PhoneOff, PhoneIncoming, RefreshCw, AlertCircle, CheckCircle2, XCircle, DollarSign
} from 'lucide-react'
import { getDetailedCallLogs } from '../actions'

// ─── Types ───────────────────────────────────────────────────

const channelConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    ai_call: { icon: Phone, label: 'AI Arama', color: 'text-violet-400', bg: 'bg-violet-500/15 border-violet-500/30' },
    whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    sms: { icon: Mail, label: 'SMS', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
}

const outcomeConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    answered: { icon: PhoneIncoming, label: 'Cevaplandı', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
    converted: { icon: CheckCircle2, label: 'İlgilendi ✨', color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
    hung_up: { icon: PhoneOff, label: 'Açtı/Kapattı 📵', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
    no_answer: { icon: PhoneOff, label: 'Cevap Yok', color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
    busy: { icon: AlertCircle, label: 'Meşgul', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30' },
    sent: { icon: ArrowRight, label: 'Gönderildi', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30' },
    delivered: { icon: CheckCircle2, label: 'İletildi', color: 'text-cyan-400', bg: 'bg-cyan-500/15 border-cyan-500/30' },
    failed: { icon: XCircle, label: 'Başarısız', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
    skipped: { icon: Minus, label: 'Atlandı', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
    opted_out: { icon: XCircle, label: 'Ret', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30' },
    pending: { icon: Clock, label: 'Bekliyor', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30' },
}

// ─── Sentiment Analysis Helper ───────────────────────────────

function analyzeSentiment(log: any): { label: string; icon: any; color: string; suggestion: string } {
    const duration = log.call_duration_seconds || 0
    const status = log.status
    const outcome = log.call_outcome
    const transcript = (log.call_transcript || '').toLowerCase()

    if (status === 'converted' || outcome === 'success') {
        return { label: 'Çok İlgili', icon: ThumbsUp, color: 'text-green-400', suggestion: 'WhatsApp ile detay gönder, randevu planla' }
    }
    if (duration > 60 && (status === 'answered' || outcome === 'success')) {
        if (transcript.includes('fiyat') || transcript.includes('ödeme') || transcript.includes('kredi')) {
            return { label: 'İlgili (Fiyat Sordu)', icon: ThumbsUp, color: 'text-emerald-400', suggestion: 'Fiyat listesi ve ödeme planı WhatsApp ile gönder' }
        }
        return { label: 'İlgili', icon: ThumbsUp, color: 'text-emerald-400', suggestion: 'Tekrar ara veya WhatsApp ile takip et' }
    }
    if (duration > 30 && duration <= 60) {
        return { label: 'Ilımlı', icon: Minus, color: 'text-amber-400', suggestion: '2 gün sonra tekrar ara' }
    }
    if (duration > 0 && duration <= 30) {
        return { label: 'Açtı/Kapattı', icon: ThumbsDown, color: 'text-orange-400', suggestion: 'İlgisiz — 1 hafta sonra WhatsApp hatırlatma gönder' }
    }
    if (status === 'no_answer') {
        return { label: 'Ulaşılamadı', icon: PhoneOff, color: 'text-slate-400', suggestion: 'Farklı saatte tekrar ara (max 3 deneme)' }
    }
    if (status === 'busy') {
        return { label: 'Meşgul', icon: AlertCircle, color: 'text-amber-400', suggestion: '30 dakika sonra tekrar dene' }
    }
    return { label: 'Belirsiz', icon: Minus, color: 'text-slate-400', suggestion: 'Manuel değerlendirme gerekli' }
}

function formatDuration(seconds: number): string {
    if (!seconds) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}dk ${s}sn` : `${s}sn`
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Az önce'
    if (mins < 60) return `${mins}dk önce`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}sa önce`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}g önce`
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function formatFullDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

// ─── Component ───────────────────────────────────────────────

export function CallResultsPanel({ initialLogs }: { initialLogs: any[] }) {
    const [logs, setLogs] = useState(initialLogs)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [filterChannel, setFilterChannel] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [loading, setLoading] = useState(false)

    const handleRefresh = async () => {
        setLoading(true)
        const fresh = await getDetailedCallLogs(200)
        setLogs(fresh)
        setLoading(false)
    }

    const filtered = logs.filter(log => {
        if (filterChannel !== 'all' && log.channel !== filterChannel) return false
        if (filterStatus !== 'all' && log.status !== filterStatus) return false
        return true
    })

    // Stats
    const totalCalls = logs.filter(l => l.channel === 'ai_call').length
    const answered = logs.filter(l => l.status === 'answered' || l.status === 'converted').length
    const avgDuration = logs.filter(l => l.call_duration_seconds > 0).reduce((sum, l) => sum + l.call_duration_seconds, 0) / (logs.filter(l => l.call_duration_seconds > 0).length || 1)
    const totalCost = logs.reduce((sum, l) => sum + (l.cost_amount || 0), 0)

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MiniStat label="Toplam İletişim" value={logs.length} icon={Phone} color="violet" />
                <MiniStat label="Cevaplanan" value={answered} icon={PhoneIncoming} color="emerald" />
                <MiniStat label="Ort. Süre" value={formatDuration(Math.round(avgDuration))} icon={Clock} color="blue" />
                <MiniStat label="Dönüşüm" value={logs.filter(l => l.status === 'converted').length} icon={CheckCircle2} color="green" />
                <MiniStat label="Toplam Maliyet" value={`$${totalCost.toFixed(2)}`} icon={DollarSign} color="amber" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Kanallar</SelectItem>
                        <SelectItem value="ai_call">AI Arama</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Sonuçlar</SelectItem>
                        <SelectItem value="answered">Cevaplandı</SelectItem>
                        <SelectItem value="converted">İlgilendi</SelectItem>
                        <SelectItem value="hung_up">Açtı/Kapattı</SelectItem>
                        <SelectItem value="no_answer">Cevap Yok</SelectItem>
                        <SelectItem value="sent">Gönderildi</SelectItem>
                        <SelectItem value="failed">Başarısız</SelectItem>
                    </SelectContent>
                </Select>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading} className="gap-1.5 text-xs">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Results List */}
            {filtered.length === 0 ? (
                <Card className="bg-muted/30 p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <Phone className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Henüz arama/mesaj kaydı bulunmuyor.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filtered.map(log => (
                        <CallLogCard
                            key={log.id}
                            log={log}
                            isExpanded={expandedId === log.id}
                            onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Call Log Card ───────────────────────────────────────────

function CallLogCard({ log, isExpanded, onToggle }: { log: any; isExpanded: boolean; onToggle: () => void }) {
    const channel = channelConfig[log.channel] || channelConfig.ai_call
    const outcome = outcomeConfig[log.status] || outcomeConfig.pending
    const ChannelIcon = channel.icon
    const OutcomeIcon = outcome.icon
    const sentiment = log.channel === 'ai_call' ? analyzeSentiment(log) : null
    const SentimentIcon = sentiment?.icon || Minus

    const customer = log.outreach_executions?.customers || log.outreach_executions?.leads
    const project = log.outreach_executions?.sales?.projects?.name
    const workflow = log.outreach_executions?.outreach_workflows?.name

    return (
        <Card className={`transition-all ${isExpanded ? 'ring-1 ring-violet-500/30' : 'hover:bg-muted/30'}`}>
            {/* Main Row */}
            <div className="p-3 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center gap-3">
                    {/* Channel Icon */}
                    <div className={`p-2 rounded-lg border ${channel.bg}`}>
                        <ChannelIcon className={`h-4 w-4 ${channel.color}`} />
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{customer?.full_name || customer?.phone || 'Bilinmiyor'}</span>
                            {project && <Badge variant="outline" className="text-[10px] border-blue-500/30 text-blue-400">{project}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            {customer?.phone && <span>{customer.phone}</span>}
                            {workflow && <span>• {workflow}</span>}
                        </div>
                    </div>

                    {/* Call Duration (for calls) */}
                    {log.call_duration_seconds > 0 && (
                        <div className="text-right mr-2">
                            <p className="text-sm font-bold tabular-nums">{formatDuration(log.call_duration_seconds)}</p>
                            <p className="text-[10px] text-muted-foreground">süre</p>
                        </div>
                    )}

                    {/* Outcome Badge */}
                    <Badge variant="outline" className={`gap-1 text-[10px] border ${outcome.bg}`}>
                        <OutcomeIcon className={`h-3 w-3 ${outcome.color}`} />
                        {outcome.label}
                    </Badge>

                    {/* Sentiment (AI calls only) */}
                    {sentiment && (
                        <Badge variant="outline" className={`gap-1 text-[10px] ${sentiment.color}`}>
                            <SentimentIcon className="h-3 w-3" />
                            {sentiment.label}
                        </Badge>
                    )}

                    {/* Time */}
                    <span
                        className="text-[10px] text-muted-foreground whitespace-nowrap min-w-[70px] text-right"
                        title={log.executed_at ? formatFullDate(log.executed_at) : ''}
                    >
                        {log.executed_at ? timeAgo(log.executed_at) : '—'}
                    </span>

                    {/* Expand */}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="px-3 pb-4 pt-1 border-t space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left: Call Details */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arama Detayları</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <DetailItem label="Kanal" value={channel.label} />
                                <DetailItem label="Sonuç" value={outcome.label} />
                                <DetailItem label="Süre" value={formatDuration(log.call_duration_seconds)} />
                                <DetailItem label="Deneme" value={`${log.attempt_number || 1}. deneme`} />
                                {log.cost_amount && <DetailItem label="Maliyet" value={`$${log.cost_amount.toFixed(3)}`} />}
                                {log.error_message && <DetailItem label="Hata" value={log.error_message} className="col-span-2 text-red-400" />}
                            </div>

                            {/* Recording */}
                            {log.call_recording_url && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">Kayıt</p>
                                    <audio controls className="w-full h-8" src={log.call_recording_url}>
                                        <track kind="captions" />
                                    </audio>
                                </div>
                            )}

                            {/* AI Suggestion */}
                            {sentiment && (
                                <div className="p-3 rounded-lg bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                                    <p className="text-[10px] font-semibold text-violet-400 uppercase mb-1">🤖 AI Önerisi</p>
                                    <p className="text-xs">{sentiment.suggestion}</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Transcript / Message */}
                        <div className="space-y-3">
                            {log.call_summary && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Özet</h4>
                                    <p className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border">{log.call_summary}</p>
                                </div>
                            )}
                            {log.call_transcript && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <FileText className="h-3 w-3" /> Transkript
                                    </h4>
                                    <div className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border max-h-60 overflow-y-auto whitespace-pre-wrap">
                                        {log.call_transcript}
                                    </div>
                                </div>
                            )}
                            {log.message_content && !log.call_transcript && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mesaj</h4>
                                    <p className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border">{log.message_content}</p>
                                </div>
                            )}
                            {!log.call_transcript && !log.call_summary && !log.message_content && (
                                <div className="text-xs text-muted-foreground italic p-3">Henüz detay bilgisi yok.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

// ─── Sub-components ──────────────────────────────────────────

function DetailItem({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <div className={className}>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-medium">{value}</p>
        </div>
    )
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    const colors: Record<string, string> = {
        violet: 'from-violet-500/10 border-violet-500/20 text-violet-400',
        emerald: 'from-emerald-500/10 border-emerald-500/20 text-emerald-400',
        blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
        green: 'from-green-500/10 border-green-500/20 text-green-400',
        amber: 'from-amber-500/10 border-amber-500/20 text-amber-400',
    }
    return (
        <Card className={`bg-gradient-to-br ${colors[color]} border p-3`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold mt-0.5">{value}</p>
                </div>
                <Icon className="h-5 w-5 opacity-40" />
            </div>
        </Card>
    )
}
