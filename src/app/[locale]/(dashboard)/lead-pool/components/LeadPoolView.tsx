'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { assignLeadToAgent, updateRoutingRule } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Target, Users, Shuffle, Zap, Clock, UserCheck, AlertTriangle, Settings2
} from 'lucide-react'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface LeadPoolViewProps {
    leads: any[]
    agents: any[]
    currentRule: any | null
    userRole: string
}

const ROUTING_TYPES = [
    {
        value: 'round_robin',
        label: 'Sıralı Dağıtım (Round Robin)',
        description: 'Her yeni talep sıradaki danışmana otomatik atanır',
        icon: Shuffle,
        color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
        value: 'shark_tank',
        label: 'İlk Kapan Alır (Shark Tank)',
        description: 'Talep tüm ekibe bildirilir, ilk kabul eden alır',
        icon: Zap,
        color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
        value: 'manual',
        label: 'Manuel Atama',
        description: 'Yönetici talebi istediği danışmana kendisi atar',
        icon: UserCheck,
        color: 'text-slate-600 bg-slate-50 border-slate-200'
    },
]

export function LeadPoolView({ leads, agents, currentRule, userRole }: LeadPoolViewProps) {
    const router = useRouter()
    const [assigning, setAssigning] = useState<string | null>(null)
    const [selectedRoutingType, setSelectedRoutingType] = useState(currentRule?.routing_type || 'manual')
    const [timeoutMinutes, setTimeoutMinutes] = useState(currentRule?.timeout_minutes || 15)
    const [savingRule, setSavingRule] = useState(false)

    const isOwner = ['admin', 'owner'].includes(userRole)

    async function handleAssign(leadId: string, agentId: string) {
        setAssigning(leadId)
        try {
            await assignLeadToAgent(leadId, agentId)
            toast.success('Müşteri danışmana atandı!')
            router.refresh()
        } catch {
            toast.error('Atama başarısız')
        } finally {
            setAssigning(null)
        }
    }

    async function handleSaveRule() {
        setSavingRule(true)
        try {
            await updateRoutingRule(selectedRoutingType, timeoutMinutes)
            toast.success('Yönlendirme kuralı güncellendi')
            router.refresh()
        } catch {
            toast.error('Kural güncellenemedi')
        } finally {
            setSavingRule(false)
        }
    }

    // Time since creation
    function timeSince(dateStr: string) {
        const now = new Date()
        const created = new Date(dateStr)
        const diffMs = now.getTime() - created.getTime()
        const diffMin = Math.floor(diffMs / 60000)
        if (diffMin < 60) return `${diffMin} dk`
        const diffHr = Math.floor(diffMin / 60)
        if (diffHr < 24) return `${diffHr} saat`
        return `${Math.floor(diffHr / 24)} gün`
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-red-600">{leads.length}</span>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Atanmamış Talep</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-blue-600">{agents.length}</span>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Müsait Danışman</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Target className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-emerald-600">
                                {ROUTING_TYPES.find(r => r.value === (currentRule?.routing_type || 'manual'))?.label.split(' ')[0] || 'Manuel'}
                            </span>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Aktif Yönlendirme</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <span className="text-2xl font-black text-violet-600">{currentRule?.timeout_minutes || 15} dk</span>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">Zaman Aşımı</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Routing Settings */}
            {isOwner && (
                <Card className="border shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 pb-3">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-blue-600" />
                            Talep Yönlendirme Kuralı
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {ROUTING_TYPES.map((rt) => {
                                const RtIcon = rt.icon
                                return (
                                    <button
                                        key={rt.value}
                                        onClick={() => setSelectedRoutingType(rt.value)}
                                        className={cn(
                                            "flex flex-col gap-1.5 p-4 rounded-xl border-2 text-left transition-all",
                                            selectedRoutingType === rt.value
                                                ? "border-blue-500 bg-blue-50/50 shadow-sm"
                                                : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <RtIcon className="h-4 w-4" />
                                            <span className="text-xs font-bold">{rt.label}</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground leading-relaxed">{rt.description}</span>
                                    </button>
                                )
                            })}
                        </div>
                        {selectedRoutingType === 'shark_tank' && (
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                                <span className="text-xs font-bold text-slate-700">Zaman Aşımı (dk):</span>
                                <input
                                    type="number"
                                    value={timeoutMinutes}
                                    onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                                    min={1}
                                    max={120}
                                    className="h-9 w-20 px-3 border rounded-lg text-sm"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                    Danışman bu süre içinde kabul etmezse talep bir sonrakine geçer.
                                </span>
                            </div>
                        )}
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleSaveRule} disabled={savingRule} size="sm" className="font-bold text-xs">
                                {savingRule ? 'Kaydediliyor...' : 'Kuralı Kaydet'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Unassigned Leads Table */}
            <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50 pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Atanmamış Talepler
                        {leads.length > 0 && (
                            <Badge variant="destructive" className="text-[10px] ml-2">{leads.length}</Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50">
                                <TableHead>Müşteri</TableHead>
                                <TableHead>Telefon</TableHead>
                                <TableHead>Kaynak</TableHead>
                                <TableHead>Bekleme Süresi</TableHead>
                                <TableHead>Danışmana Ata</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.length > 0 ? leads.map((lead) => (
                                <TableRow key={lead.id} className="hover:bg-muted/30">
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm">{lead.full_name || '-'}</span>
                                            <span className="text-[10px] text-muted-foreground">{lead.email || '-'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">{lead.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px]">{lead.source || 'Bilinmiyor'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "text-xs font-bold",
                                            (() => {
                                                const mins = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 60000)
                                                if (mins < 15) return 'text-emerald-600'
                                                if (mins < 60) return 'text-amber-600'
                                                return 'text-red-600'
                                            })()
                                        )}>
                                            {timeSince(lead.created_at)}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Select onValueChange={(agentId) => handleAssign(lead.id, agentId)} disabled={assigning === lead.id}>
                                            <SelectTrigger className="h-8 w-[180px] text-xs">
                                                <SelectValue placeholder={assigning === lead.id ? 'Atanıyor...' : 'Danışman Seç'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {agents.map((agent) => (
                                                    <SelectItem key={agent.id} value={agent.id} className="text-xs">
                                                        {agent.full_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Target className="h-8 w-8 text-emerald-300" />
                                            <span className="font-medium">Tüm talepler atanmış!</span>
                                            <span className="text-xs">Şu anda bekleyen talep bulunmuyor.</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
