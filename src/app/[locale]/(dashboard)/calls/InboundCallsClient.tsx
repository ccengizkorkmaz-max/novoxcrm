'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
    PhoneIncoming, Clock, User, Search, Play, Pause, ExternalLink,
    PhoneCall, Flame, Thermometer, Snowflake, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Link } from '@/i18n/routing'

interface CallRecord {
    id: string
    customer_id: string
    customer_name: string
    customer_phone: string
    date: string
    duration: number
    outcome: string
    lead_score: string | null
    summary: string
    transcript: string
    recording_url: string | null
    cost: number | null
}

interface InboundCallsClientProps {
    calls: CallRecord[]
    totalCount: number
    page: number
    pageSize: number
}

function formatDuration(seconds: number): string {
    if (!seconds) return '-'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}dk ${s}sn` : `${s}sn`
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

function LeadScoreBadge({ score }: { score: string | null }) {
    if (!score) return <Badge variant="outline" className="text-slate-500 border-slate-200">—</Badge>
    
    const config: Record<string, { icon: any; className: string; label: string }> = {
        hot: { icon: Flame, className: 'bg-red-50 text-red-700 border-red-200', label: 'Sıcak' },
        warm: { icon: Thermometer, className: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Ilık' },
        follow_up: { icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Takip' },
        cold: { icon: Snowflake, className: 'bg-slate-50 text-slate-600 border-slate-200', label: 'Soğuk' },
        disqualified: { icon: AlertCircle, className: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Uygun Değil' },
    }
    
    const c = config[score] || config.cold!
    const Icon = c.icon
    
    return (
        <Badge variant="outline" className={`font-medium ${c.className}`}>
            <Icon className="h-3 w-3 mr-1" />
            {c.label}
        </Badge>
    )
}

function OutcomeBadge({ outcome }: { outcome: string }) {
    const config: Record<string, string> = {
        'Success': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Failed': 'bg-red-50 text-red-600 border-red-200',
        'No Answer': 'bg-slate-50 text-slate-500 border-slate-200',
        'Busy': 'bg-amber-50 text-amber-600 border-amber-200',
    }
    return (
        <Badge variant="outline" className={`font-medium ${config[outcome] || ''}`}>
            {outcome === 'Success' ? 'Görüşme' : outcome === 'Failed' ? 'Başarısız' : outcome === 'No Answer' ? 'Cevaplanmadı' : outcome === 'Busy' ? 'Meşgul' : outcome}
        </Badge>
    )
}

export default function InboundCallsClient({ calls, totalCount, page, pageSize }: InboundCallsClientProps) {
    const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)

    const totalPages = Math.ceil(totalCount / pageSize)

    const filteredCalls = searchTerm.trim()
        ? calls.filter(c =>
            c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.customer_phone.includes(searchTerm)
        )
        : calls

    // Stats
    const todayCalls = calls.filter(c => {
        const d = new Date(c.date)
        const today = new Date()
        return d.toDateString() === today.toDateString()
    }).length
    const successCalls = calls.filter(c => c.outcome === 'Success').length
    const hotLeads = calls.filter(c => c.lead_score === 'hot').length

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-blue-50">
                            <PhoneIncoming className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{totalCount}</p>
                            <p className="text-xs text-slate-500">Toplam Arama</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-emerald-50">
                            <PhoneCall className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{todayCalls}</p>
                            <p className="text-xs text-slate-500">Bugün</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-amber-50">
                            <Flame className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{hotLeads}</p>
                            <p className="text-xs text-slate-500">Sıcak Lead</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-purple-50">
                            <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{successCalls}</p>
                            <p className="text-xs text-slate-500">Başarılı Görüşme</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Table */}
            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <PhoneIncoming className="h-5 w-5 text-emerald-600" />
                            Gelen Aramalar
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Ad veya telefon ara..."
                                className="pl-9 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead className="w-[250px]">Arayan</TableHead>
                                <TableHead>Tarih / Saat</TableHead>
                                <TableHead>Süre</TableHead>
                                <TableHead>Sonuç</TableHead>
                                <TableHead>Lead Skoru</TableHead>
                                <TableHead className="text-right">Kayıt</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCalls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <PhoneIncoming className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p>Henüz gelen arama kaydı yok</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCalls.map((call) => (
                                    <TableRow
                                        key={call.id}
                                        className="cursor-pointer hover:bg-slate-50/80 transition-colors"
                                        onClick={() => setSelectedCall(call)}
                                    >
                                        <TableCell>
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold text-xs">
                                                    {call.customer_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 text-sm">{call.customer_name}</p>
                                                    <p className="text-xs text-slate-400">{call.customer_phone}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">{formatDate(call.date)}</TableCell>
                                        <TableCell className="text-sm text-slate-600 font-mono">{formatDuration(call.duration)}</TableCell>
                                        <TableCell><OutcomeBadge outcome={call.outcome} /></TableCell>
                                        <TableCell><LeadScoreBadge score={call.lead_score} /></TableCell>
                                        <TableCell className="text-right">
                                            {call.recording_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (playingAudio === call.id) {
                                                            setPlayingAudio(null)
                                                        } else {
                                                            setPlayingAudio(call.id)
                                                        }
                                                    }}
                                                >
                                                    {playingAudio === call.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-xs text-slate-500">{totalCount} aramadan {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} gösteriliyor</p>
                            <div className="flex items-center gap-1">
                                <Link href={`/calls?page=${Math.max(1, page - 1)}`}>
                                    <Button variant="outline" size="sm" disabled={page <= 1} className="h-8">
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                                <Link href={`/calls?page=${Math.min(totalPages, page + 1)}`}>
                                    <Button variant="outline" size="sm" disabled={page >= totalPages} className="h-8">
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Call Detail Modal */}
            <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    {selectedCall && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <PhoneIncoming className="h-5 w-5 text-emerald-600" />
                                    Arama Detayı
                                </DialogTitle>
                                <DialogDescription>
                                    {formatDate(selectedCall.date)} • {formatDuration(selectedCall.duration)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5">
                                {/* Caller Info */}
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                        {selectedCall.customer_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-900">{selectedCall.customer_name}</p>
                                        <p className="text-sm text-slate-500">{selectedCall.customer_phone}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <OutcomeBadge outcome={selectedCall.outcome} />
                                        <LeadScoreBadge score={selectedCall.lead_score} />
                                    </div>
                                    <Link href={`/crm?customer=${selectedCall.customer_id}`}>
                                        <Button variant="outline" size="sm" className="gap-1.5">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Müşteri
                                        </Button>
                                    </Link>
                                </div>

                                {/* Recording */}
                                {selectedCall.recording_url && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700">🎵 Ses Kaydı</p>
                                        <audio controls className="w-full" src={selectedCall.recording_url}>
                                            Tarayıcınız ses oynatmayı desteklemiyor.
                                        </audio>
                                    </div>
                                )}

                                {/* Summary */}
                                {selectedCall.summary && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700">📋 AI Özeti</p>
                                        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-slate-700 leading-relaxed">
                                            {selectedCall.summary}
                                        </div>
                                    </div>
                                )}

                                {/* Transcript */}
                                {selectedCall.transcript && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-700">📝 Transkript</p>
                                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-mono text-xs">
                                            {selectedCall.transcript}
                                        </div>
                                    </div>
                                )}

                                {/* Cost */}
                                {selectedCall.cost != null && selectedCall.cost > 0 && (
                                    <p className="text-xs text-slate-400">Maliyet: ${selectedCall.cost.toFixed(4)}</p>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
