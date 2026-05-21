'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    MessageSquare, Clock, Search, ChevronDown, ChevronUp,
    RefreshCw, CheckCircle2, AlertCircle, Sparkles, Flame, Snowflake, AlertTriangle, ArrowRight, User
} from 'lucide-react'
import { getWhatsAppResponses } from '../actions'

interface WhatsAppResponsesPanelProps {
    workflows: any[]
}

export function WhatsAppResponsesPanel({ workflows }: WhatsAppResponsesPanelProps) {
    const [responses, setResponses] = useState<any[]>([])
    const [total, setTotal] = useState(0)
    const [stats, setStats] = useState({ total: 0, hot: 0, warm: 0, notified: 0 })
    const [loading, setLoading] = useState(false)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    // Filtre durumları
    const [search, setSearch] = useState('')
    const [workflowId, setWorkflowId] = useState('all')
    const [interestLevel, setInterestLevel] = useState('all')
    const [notified, setNotified] = useState('all')
    const [page, setPage] = useState(1)
    const limit = 20

    const fetchResponses = async () => {
        setLoading(true)
        try {
            const res = await getWhatsAppResponses({
                search: search || undefined,
                workflowId: workflowId === 'all' ? undefined : workflowId,
                interestLevel: interestLevel === 'all' ? undefined : interestLevel,
                notified: notified === 'all' ? undefined : notified,
                page,
                limit
            })
            setResponses(res.data)
            setTotal(res.total)
            if (res.stats) {
                setStats(res.stats)
            }
        } catch (error) {
            console.error('Error fetching WhatsApp responses:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filtreler veya sayfa değiştiğinde verileri çek
    useEffect(() => {
        fetchResponses()
    }, [page, workflowId, interestLevel, notified])

    // Arama için Enter tuşuna basıldığında tetikle
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setPage(1)
            fetchResponses()
        }
    }

    const handleSearchClick = () => {
        setPage(1)
        fetchResponses()
    }

    const totalPages = Math.ceil(total / limit)

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Geri Dönüş Yapan" value={stats.total} icon={MessageSquare} color="blue" />
                <MiniStat label="Sıcak Lead (Hot) 🔥" value={stats.hot} icon={Flame} color="red" />
                <MiniStat label="Ilık Lead (Warm) 🌤️" value={stats.warm} icon={Sparkles} color="orange" />
                <MiniStat label="Bildirilen Hot" value={stats.notified} icon={CheckCircle2} color="green" />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border">
                {/* Search Input */}
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Input
                        placeholder="Müşteri Adı veya Telefonu... (Enter)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="h-8 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSearchClick} className="h-8 px-2">
                        <Search className="h-4 w-4" />
                    </Button>
                </div>

                {/* Workflow Filter */}
                <Select value={workflowId} onValueChange={(val) => { setWorkflowId(val); setPage(1) }}>
                    <SelectTrigger className="h-8 w-44 text-xs">
                        <SelectValue placeholder="Kampanya Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Kampanyalar</SelectItem>
                        {workflows.map((wf) => (
                            <SelectItem key={wf.id} value={wf.id}>{wf.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Interest Level Filter */}
                <Select value={interestLevel} onValueChange={(val) => { setInterestLevel(val); setPage(1) }}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Skor Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Skorlar</SelectItem>
                        <SelectItem value="hot">🔥 Hot (Sıcak)</SelectItem>
                        <SelectItem value="warm">🌤️ Warm (Ilık)</SelectItem>
                        <SelectItem value="cold">❄️ Cold (Soğuk)</SelectItem>
                        <SelectItem value="unknown">Bilinmeyen</SelectItem>
                    </SelectContent>
                </Select>

                {/* Notification Status Filter */}
                <Select value={notified} onValueChange={(val) => { setNotified(val); setPage(1) }}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Bildirim Durumu" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Bildirimler</SelectItem>
                        <SelectItem value="yes">Bildirildi</SelectItem>
                        <SelectItem value="no">Bildirilmedi</SelectItem>
                    </SelectContent>
                </Select>

                {/* Reset & Refresh */}
                <Button variant="outline" size="sm" onClick={fetchResponses} disabled={loading} className="gap-1.5 h-8 text-xs ml-auto">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Yenile
                </Button>
            </div>

            {/* Responses List */}
            {responses.length === 0 ? (
                <Card className="bg-muted/30 p-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">Filtrelere uygun WhatsApp geri dönüş kaydı bulunamadı.</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-2">
                    {responses.map((item) => (
                        <ResponseCard
                            key={item.id}
                            item={item}
                            isExpanded={expandedId === item.id}
                            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                        Toplam {total} kayıttan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} arası gösteriliyor
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(p - 1, 1))}
                            disabled={page === 1 || loading}
                            className="text-xs h-8"
                        >
                            Önceki
                        </Button>
                        <span className="text-xs font-medium px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                            disabled={page === totalPages || loading}
                            className="text-xs h-8"
                        >
                            Sonraki
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Response Card ───────────────────────────────────────────

function ResponseCard({ item, isExpanded, onToggle }: { item: any; isExpanded: boolean; onToggle: () => void }) {
    const interestConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
        hot: { label: 'Sıcak (Hot)', color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', icon: Flame },
        warm: { label: 'Ilık (Warm)', color: 'text-orange-400', bg: 'bg-orange-500/15 border-orange-500/30', icon: Sparkles },
        cold: { label: 'Soğuk (Cold)', color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', icon: Snowflake },
        disqualified: { label: 'Elendi', color: 'text-rose-400', bg: 'bg-rose-500/15 border-rose-500/30', icon: AlertTriangle },
        call_requested: { label: 'Arama İstiyor', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: CheckCircle2 },
        unknown: { label: 'Belirsiz', color: 'text-slate-400', bg: 'bg-slate-500/15 border-slate-500/30', icon: AlertCircle }
    }

    const interest = interestConfig[item.interest_level] || interestConfig.unknown
    const InterestIcon = interest.icon

    return (
        <Card className={`transition-all ${isExpanded ? 'ring-1 ring-emerald-500/30' : 'hover:bg-muted/30'}`}>
            {/* Main Row */}
            <div className="p-3 cursor-pointer" onClick={onToggle}>
                <div className="flex flex-wrap items-center gap-3">
                    {/* User Icon */}
                    <div className="p-2 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                        <User className="h-4 w-4" />
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate">{item.customer_name}</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">WhatsApp</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                            <span>{item.customer_phone}</span>
                            <span>• {item.workflow_name}</span>
                        </div>
                    </div>

                    {/* AI Score Badge */}
                    <Badge variant="outline" className={`gap-1 text-[10px] border ${interest.bg}`}>
                        <InterestIcon className={`h-3 w-3 ${interest.color}`} />
                        {interest.label}
                    </Badge>

                    {/* Notification Status Badge */}
                    {item.hot_lead_notified ? (
                        <Badge variant="outline" className="gap-1 text-[10px] border border-green-500/30 bg-green-500/15 text-green-400">
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                            Bildirildi
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="gap-1 text-[10px] border border-slate-500/30 bg-slate-500/15 text-slate-400">
                            <AlertCircle className="h-3 w-3 text-slate-400" />
                            Bildirilmedi
                        </Badge>
                    )}

                    {/* Last Message Time */}
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap min-w-[70px] text-right">
                        {item.last_message_at ? new Date(item.last_message_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>

                    {/* Expand */}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
            </div>

            {/* Expanded Detail */}
            {isExpanded && (
                <div className="px-3 pb-4 pt-2 border-t space-y-4 bg-muted/10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left side: Metadata & Logs */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Durum Bilgileri</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <DetailItem label="Müşteri Adı" value={item.customer_name} />
                                <DetailItem label="Müşteri Telefonu" value={item.customer_phone} />
                                <DetailItem label="Dahil Olduğu Kampanya" value={item.workflow_name} />
                                <DetailItem label="Yapay Zeka Skoru" value={interest.label} />
                                <DetailItem label="Yönetici Bildirim Durumu" value={item.hot_lead_notified ? 'Hot Lead olarak bildirim iletildi' : 'Bildirim iletilmedi'} />
                                <DetailItem label="Genel Durum" value={item.status} />
                            </div>
                        </div>

                        {/* Right side: AI Notes & Last Messages */}
                        <div className="space-y-3">
                            {item.call_notes && (
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">🤖 AI Gerekçe / Çağrı Notu</h4>
                                    <p className="text-xs leading-relaxed p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 whitespace-pre-line">
                                        {item.call_notes}
                                    </p>
                                </div>
                            )}
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">💬 Son Mesaj</h4>
                                <p className="text-xs leading-relaxed p-3 rounded-lg bg-muted/50 border italic">
                                    "{item.last_message_preview}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-xs font-medium mt-0.5">{value}</p>
        </div>
    )
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
    const colors: Record<string, string> = {
        blue: 'from-blue-500/10 border-blue-500/20 text-blue-400',
        red: 'from-red-500/10 border-red-500/20 text-red-400',
        orange: 'from-orange-500/10 border-orange-500/20 text-orange-400',
        green: 'from-green-500/10 border-green-500/20 text-green-400',
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
