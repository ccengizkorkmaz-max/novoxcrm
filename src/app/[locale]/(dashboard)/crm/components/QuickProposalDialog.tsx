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

    // UI
    const [saving, setSaving] = useState(false)

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

    const handlePlanConfirmAndSave = async (plan: any[], totals: { interest: number; grandTotal: number }, currency: string) => {
        if (!selectedUnitId) {
            toast.error('Lütfen bir ünite seçin')
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
                currency: currency || unitCurrency,
                validUntil,
                paymentPlanItems: plan,
                paymentPlanTotal: totals.grandTotal,
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

    const renderUnitSelectionInputs = () => (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4 flex-shrink-0">
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
    )

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-6xl w-[95vw] h-[85vh] max-h-[85vh] overflow-hidden flex flex-col p-6">
                <DialogHeader className="pb-2 border-b border-slate-100 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Hızlı Teklif — {customerName}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden min-h-0 pt-4">
                    {!selectedUnitId ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-stretch">
                            {/* Left Column: Proje & Ünite & Validity & Deposit */}
                            <div className="lg:col-span-5 space-y-4">
                                {renderUnitSelectionInputs()}
                            </div>
                            
                            {/* Right Column: Empty State */}
                            <div className="lg:col-span-7 flex flex-col items-center justify-center border-l border-slate-100 p-8 text-center text-slate-400 bg-slate-50/20 rounded-xl min-h-[300px]">
                                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 text-blue-400 animate-pulse">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-700 mb-1">Ödeme Planı Hazırlanıyor</h3>
                                <p className="text-xs leading-relaxed max-w-sm">
                                    Ödeme planı hesaplayıcıyı aktifleştirmek ve teklif detaylarını düzenlemek için lütfen sol menüden bir **Proje ve Ünite** seçin.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <PaymentPlanCalculator
                            saleId={saleId}
                            totalAmount={unitPrice}
                            initialCurrency={unitCurrency}
                            templates={templates}
                            onConfirm={handlePlanConfirmAndSave}
                            confirmButtonText={saving ? "Teklif Oluşturuluyor..." : "Teklif Oluştur & Opsiyonla"}
                            disablePriceEdit={false}
                            isWide={true}
                            rightHeader={
                                withDeposit && depositAmount > 0 ? (
                                    <div className="text-center text-xs text-orange-600 font-semibold mb-1 py-1.5 bg-orange-50 rounded-lg border border-orange-100 flex-shrink-0 animate-in fade-in">
                                        💰 Kaporalı Teklif Tutarı: {new Intl.NumberFormat('tr-TR').format(depositAmount)} {unitCurrency}
                                    </div>
                                ) : null
                            }
                        >
                            {renderUnitSelectionInputs()}
                        </PaymentPlanCalculator>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
