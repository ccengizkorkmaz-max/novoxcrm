'use client'

import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Combobox } from '@/components/ui/combobox'
import { Loader2, FileText, Shield, CreditCard, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createQuickProposal } from '../actions'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const PaymentPlanCalculator = dynamic(() => import('./PaymentPlanCalculator'), { ssr: false })

interface QuickProposalDialogProps {
    saleId: string
    customerName: string
    currentUnitId?: string | null
    currentProjectId?: string | null
    projects: any[]
    totalAmount?: number
    initialCurrency?: string
    templates?: any[]
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export default function QuickProposalDialog({
    saleId,
    customerName,
    currentUnitId,
    currentProjectId,
    projects: projectsProp = [],
    totalAmount = 0,
    initialCurrency = 'TRY',
    templates = [],
    isOpen,
    onOpenChange,
    onSuccess
}: QuickProposalDialogProps) {
    const router = useRouter()

    // Project & Unit selection
    const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || '')
    const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId || '')
    const [units, setUnits] = useState<any[]>([])
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)
    const [unitPrice, setUnitPrice] = useState(totalAmount)
    const [unitCurrency, setUnitCurrency] = useState(initialCurrency)

    // Deposit
    const [withDeposit, setWithDeposit] = useState(false)
    const [depositAmount, setDepositAmount] = useState(0)
    const [depositDisplay, setDepositDisplay] = useState('')

    // Validity
    const defaultValidDate = new Date()
    defaultValidDate.setDate(defaultValidDate.getDate() + 7)
    const [validUntil, setValidUntil] = useState(defaultValidDate.toISOString().split('T')[0])

    // Payment plan data (received from calculator)
    const [paymentPlanItems, setPaymentPlanItems] = useState<any[]>([])
    const [paymentPlanTotal, setPaymentPlanTotal] = useState(0)
    const [planCurrency, setPlanCurrency] = useState(initialCurrency)

    // UI
    const [saving, setSaving] = useState(false)
    const [step, setStep] = useState<'unit' | 'plan'>('unit')

    // Map projects
    const projectOptions = useMemo(() => {
        return projectsProp.map(p => ({ value: p.id, label: p.name }))
    }, [projectsProp])

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setSelectedProjectId(currentProjectId || '')
            setSelectedUnitId(currentUnitId || '')
            setWithDeposit(false)
            setDepositAmount(0)
            setDepositDisplay('')
            setPaymentPlanItems([])
            setPaymentPlanTotal(0)
            setStep('unit')
            const newDate = new Date()
            newDate.setDate(newDate.getDate() + 7)
            setValidUntil(newDate.toISOString().split('T')[0])
        }
    }, [isOpen, currentProjectId, currentUnitId])

    // Load units when project changes
    useEffect(() => {
        if (!selectedProjectId || !isOpen) {
            setUnits([])
            return
        }

        const loadUnits = async () => {
            setIsLoadingUnits(true)
            try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('units')
                    .select('id, unit_number, price, currency, block')
                    .eq('project_id', selectedProjectId)
                    .in('status', ['For Sale', 'Stock', 'Available'])
                    .order('unit_number')

                if (error) throw error

                let allUnits = data || []

                // Include current unit even if reserved
                if (currentUnitId && !allUnits.find(u => u.id === currentUnitId)) {
                    const { data: currentUnit } = await supabase
                        .from('units')
                        .select('id, unit_number, price, currency, block, project_id')
                        .eq('id', currentUnitId)
                        .single()

                    if (currentUnit && currentUnit.project_id === selectedProjectId) {
                        allUnits = [currentUnit, ...allUnits]
                    }
                }

                setUnits(allUnits)
            } catch (err) {
                console.error('Error fetching units:', err)
            } finally {
                setIsLoadingUnits(false)
            }
        }

        loadUnits()
    }, [selectedProjectId, isOpen, currentUnitId])

    // Update price when unit changes
    useEffect(() => {
        const unit = units.find(u => u.id === selectedUnitId)
        if (unit) {
            setUnitPrice(unit.price || 0)
            setUnitCurrency(unit.currency || 'TRY')
        }
    }, [selectedUnitId, units])

    const filteredUnits = useMemo(() => {
        return units.map(u => ({
            value: u.id,
            label: `${u.block ? u.block + ' - ' : ''}${u.unit_number}`
        }))
    }, [units])

    const handleDepositChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        if (val === '') {
            setDepositAmount(0)
            setDepositDisplay('')
            return
        }
        const num = Number(val)
        setDepositAmount(num)
        setDepositDisplay(new Intl.NumberFormat('tr-TR').format(num))
    }

    const handlePlanConfirm = (plan: any[], totals: { interest: number; grandTotal: number }, currency: string) => {
        setPaymentPlanItems(plan)
        setPaymentPlanTotal(totals.grandTotal)
        setPlanCurrency(currency)
        toast.success('Ödeme planı hazırlandı!')
    }

    const handleSave = async () => {
        if (!selectedUnitId) {
            toast.error('Lütfen bir ünite seçin')
            return
        }
        if (!paymentPlanItems.length) {
            toast.error('Lütfen ödeme planını hesaplayın ve onaylayın')
            return
        }
        if (!validUntil) {
            toast.error('Lütfen geçerlilik tarihi girin')
            return
        }

        setSaving(true)
        try {
            const result = await createQuickProposal({
                saleId,
                unitId: selectedUnitId,
                projectId: selectedProjectId,
                offerPrice: unitPrice,
                listPrice: unitPrice,
                currency: planCurrency || unitCurrency,
                validUntil,
                paymentPlanItems,
                paymentPlanTotal,
                depositAmount: withDeposit ? depositAmount : undefined
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Teklif başarıyla oluşturuldu!')
                onOpenChange(false)
                router.refresh()
                if (onSuccess) onSuccess()
            }
        } catch (err: any) {
            toast.error('Beklenmedik hata: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const selectedUnit = units.find(u => u.id === selectedUnitId)
    const selectedProject = projectsProp.find(p => p.id === selectedProjectId)

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Hızlı Teklif — {customerName}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Step 1: Unit Selection & Validity */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-slate-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proje & Ünite</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Proje</Label>
                                <Combobox
                                    items={projectOptions}
                                    value={selectedProjectId}
                                    onChange={(val) => {
                                        setSelectedProjectId(val)
                                        setSelectedUnitId('')
                                    }}
                                    placeholder="Proje seçin..."
                                    searchPlaceholder="Proje ara..."
                                    emptyText="Proje bulunamadı"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600">Ünite</Label>
                                <Combobox
                                    items={filteredUnits}
                                    value={selectedUnitId}
                                    onChange={setSelectedUnitId}
                                    placeholder={isLoadingUnits ? 'Yükleniyor...' : 'Ünite seçin...'}
                                    searchPlaceholder="Ünite ara..."
                                    emptyText="Uygun ünite bulunamadı"
                                    disabled={!selectedProjectId || isLoadingUnits}
                                />
                            </div>
                        </div>

                        {/* Selected unit info */}
                        {selectedUnit && (
                            <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-blue-100">
                                <div className="text-xs text-slate-500">Liste Fiyatı:</div>
                                <div className="text-sm font-bold text-blue-700">
                                    {new Intl.NumberFormat('tr-TR').format(selectedUnit.price || 0)} {selectedUnit.currency || 'TRY'}
                                </div>
                            </div>
                        )}

                        {/* Validity & Deposit row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Geçerlilik Tarihi (= Opsiyon Süresi)
                                </Label>
                                <Input
                                    type="date"
                                    value={validUntil}
                                    onChange={e => setValidUntil(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="h-9 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                        <CreditCard className="h-3.5 w-3.5" />
                                        Kaporalı Teklif
                                    </Label>
                                    <Switch
                                        checked={withDeposit}
                                        onCheckedChange={setWithDeposit}
                                    />
                                </div>
                                {withDeposit && (
                                    <Input
                                        type="text"
                                        value={depositDisplay}
                                        onChange={handleDepositChange}
                                        placeholder="Kapora tutarı"
                                        className="h-9 text-sm"
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Payment Plan Calculator */}
                    {selectedUnitId && (
                        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Ödeme Planı</span>
                                {paymentPlanItems.length > 0 && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-auto">
                                        ✓ Plan Hazır — {paymentPlanItems.length} kalem
                                    </span>
                                )}
                            </div>
                            <PaymentPlanCalculator
                                saleId={saleId}
                                totalAmount={unitPrice}
                                initialCurrency={unitCurrency}
                                templates={templates}
                                onConfirm={handlePlanConfirm}
                                confirmButtonText="Planı Teklife Uygula"
                                disablePriceEdit={false}
                            />
                        </div>
                    )}

                    {/* Summary & Save */}
                    {paymentPlanItems.length > 0 && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                            <div className="grid grid-cols-3 gap-4 text-center mb-4">
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Teklif Fiyatı</div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {new Intl.NumberFormat('tr-TR').format(unitPrice)} {planCurrency}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Vade Dahil Toplam</div>
                                    <div className="text-sm font-bold text-blue-700">
                                        {new Intl.NumberFormat('tr-TR').format(paymentPlanTotal)} {planCurrency}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Geçerlilik</div>
                                    <div className="text-sm font-bold text-slate-800">
                                        {new Date(validUntil).toLocaleDateString('tr-TR')}
                                    </div>
                                </div>
                            </div>
                            {withDeposit && depositAmount > 0 && (
                                <div className="text-center text-xs text-orange-600 font-semibold mb-3">
                                    💰 Kapora: {new Intl.NumberFormat('tr-TR').format(depositAmount)} {planCurrency}
                                </div>
                            )}
                            <Button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Oluşturuluyor...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Teklif Oluştur & Opsiyonla
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
