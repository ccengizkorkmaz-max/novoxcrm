'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { createAgentTransaction, updateTransactionStatus, saveBrokerCommissionSettings } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Plus, MoreHorizontal, CheckCircle, XCircle, Banknote,
    TrendingUp, Users, Building2, Settings2, Calculator
} from 'lucide-react'

interface Props {
    transactions: any[]
    commissionSettings: any | null
    agents: any[]
    customers: any[]
    portfolios: any[]
    userRole: string
}

function formatCurrency(amount: number | null, currency: string = 'TRY') {
    if (!amount) return '-'
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Onay Bekliyor', color: 'bg-amber-500 text-white' },
    approved: { label: 'Onaylandı', color: 'bg-blue-600 text-white' },
    paid: { label: 'Ödendi', color: 'bg-emerald-600 text-white' },
    cancelled: { label: 'İptal', color: 'bg-red-600 text-white' },
}

export function AgentTransactionsView({ transactions, commissionSettings, agents, customers, portfolios, userRole }: Props) {
    const router = useRouter()
    const [showNewDialog, setShowNewDialog] = useState(false)
    const [showSettingsDialog, setShowSettingsDialog] = useState(false)
    const [loading, setLoading] = useState(false)

    // Live commission calculator
    const [calcPrice, setCalcPrice] = useState<number>(0)
    const [calcRate, setCalcRate] = useState<number>(4)

    const isManager = ['manager', 'admin', 'owner', 'crm_manager'].includes(userRole)
    const isOwner = ['admin', 'owner', 'crm_manager'].includes(userRole)

    // Stats
    const totalGCI = transactions.reduce((s, t) => s + (t.gross_commission || 0), 0)
    const totalOffice = transactions.reduce((s, t) => s + (t.office_share || 0), 0)
    const pendingCount = transactions.filter(t => t.status === 'pending').length
    const paidCount = transactions.filter(t => t.status === 'paid').length

    async function handleNewTransaction(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            await createAgentTransaction(formData)
            toast.success('İşlem kaydedildi ve komisyon hesaplandı!')
            setShowNewDialog(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'İşlem kaydedilemedi')
        } finally {
            setLoading(false)
        }
    }

    async function handleStatusChange(id: string, status: string) {
        try {
            await updateTransactionStatus(id, status)
            toast.success('Durum güncellendi')
            router.refresh()
        } catch {
            toast.error('Güncelleme başarısız')
        }
    }

    async function handleSaveSettings(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            await saveBrokerCommissionSettings(formData)
            toast.success('Komisyon ayarları güncellendi')
            setShowSettingsDialog(false)
            router.refresh()
        } catch (err: any) {
            toast.error(err.message || 'Ayarlar kaydedilemedi')
        } finally {
            setLoading(false)
        }
    }

    const officePercent = commissionSettings?.default_split_office || 40
    const agentPercent = commissionSettings?.default_split_agent || 60

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Toplam GCI', value: formatCurrency(totalGCI), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Ofis Geliri', value: formatCurrency(totalOffice), icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Onay Bekleyen', value: pendingCount, icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Ödenen İşlem', value: paidCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <Card key={i} className="border shadow-sm">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("h-5 w-5", stat.color)} />
                            </div>
                            <div>
                                <span className={cn("text-xl font-black", stat.color)}>{stat.value}</span>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Commission Split Info + Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-slate-50">
                        <CardTitle className="text-sm font-bold flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-blue-600" />
                                Aktif Komisyon Bölüşümü
                            </span>
                            {isOwner && (
                                <Button variant="outline" size="sm" className="text-[10px] h-7" onClick={() => setShowSettingsDialog(true)}>
                                    Düzenle
                                </Button>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
                                <p className="text-2xl font-black text-blue-600">%{officePercent}</p>
                                <p className="text-[10px] font-bold text-blue-500 uppercase">Ofis Payı</p>
                            </div>
                            <div className="text-slate-300 text-2xl font-light">/</div>
                            <div className="flex-1 text-center p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                <p className="text-2xl font-black text-emerald-600">%{agentPercent}</p>
                                <p className="text-[10px] font-bold text-emerald-500 uppercase">Danışman Payı</p>
                            </div>
                        </div>
                        {commissionSettings?.cap_enabled && (
                            <div className="mt-3 p-2 rounded-lg bg-violet-50 border border-violet-200 text-center">
                                <p className="text-[10px] text-violet-600 font-bold">
                                    CAP AKTİF — {formatCurrency(commissionSettings.cap_amount)} sonrası %{commissionSettings.cap_split_after_office}/%{commissionSettings.cap_split_after_agent}
                                </p>
                            </div>
                        )}
                        {commissionSettings?.desk_fee_monthly > 0 && (
                            <p className="mt-2 text-[10px] text-muted-foreground text-center">
                                Aylık Masa Ücreti: {formatCurrency(commissionSettings.desk_fee_monthly)}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-3 bg-slate-50">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-violet-600" />
                            Hızlı Komisyon Hesaplayıcı
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[10px] font-bold">Satış Fiyatı</Label>
                                <Input type="number" placeholder="3.500.000" value={calcPrice || ''} onChange={e => setCalcPrice(Number(e.target.value))} className="h-9 text-sm" />
                            </div>
                            <div>
                                <Label className="text-[10px] font-bold">Komisyon Oranı (%)</Label>
                                <Input type="number" step="0.5" value={calcRate} onChange={e => setCalcRate(Number(e.target.value))} className="h-9 text-sm" />
                            </div>
                        </div>
                        {calcPrice > 0 && (
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                                <div className="text-center p-2 rounded-lg bg-slate-50">
                                    <p className="text-xs font-black text-slate-900">{formatCurrency(calcPrice * (calcRate / 100))}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold">Toplam GCI</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-blue-50">
                                    <p className="text-xs font-black text-blue-600">{formatCurrency(calcPrice * (calcRate / 100) * (officePercent / 100))}</p>
                                    <p className="text-[9px] text-blue-500 font-bold">Ofis</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-emerald-50">
                                    <p className="text-xs font-black text-emerald-600">{formatCurrency(calcPrice * (calcRate / 100) * (agentPercent / 100))}</p>
                                    <p className="text-[9px] text-emerald-500 font-bold">Danışman</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700">İşlem Geçmişi</h2>
                {isManager && (
                    <Button onClick={() => setShowNewDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-2">
                        <Plus className="h-4 w-4" /> Yeni İşlem Kaydet
                    </Button>
                )}
            </div>

            {/* Transactions Table */}
            <div className="rounded-xl border bg-card overflow-auto shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Tarih</TableHead>
                            <TableHead>Portföy</TableHead>
                            <TableHead>Satış Fiyatı</TableHead>
                            <TableHead>GCI</TableHead>
                            <TableHead>Ofis Payı</TableHead>
                            <TableHead>Portföy Danışmanı</TableHead>
                            <TableHead>Alıcı Danışmanı</TableHead>
                            <TableHead>Durum</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.length > 0 ? transactions.map((t) => {
                            const statusCfg = STATUS_CONFIG[t.status] || { label: t.status, color: 'bg-slate-400 text-white' }
                            const listingAgent = agents.find(a => a.id === t.listing_agent_id)
                            const buyerAgent = agents.find(a => a.id === t.buyer_agent_id)

                            return (
                                <TableRow key={t.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs font-mono">
                                        {t.transaction_date ? new Date(t.transaction_date).toLocaleDateString('tr-TR') : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-medium">{t.portfolios?.title || '-'}</span>
                                    </TableCell>
                                    <TableCell className="font-bold text-sm">{formatCurrency(t.sale_price, t.currency)}</TableCell>
                                    <TableCell className="font-bold text-sm text-emerald-600">{formatCurrency(t.gross_commission, t.currency)}</TableCell>
                                    <TableCell className="text-sm text-blue-600">{formatCurrency(t.office_share, t.currency)}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">{listingAgent?.full_name || '-'}</span>
                                            <span className="text-[10px] text-emerald-600 font-bold">{formatCurrency(t.listing_agent_share, t.currency)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium">{buyerAgent?.full_name || '-'}</span>
                                            <span className="text-[10px] text-emerald-600 font-bold">{formatCurrency(t.buyer_agent_share, t.currency)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("text-[10px] border-none", statusCfg.color)}>{statusCfg.label}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {isManager && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {t.status === 'pending' && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'approved')}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-blue-600" /> Onayla
                                                        </DropdownMenuItem>
                                                    )}
                                                    {(t.status === 'pending' || t.status === 'approved') && (
                                                        <DropdownMenuItem onClick={() => handleStatusChange(t.id, 'paid')}>
                                                            <Banknote className="mr-2 h-4 w-4 text-emerald-600" /> Ödendi Olarak İşaretle
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(t.id, 'cancelled')}>
                                                        <XCircle className="mr-2 h-4 w-4" /> İptal Et
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        }) : (
                            <TableRow>
                                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center gap-2">
                                        <Banknote className="h-8 w-8 text-slate-300" />
                                        <span className="font-medium">Henüz işlem kaydı yok</span>
                                        <span className="text-xs">İlk satış işleminizi kaydedin.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* === NEW TRANSACTION DIALOG === */}
            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
                <DialogContent className="sm:max-w-[540px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-emerald-600" />
                            Yeni Satış İşlemi Kaydet
                        </DialogTitle>
                        <DialogDescription>Satış bilgilerini girin, komisyon otomatik hesaplanacaktır.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleNewTransaction} className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Portföy (Opsiyonel)</Label>
                            <select name="portfolio_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                <option value="">Portföy seçin...</option>
                                {portfolios.map(p => <option key={p.id} value={p.id}>{p.title} - {p.district}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Satış Fiyatı *</Label>
                                <Input name="sale_price" type="number" required placeholder="3500000" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Komisyon Oranı (%)</Label>
                                <Input name="commission_rate" type="number" step="0.5" defaultValue="4" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Portföy Danışmanı</Label>
                                <select name="listing_agent_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                    <option value="">Seçin...</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Alıcı Danışmanı</Label>
                                <select name="buyer_agent_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                    <option value="">Seçin...</option>
                                    {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Müşteri</Label>
                                <select name="customer_id" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                    <option value="">Seçin...</option>
                                    {customers.slice(0, 100).map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">İşlem Tarihi</Label>
                                <Input name="transaction_date" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Not</Label>
                            <Input name="notes" placeholder="İşlem notu (opsiyonel)" />
                        </div>
                        <input type="hidden" name="currency" value="TRY" />
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowNewDialog(false)}>İptal</Button>
                            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                                {loading ? 'Kaydediliyor...' : 'Kaydet ve Hesapla'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* === COMMISSION SETTINGS DIALOG === */}
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-blue-600" />
                            Komisyon Bölüşüm Ayarları
                        </DialogTitle>
                        <DialogDescription>Ofis ve danışman arasındaki varsayılan bölüşüm oranlarını belirleyin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Ofis Payı (%)</Label>
                                <Input name="split_office" type="number" step="1" defaultValue={commissionSettings?.default_split_office || 40} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-xs font-bold">Danışman Payı (%)</Label>
                                <Input name="split_agent" type="number" step="1" defaultValue={commissionSettings?.default_split_agent || 60} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Aylık Masa Ücreti (TRY)</Label>
                            <Input name="desk_fee_monthly" type="number" defaultValue={commissionSettings?.desk_fee_monthly || 0} />
                        </div>
                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" name="cap_enabled" value="true" defaultChecked={commissionSettings?.cap_enabled} className="rounded" />
                                <Label className="text-xs font-bold">CAP Sistemini Aktifleştir</Label>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="grid gap-1">
                                    <Label className="text-[10px]">Cap Tutarı</Label>
                                    <Input name="cap_amount" type="number" defaultValue={commissionSettings?.cap_amount || 0} className="h-8 text-xs" />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-[10px]">Sonrası Ofis %</Label>
                                    <Input name="cap_split_after_office" type="number" defaultValue={commissionSettings?.cap_split_after_office || 10} className="h-8 text-xs" />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="text-[10px]">Sonrası Danışman %</Label>
                                    <Input name="cap_split_after_agent" type="number" defaultValue={commissionSettings?.cap_split_after_agent || 90} className="h-8 text-xs" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setShowSettingsDialog(false)}>İptal</Button>
                            <Button type="submit" disabled={loading} className="font-bold">
                                {loading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
