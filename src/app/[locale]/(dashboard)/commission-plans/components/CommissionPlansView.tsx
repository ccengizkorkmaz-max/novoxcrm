'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { createCommissionPlan, updateCommissionPlan, deleteCommissionPlan, assignPlanToAgent } from '../actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    Plus, Edit, Trash2, Users, Percent, Crown, Shield,
    TrendingUp, ChevronRight, AlertTriangle, CheckCircle, Layers
} from 'lucide-react'

interface Props {
    plans: any[]
    agents: any[]
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

export function CommissionPlansView({ plans, agents }: Props) {
    const router = useRouter()
    const [showNewPlan, setShowNewPlan] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any>(null)
    const [showAssign, setShowAssign] = useState(false)

    // New plan form state
    const [planName, setPlanName] = useState('')
    const [planDesc, setPlanDesc] = useState('')
    const [agentSplit, setAgentSplit] = useState(50)
    const [franchiseFee, setFranchiseFee] = useState(0)
    const [capEnabled, setCapEnabled] = useState(false)
    const [capAmount, setCapAmount] = useState(0)
    const [capPeriod, setCapPeriod] = useState('yearly')
    const [tierEnabled, setTierEnabled] = useState(false)
    const [tiers, setTiers] = useState<Array<{ from: number; to: number | null; agent_pct: number }>>([])
    const [isDefault, setIsDefault] = useState(false)
    const [saving, setSaving] = useState(false)

    function resetForm() {
        setPlanName('')
        setPlanDesc('')
        setAgentSplit(50)
        setFranchiseFee(0)
        setCapEnabled(false)
        setCapAmount(0)
        setCapPeriod('yearly')
        setTierEnabled(false)
        setTiers([])
        setIsDefault(false)
    }

    function openEdit(plan: any) {
        setPlanName(plan.name)
        setPlanDesc(plan.description || '')
        setAgentSplit(plan.agent_split_pct)
        setFranchiseFee(plan.franchise_fee_pct || 0)
        setCapEnabled(plan.cap_enabled)
        setCapAmount(plan.cap_amount || 0)
        setCapPeriod(plan.cap_period || 'yearly')
        setTierEnabled(plan.tier_enabled)
        setTiers(plan.tiers || [])
        setIsDefault(plan.is_default)
        setEditingPlan(plan)
    }

    async function handleSave() {
        setSaving(true)
        try {
            const formData = new FormData()
            formData.set('name', planName)
            formData.set('description', planDesc)
            formData.set('agent_split_pct', String(agentSplit))
            formData.set('franchise_fee_pct', String(franchiseFee))
            formData.set('cap_enabled', String(capEnabled))
            formData.set('cap_amount', String(capAmount))
            formData.set('cap_period', capPeriod)
            formData.set('tier_enabled', String(tierEnabled))
            formData.set('tiers', JSON.stringify(tiers))
            formData.set('is_default', String(isDefault))

            if (editingPlan) {
                await updateCommissionPlan(editingPlan.id, formData)
                toast.success('Plan güncellendi')
            } else {
                await createCommissionPlan(formData)
                toast.success('Plan oluşturuldu')
            }
            setShowNewPlan(false)
            setEditingPlan(null)
            resetForm()
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(planId: string) {
        if (!confirm('Bu planı silmek istediğinize emin misiniz?')) return
        try {
            await deleteCommissionPlan(planId)
            toast.success('Plan silindi')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    async function handleAssignPlan(agentId: string, planId: string | null) {
        try {
            await assignPlanToAgent(agentId, planId)
            toast.success('Plan atandı')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        }
    }

    // Commission simulator
    const [simSalePrice, setSimSalePrice] = useState(5000000)
    const [simCommRate, setSimCommRate] = useState(3)
    const simGross = simSalePrice * (simCommRate / 100)

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex items-center gap-3">
                <Button onClick={() => { resetForm(); setShowNewPlan(true) }} className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-2">
                    <Plus className="h-4 w-4" /> Yeni Plan Oluştur
                </Button>
                <Button variant="outline" onClick={() => setShowAssign(true)} className="text-xs gap-2">
                    <Users className="h-4 w-4" /> Danışmanlara Ata
                </Button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map(plan => {
                    const assignedAgents = agents.filter(a => a.commission_plan_id === plan.id)
                    return (
                        <Card key={plan.id} className={cn("border shadow-sm hover:shadow-md transition-all", plan.is_default && "border-emerald-300 ring-1 ring-emerald-200")}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        {plan.is_default && <Crown className="h-4 w-4 text-amber-500" />}
                                        {plan.name}
                                    </CardTitle>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                                            <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(plan.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                {plan.description && <p className="text-[10px] text-muted-foreground">{plan.description}</p>}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Split visualization */}
                                <div>
                                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                                        <span className="text-emerald-600">Danışman %{plan.agent_split_pct}</span>
                                        <span className="text-blue-600">Ofis %{plan.office_split_pct}</span>
                                    </div>
                                    <div className="h-4 rounded-full overflow-hidden flex">
                                        <div className="bg-emerald-500 h-full" style={{ width: `${plan.agent_split_pct}%` }} />
                                        <div className="bg-blue-500 h-full" style={{ width: `${plan.office_split_pct}%` }} />
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex flex-wrap gap-1.5">
                                    {plan.franchise_fee_pct > 0 && (
                                        <Badge variant="outline" className="text-[9px] bg-orange-50 border-orange-200 text-orange-600">
                                            Franchise %{plan.franchise_fee_pct}
                                        </Badge>
                                    )}
                                    {plan.cap_enabled && (
                                        <Badge variant="outline" className="text-[9px] bg-violet-50 border-violet-200 text-violet-600">
                                            CAP {formatCurrency(plan.cap_amount)}
                                        </Badge>
                                    )}
                                    {plan.tier_enabled && (
                                        <Badge variant="outline" className="text-[9px] bg-cyan-50 border-cyan-200 text-cyan-600">
                                            <Layers className="h-2.5 w-2.5 mr-0.5" /> Katmanlı
                                        </Badge>
                                    )}
                                    {plan.is_default && (
                                        <Badge className="text-[9px] bg-emerald-100 text-emerald-700 border-emerald-200">Varsayılan</Badge>
                                    )}
                                </div>

                                {/* Tiers */}
                                {plan.tier_enabled && plan.tiers?.length > 0 && (
                                    <div className="bg-slate-50 rounded-lg p-2 space-y-1">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Katmanlar</span>
                                        {plan.tiers.map((tier: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between text-[10px]">
                                                <span className="text-slate-600">
                                                    {formatCurrency(tier.from)} {tier.to ? `→ ${formatCurrency(tier.to)}` : '+'}
                                                </span>
                                                <span className="font-bold text-emerald-600">%{tier.agent_pct}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Assigned agents */}
                                <div className="pt-2 border-t">
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                        <Users className="h-3 w-3" />
                                        {assignedAgents.length > 0 ? (
                                            <span>{assignedAgents.map(a => a.full_name).join(', ')}</span>
                                        ) : (
                                            <span className="italic">Atanmış danışman yok</span>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Sim */}
                                <div className="bg-slate-50 rounded-lg p-2 text-[10px]">
                                    <span className="font-bold text-slate-500 uppercase">Örnek: ₺5M satış, %3 komisyon</span>
                                    <div className="flex justify-between mt-1">
                                        <span>Brüt: {formatCurrency(150000)}</span>
                                        {plan.franchise_fee_pct > 0 && <span className="text-orange-600">-Franchise: {formatCurrency(150000 * plan.franchise_fee_pct / 100)}</span>}
                                    </div>
                                    <div className="flex justify-between font-bold mt-0.5">
                                        <span className="text-emerald-600">Danışman: {formatCurrency((150000 - 150000 * (plan.franchise_fee_pct || 0) / 100) * plan.agent_split_pct / 100)}</span>
                                        <span className="text-blue-600">Ofis: {formatCurrency((150000 - 150000 * (plan.franchise_fee_pct || 0) / 100) * plan.office_split_pct / 100)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}

                {plans.length === 0 && (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <Percent className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">Henüz komisyon planı yok</p>
                        <p className="text-sm mt-1">İlk planınızı oluşturarak başlayın.</p>
                    </div>
                )}
            </div>

            {/* Commission Simulator */}
            <Card className="border shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-violet-500" />
                        Komisyon Simülatörü
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-xs font-bold">Satış Fiyatı</Label>
                            <Input type="number" value={simSalePrice} onChange={e => setSimSalePrice(Number(e.target.value))} className="mt-1" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Komisyon Oranı (%)</Label>
                            <Input type="number" step="0.5" value={simCommRate} onChange={e => setSimCommRate(Number(e.target.value))} className="mt-1" />
                        </div>
                        <div className="flex items-end">
                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 w-full text-center">
                                <p className="text-[10px] text-violet-500 font-bold">BRÜT KOMİSYON</p>
                                <p className="text-xl font-black text-violet-600">{formatCurrency(simGross)}</p>
                            </div>
                        </div>
                    </div>
                    {plans.length > 0 && (
                        <div className="mt-4 pt-3 border-t">
                            <p className="text-xs font-bold text-slate-600 mb-2">Planlara Göre Dağılım:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {plans.map(plan => {
                                    const franchise = simGross * ((plan.franchise_fee_pct || 0) / 100)
                                    const net = simGross - franchise
                                    const agentPay = net * (plan.agent_split_pct / 100)
                                    const officePay = net - agentPay
                                    return (
                                        <div key={plan.id} className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50 text-xs">
                                            <span className="font-medium">{plan.name}</span>
                                            <div className="flex gap-2">
                                                <span className="text-emerald-600 font-bold">{formatCurrency(agentPay)}</span>
                                                <span className="text-slate-300">|</span>
                                                <span className="text-blue-600 font-bold">{formatCurrency(officePay)}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Plan Dialog */}
            <Dialog open={showNewPlan || !!editingPlan} onOpenChange={(open) => { if (!open) { setShowNewPlan(false); setEditingPlan(null); resetForm(); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? 'Planı Düzenle' : 'Yeni Komisyon Planı'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Plan Adı *</Label>
                            <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="Örn: Junior Plan" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Açıklama</Label>
                            <Input value={planDesc} onChange={e => setPlanDesc(e.target.value)} placeholder="Kısa açıklama..." />
                        </div>

                        {/* Split Slider */}
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Danışman / Ofis Payı: %{agentSplit} / %{100 - agentSplit}</Label>
                            <input type="range" min={10} max={90} step={5} value={agentSplit}
                                onChange={e => setAgentSplit(Number(e.target.value))}
                                className="w-full accent-emerald-600"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>%10 (Düşük)</span>
                                <span>%50 (Standart)</span>
                                <span>%90 (Yüksek)</span>
                            </div>
                        </div>

                        {/* Franchise Fee */}
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold">Franchise Payı (%)</Label>
                            <Input type="number" step="0.5" value={franchiseFee} onChange={e => setFranchiseFee(Number(e.target.value))} placeholder="Örn: 8 (RE/MAX)" />
                            <p className="text-[10px] text-muted-foreground">Brüt komisyondan franchise'a giden oran. RE/MAX: %8, Coldwell: %6</p>
                        </div>

                        {/* CAP */}
                        <div className="p-3 rounded-xl border bg-violet-50/50 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={capEnabled} onChange={e => setCapEnabled(e.target.checked)} className="rounded" />
                                <span className="text-xs font-bold">CAP (Tavan) Aktif</span>
                            </label>
                            {capEnabled && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-[10px]">Tavan Tutarı</Label>
                                        <Input type="number" value={capAmount} onChange={e => setCapAmount(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <Label className="text-[10px]">Dönem</Label>
                                        <select value={capPeriod} onChange={e => setCapPeriod(e.target.value)} className="w-full h-10 px-3 rounded-lg border text-sm bg-white">
                                            <option value="yearly">Yıllık</option>
                                            <option value="quarterly">Çeyreklik</option>
                                            <option value="monthly">Aylık</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                                CAP'e ulaşıldığında danışman kalan dönem boyunca %100 alır
                            </p>
                        </div>

                        {/* Tiers */}
                        <div className="p-3 rounded-xl border bg-cyan-50/50 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={tierEnabled} onChange={e => setTierEnabled(e.target.checked)} className="rounded" />
                                <span className="text-xs font-bold">Katmanlı Split</span>
                            </label>
                            {tierEnabled && (
                                <div className="space-y-2">
                                    {tiers.map((tier, i) => (
                                        <div key={i} className="grid grid-cols-3 gap-2 items-end">
                                            <div>
                                                <Label className="text-[10px]">Başlangıç (₺)</Label>
                                                <Input type="number" value={tier.from} onChange={e => {
                                                    const n = [...tiers]; n[i].from = Number(e.target.value); setTiers(n)
                                                }} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px]">Bitiş (₺)</Label>
                                                <Input type="number" value={tier.to || ''} onChange={e => {
                                                    const n = [...tiers]; n[i].to = e.target.value ? Number(e.target.value) : null; setTiers(n)
                                                }} placeholder="∞" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="flex-1">
                                                    <Label className="text-[10px]">Oran (%)</Label>
                                                    <Input type="number" value={tier.agent_pct} onChange={e => {
                                                        const n = [...tiers]; n[i].agent_pct = Number(e.target.value); setTiers(n)
                                                    }} />
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 mt-4"
                                                    onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="text-xs gap-1"
                                        onClick={() => setTiers([...tiers, { from: 0, to: null, agent_pct: 50 }])}>
                                        <Plus className="h-3 w-3" /> Katman Ekle
                                    </Button>
                                </div>
                            )}
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
                            <span className="text-xs font-bold">Varsayılan plan olarak ayarla</span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowNewPlan(false); setEditingPlan(null); resetForm() }}>İptal</Button>
                        <Button onClick={handleSave} disabled={saving || !planName} className="bg-emerald-600 hover:bg-emerald-700">
                            {saving ? 'Kaydediliyor...' : editingPlan ? 'Güncelle' : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Plans Dialog */}
            <Dialog open={showAssign} onOpenChange={setShowAssign}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Danışmanlara Plan Ata</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4 max-h-[60vh] overflow-y-auto">
                        {agents.map(agent => (
                            <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-slate-50">
                                <div>
                                    <p className="text-xs font-bold">{agent.full_name}</p>
                                    <p className="text-[10px] text-muted-foreground capitalize">{agent.role}</p>
                                </div>
                                <select
                                    value={agent.commission_plan_id || ''}
                                    onChange={e => handleAssignPlan(agent.id, e.target.value || null)}
                                    className="h-8 px-2 rounded-lg border text-[10px] bg-white w-40"
                                >
                                    <option value="">Plan seçin...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (%{p.agent_split_pct})</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
