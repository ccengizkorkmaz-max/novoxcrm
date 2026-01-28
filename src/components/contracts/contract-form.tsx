'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentPlanEditor } from './payment-plan-editor'
import { createContract } from '@/app/(dashboard)/contracts/actions' // We need to update this actions file to handle the complex payload
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ContractFormProps {
    projects?: any[]
    units?: any[]
    customers?: any[]
    reservations?: any[]
    offers?: any[]
    templates?: any[]
    initialOfferId?: string
    initialUnitId?: string
    initialCustomerId?: string
    offerData?: any
}

export function ContractForm({
    projects = [],
    units = [],
    customers = [],
    reservations = [],
    offers = [],
    templates = [],
    initialOfferId,
    initialUnitId,
    initialCustomerId,
    offerData
}: ContractFormProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const preUnitId = initialUnitId || searchParams.get('unitId') || offerData?.unit_id || ''
    // Try both paths - nested projects object or direct project_id
    const preProjectId = offerData?.units?.project_id || offerData?.units?.projects?.id || searchParams.get('projectId') || ''
    const preCustomerId = initialCustomerId || ''

    // Auto-generate contract number
    const generateContractNumber = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        return `SZL-${year}${month}${day}-${random}`
    }

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Find the selected unit to get its project_id
    const selectedUnit = units.find((u: any) => u.id === preUnitId)
    const finalProjectId = selectedUnit?.project_id || preProjectId

    // Form State
    const [formData, setFormData] = useState({
        project_id: finalProjectId,
        unit_id: preUnitId,
        contract_number: generateContractNumber(),
        contract_date: new Date().toISOString().split('T')[0],
        delivery_date: '',
        currency: offerData?.currency || selectedUnit?.currency || 'TRY',
        amount: offerData?.price || selectedUnit?.price || 0,
        notes: offerData ? `Teklif #${offerData.offer_number || initialOfferId?.slice(0, 8)} üzerinden oluşturuldu` : '',
        selectedCustomers: preCustomerId ? [preCustomerId] : [] as string[], // IDs
    })

    // Helper to get unit info
    const activeReservation = reservations.find(r => r.unit_id === formData.unit_id)
    const activeOffer = offers.find(o => o.unit_id === formData.unit_id)

    const [paymentPlan, setPaymentPlan] = useState<any[]>([])

    const handlePaymentPlanChange = useCallback((newPlan: any[]) => {
        setPaymentPlan(newPlan)
    }, [])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // Note: The 'createContract' server action currently accepts FormData. 
            // We need to either modify it to accept JSON or append everything to FormData carefully, especially arrays.
            // For MVP simplicity, let's construct FormData but serialize objects as strings where needed.

            const data = new FormData()
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'selectedCustomers') {
                    data.append(key, JSON.stringify(value))
                } else {
                    data.append(key, String(value))
                }
            })

            // Calculate actual total from payment plan items to detect interest-inclusive amounts
            const planTotal = paymentPlan.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
            const finalAmount = planTotal > 0 ? planTotal : formData.amount

            data.append('payment_plan', JSON.stringify(paymentPlan))
            data.append('amount', String(finalAmount)) // Use the interest-inclusive amount for the contract record

            const result = await createContract(data)
            if (result.error) throw new Error(result.error)

            toast.success('Sözleşme başarıyla oluşturuldu')
            router.push('/contracts')
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (step === 1) {
            if (!formData.contract_number) {
                toast.error('Sözleşme numarası gereklidir')
                return
            }
            if (!formData.unit_id) {
                toast.error('Lütfen bir ünite seçiniz')
                return
            }
            if (!formData.amount || formData.amount <= 0) {
                toast.error('Satış fiyatı zorunludur ve 0\'dan büyük olmalıdır')
                return
            }
        }
        setStep(step + 1)
    }
    const prevStep = () => setStep(step - 1)

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Stepper */}
            <div className="flex justify-between mb-8">
                {['Genel Bilgiler', 'Müşteriler', 'Ödeme Planı'].map((label, idx) => (
                    <div key={idx} className={`flex flex-col items-center flex-1 ${step === idx + 1 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step > idx ? 'bg-primary text-white' : step === idx + 1 ? 'border-2 border-primary' : 'bg-slate-100'}`}>
                            {idx + 1}
                        </div>
                        <span className="text-sm">{label}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: General Info */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Sözleşme Detayları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Sözleşme No <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.contract_number}
                                    onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })}
                                    placeholder="Örn: 2024-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tarih <span className="text-red-500">*</span></Label>
                                <Input
                                    type="date"
                                    value={formData.contract_date}
                                    onChange={(e) => setFormData({ ...formData, contract_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Proje</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.project_id}
                                            onChange={(e) => setFormData({ ...formData, project_id: e.target.value, unit_id: '' })}
                                        >
                                            <option value="">Seçiniz</option>
                                            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ünite</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.unit_id}
                                            onChange={(e) => {
                                                const unitId = e.target.value
                                                const selectedUnit = units.find((u: any) => u.id === unitId)

                                                // Find latest accepted offer for this unit (offers are sorted by created_at desc)
                                                // Priority: 
                                                // 1. If this is the unit from our specific offer (offerData), use that price
                                                // 2. Otherwise use unit list price (standard new contract flow)

                                                let finalPrice = selectedUnit?.price || 0
                                                let finalCurrency = selectedUnit?.currency || formData.currency

                                                if (offerData && offerData.unit_id === unitId) {
                                                    finalPrice = offerData.price
                                                    finalCurrency = offerData.currency || finalCurrency
                                                }
                                                // Removed implicit lookup for other accepted offers to strictly follow "New Contract -> List Price" rule

                                                setFormData({
                                                    ...formData,
                                                    unit_id: unitId,
                                                    amount: finalPrice,
                                                    currency: finalCurrency
                                                })
                                            }}
                                        >
                                            <option value="">Seçiniz</option>
                                            {units
                                                .filter((u: any) => {
                                                    if (!formData.project_id) return true
                                                    const uProjId = u.project_id || u.projectId || (u.project && u.project.id)
                                                    return String(uProjId) === String(formData.project_id)
                                                })
                                                .map((u: any) => (
                                                    <option key={u.id} value={u.id}>{u.block ? `${u.block} / ` : ''}{u.unit_number}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Satış Fiyatı <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                                className="pr-12"
                                            />
                                            <div className="absolute right-3 top-2 text-sm text-muted-foreground font-semibold">
                                                {formData.currency}
                                            </div>
                                        </div>
                                        {activeOffer?.status === 'Accepted' && (
                                            <p className="text-[10px] text-green-600 font-medium">Fiyat onaylı tekliften aktarıldı</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Para Birimi</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.currency}
                                            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        >
                                            <option value="TRY">TL</option>
                                            <option value="USD">USD</option>
                                            <option value="EUR">EUR</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Teslim Tarihi</Label>
                                        <Input
                                            type="date"
                                            value={formData.delivery_date}
                                            onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Unit Info Side Card */}
                            <div className="space-y-4">
                                <Label>Ünite Durumu</Label>
                                <Card className={`border-2 ${!formData.unit_id ? 'border-dashed opacity-50' : activeReservation ? 'border-orange-200 bg-orange-50' : activeOffer ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
                                    <CardContent className="p-4 flex flex-col items-center justify-center min-h-[160px] text-center">
                                        {!formData.unit_id ? (
                                            <div className="text-muted-foreground">
                                                <p className="text-sm font-medium">Ünite Seçiniz</p>
                                                <p className="text-xs">Durum bilgisi için proje ve ünite seçin.</p>
                                            </div>
                                        ) : activeReservation ? (
                                            <div className="space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2 text-orange-600">🕒</div>
                                                <p className="text-sm font-bold text-orange-800">Ünite Rezerve Edilmiş</p>
                                                <div className="text-xs text-orange-700 space-y-1">
                                                    <p>Müşteri: <span className="font-semibold">{activeReservation.customer?.full_name}</span></p>
                                                    <p>Opsiyon: <span className="font-semibold">{new Date(activeReservation.reservation_expiry).toLocaleDateString('tr-TR')}</span></p>
                                                </div>
                                            </div>
                                        ) : activeOffer ? (
                                            <div className="space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 text-blue-600">📄</div>
                                                <p className="text-sm font-bold text-blue-800">Bekleyen Teklif Var</p>
                                                <div className="text-xs text-blue-700 space-y-1">
                                                    <p>Müşteri: <span className="font-semibold">{activeOffer.customer?.full_name}</span></p>
                                                    <p>Geçerlilik: <span className="font-semibold">{new Date(activeOffer.valid_until).toLocaleDateString('tr-TR')}</span></p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2 text-green-600">✅</div>
                                                <p className="text-sm font-bold text-green-800">Sözleşmeye Açık</p>
                                                <p className="text-xs text-green-700">Ünite üzerinde bekleyen bir işlem bulunmamaktadır.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button onClick={nextStep}>İleri</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Customers */}
            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Müşteri Seçimi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Müşteriler</Label>
                            <div className="border rounded-md p-4 h-64 overflow-y-auto space-y-2">
                                {customers.map((c: any) => (
                                    <div key={c.id} className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id={c.id}
                                            checked={formData.selectedCustomers.includes(c.id)}
                                            onChange={(e) => {
                                                const selected = formData.selectedCustomers
                                                if (e.target.checked) setFormData({ ...formData, selectedCustomers: [...selected, c.id] })
                                                else setFormData({ ...formData, selectedCustomers: selected.filter(id => id !== c.id) })
                                            }}
                                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <label htmlFor={c.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {c.full_name} <span className="text-muted-foreground ml-2">{c.phone}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">Birden fazla müşteri seçebilirsiniz (Ortaklık).</p>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={prevStep}>Geri</Button>
                            <Button onClick={nextStep} disabled={formData.selectedCustomers.length === 0}>İleri</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Payment Plan */}
            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ödeme Planı</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <PaymentPlanEditor
                            totalAmount={formData.amount}
                            currency={formData.currency}
                            templates={templates}
                            onChange={handlePaymentPlanChange}
                        />

                        <div className="flex justify-between pt-4 border-t">
                            <Button variant="outline" onClick={prevStep}>Geri</Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sözleşmeyi Oluştur
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
