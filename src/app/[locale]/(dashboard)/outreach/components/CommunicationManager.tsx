'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { PhoneOff, Phone, Search, Trash2, Plus, RefreshCw, Shield, ShieldOff, Users, History } from 'lucide-react'
import { toast } from 'sonner'
import { getOptouts, removeOptout, addOptout, getOptoutLogs } from '../actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface OptoutRecord {
    id: string
    phone: string
    channel: string
    reason: string | null
    created_at: string
    customer_id: string | null
}

interface BlockedCustomer {
    id: string
    full_name: string
    phone: string | null
    communication_enabled: boolean
}

export function CommunicationManager({ tenantId }: { tenantId: string }) {
    const [optouts, setOptouts] = useState<OptoutRecord[]>([])
    const [blockedCustomers, setBlockedCustomers] = useState<BlockedCustomer[]>([])
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [addOpen, setAddOpen] = useState(false)
    const [newPhone, setNewPhone] = useState('')
    const [newChannel, setNewChannel] = useState('all')
    const [newReason, setNewReason] = useState('')
    const [adding, setAdding] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            const [res, logsRes] = await Promise.all([getOptouts(), getOptoutLogs()])
            setOptouts(res || [])
            setLogs(logsRes || [])
            // Blocked customers
            const blockedRes = await fetch('/api/admin/blocked-customers')
            if (blockedRes.ok) {
                const data = await blockedRes.json()
                setBlockedCustomers(data || [])
            }
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }, [])

    useEffect(() => { loadData() }, [loadData])

    const handleRemoveOptout = async (id: string) => {
        await removeOptout(id)
        setOptouts(prev => prev.filter(o => o.id !== id))
        toast.success('Opt-out kaldırıldı')
    }

    const handleAdd = async () => {
        if (!newPhone.trim()) return toast.error('Telefon numarası gerekli')
        setAdding(true)
        await addOptout('', newPhone.trim(), newChannel, newReason || 'Manuel eklendi')
        setAdding(false)
        setAddOpen(false)
        setNewPhone('')
        setNewReason('')
        toast.success('Opt-out eklendi')
        loadData()
    }

    const handleToggleComm = async (customerId: string, enabled: boolean) => {
        setTogglingId(customerId)
        try {
            const { toggleCommunication } = await import('@/app/[locale]/(dashboard)/crm/actions')
            const res = await toggleCommunication(customerId, enabled)
            if (res.error) {
                toast.error(res.error)
            } else {
                setBlockedCustomers(prev => 
                    enabled 
                        ? prev.filter(c => c.id !== customerId)
                        : prev
                )
                toast.success(enabled ? 'İletişim açıldı' : 'İletişim kapatıldı')
                loadData()
            }
        } catch (e: any) {
            toast.error(e.message)
        }
        setTogglingId(null)
    }

    const channelLabel: Record<string, string> = {
        all: 'Tümü',
        ai_call: 'AI Arama',
        whatsapp: 'WhatsApp',
        sms: 'SMS',
        email: 'E-posta',
    }

    const sourceLabel: Record<string, string> = {
        manual: 'Manuel',
        ai_call: 'Maya AI',
        whatsapp_campaign: 'WA Kampanya',
        system: 'Sistem',
        crm_toggle: 'CRM Kartı',
    }

    const filteredOptouts = optouts.filter(o => 
        !search || o.phone?.includes(search) || o.reason?.toLowerCase().includes(search.toLowerCase())
    )

    const filteredCustomers = blockedCustomers.filter(c =>
        !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
    )

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Card className="p-3 bg-red-500/5 border-red-500/20">
                    <div className="flex items-center gap-2">
                        <PhoneOff className="h-4 w-4 text-red-500" />
                        <div>
                            <p className="text-lg font-bold text-red-600">{blockedCustomers.length}</p>
                            <p className="text-[10px] text-muted-foreground">İletişim Kapalı</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-amber-500/5 border-amber-500/20">
                    <div className="flex items-center gap-2">
                        <ShieldOff className="h-4 w-4 text-amber-500" />
                        <div>
                            <p className="text-lg font-bold text-amber-600">{optouts.length}</p>
                            <p className="text-[10px] text-muted-foreground">Opt-out Kayıt</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-3 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-500" />
                        <div>
                            <p className="text-lg font-bold text-emerald-600">{optouts.filter(o => o.channel === 'all').length}</p>
                            <p className="text-[10px] text-muted-foreground">Tam Engel</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                        placeholder="Telefon veya isim ara..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-8 h-8 text-xs"
                    />
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="h-8 gap-1 text-xs">
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 gap-1 text-xs bg-red-600 hover:bg-red-700">
                    <Plus className="h-3 w-3" />
                    Opt-out Ekle
                </Button>
            </div>

            {/* Blocked Customers Section */}
            {filteredCustomers.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                        <PhoneOff className="h-3.5 w-3.5" />
                        İletişim Kapatılmış Müşteriler ({filteredCustomers.length})
                    </h3>
                    <div className="space-y-1.5">
                        {filteredCustomers.map(c => (
                            <Card key={c.id} className="p-2.5 flex items-center gap-3 bg-red-500/5 border-red-500/10">
                                <PhoneOff className="h-4 w-4 text-red-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-semibold block truncate">{c.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground">{c.phone || '—'}</span>
                                </div>
                                <Switch
                                    checked={false}
                                    disabled={togglingId === c.id}
                                    onCheckedChange={() => handleToggleComm(c.id, true)}
                                    className="data-[state=unchecked]:bg-red-400"
                                />
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Opt-out Records */}
            <div>
                <h3 className="text-xs font-bold text-amber-600 mb-2 flex items-center gap-1.5">
                    <ShieldOff className="h-3.5 w-3.5" />
                    Opt-out Kayıtları ({filteredOptouts.length})
                </h3>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">Yükleniyor...</div>
                ) : filteredOptouts.length === 0 ? (
                    <Card className="p-6 text-center border-dashed">
                        <Shield className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs text-muted-foreground">Henüz opt-out kaydı yok</p>
                    </Card>
                ) : (
                    <div className="space-y-1.5">
                        {filteredOptouts.map(o => (
                            <Card key={o.id} className="p-2.5 flex items-center gap-3 bg-muted/30">
                                <ShieldOff className="h-4 w-4 text-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono font-semibold">{o.phone}</span>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                                            {channelLabel[o.channel] || o.channel}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground block truncate">
                                        {o.reason || '—'} • {new Date(o.created_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-500/10"
                                    onClick={() => handleRemoveOptout(o.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Audit Logs */}
            <div>
                <h3 className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    İşlem Geçmişi (Son 50)
                </h3>
                {logs.length === 0 ? (
                    <Card className="p-4 text-center border-dashed">
                        <p className="text-xs text-muted-foreground">Henüz log kaydı yok</p>
                    </Card>
                ) : (
                    <div className="space-y-1 max-h-[400px] overflow-y-auto">
                        {logs.map((l: any) => (
                            <Card key={l.id} className="p-2 flex items-center gap-2 bg-muted/20 text-xs">
                                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${
                                    l.action === 'opted_out' 
                                        ? 'border-red-500/30 text-red-500 bg-red-500/10' 
                                        : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                                }`}>
                                    {l.action === 'opted_out' ? '🔇 Kapatıldı' : '🔔 Açıldı'}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                    <span className="font-mono text-[10px]">{l.phone || '—'}</span>
                                    <span className="text-muted-foreground"> • </span>
                                    <span className="text-muted-foreground">{channelLabel[l.channel] || l.channel}</span>
                                    {l.reason && (
                                        <span className="text-muted-foreground block truncate text-[10px]">{l.reason}</span>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="block text-[10px] font-medium">{l.performed_by_name || 'Sistem'}</span>
                                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                                        {sourceLabel[l.source] || l.source}
                                    </Badge>
                                    <span className="block text-[9px] text-muted-foreground">
                                        {new Date(l.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Opt-out Dialog */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldOff className="h-4 w-4 text-red-500" />
                            Opt-out Ekle
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium mb-1 block">Telefon Numarası</label>
                            <Input 
                                placeholder="+905XXXXXXXXX" 
                                value={newPhone} 
                                onChange={e => setNewPhone(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Kanal</label>
                            <Select value={newChannel} onValueChange={setNewChannel}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tüm Kanallar</SelectItem>
                                    <SelectItem value="ai_call">AI Arama</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="sms">SMS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs font-medium mb-1 block">Sebep</label>
                            <Input 
                                placeholder="İsteğe bağlı..." 
                                value={newReason} 
                                onChange={e => setNewReason(e.target.value)}
                                className="text-sm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddOpen(false)}>İptal</Button>
                        <Button onClick={handleAdd} disabled={adding} className="bg-red-600 hover:bg-red-700">
                            {adding ? 'Ekleniyor...' : 'Ekle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
