'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
    Calculator,
    Sparkles,
    Building2,
    User,
    UserPlus,
    Wallet,
    Calendar,
    CheckCircle2,
    Percent,
    ArrowRight,
    Copy,
    Share2,
    Printer,
    Save,
    TrendingUp,
    ShieldAlert,
    Landmark,
    Coins,
    DollarSign,
    RefreshCw,
    Plus,
    Trash2,
    ChevronRight,
    Layers,
    Info,
    ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { calculatePaymentSchedule } from '@/lib/utils/payment-calc'
import { quickCreateCustomer, saveQuoteToCRM } from './actions'

interface Props {
    projects: any[]
    units: any[]
    customers: any[]
    templates: any[]
    currentUser: {
        id: string
        name: string
        role: string
        isAdmin: boolean
        isManager: boolean
    }
}

interface Scenario {
    id: string
    title: string
    downPaymentRate: number
    months: number
    applyInterest: boolean
    interestRate: number
    interims: { month: number; amount: number }[]
    templateId?: string
}

export default function PricingStudioClient({
    projects,
    units,
    customers,
    templates,
    currentUser
}: Props) {
    // ----------------------------------------------------
    // 1. Context Selection (Customer & Project & Unit)
    // ----------------------------------------------------
    const [customerList, setCustomerList] = useState(customers)
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
    const [customerSearch, setCustomerSearch] = useState('')
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
    const [newCustName, setNewCustName] = useState('')
    const [newCustPhone, setNewCustPhone] = useState('')
    const [newCustEmail, setNewCustEmail] = useState('')
    const [creatingCustomer, setCreatingCustomer] = useState(false)

    const [selectedProjectId, setSelectedProjectId] = useState<string>('')
    const [selectedUnitId, setSelectedUnitId] = useState<string>('')

    // Live Exchange Rates (Reference TCMB or customizable)
    const [fxUsd, setFxUsd] = useState<number>(34.50)
    const [fxEur, setFxEur] = useState<number>(38.20)
    const [fxGbp, setFxGbp] = useState<number>(44.80)

    // Filter units by selected project
    const filteredUnits = useMemo(() => {
        if (!selectedProjectId) return units
        return units.filter(u => u.project_id === selectedProjectId)
    }, [units, selectedProjectId])

    const selectedUnit = useMemo(() => {
        return units.find(u => u.id === selectedUnitId) || null
    }, [units, selectedUnitId])

    const selectedCustomer = useMemo(() => {
        return customerList.find(c => c.id === selectedCustomerId) || null
    }, [customerList, selectedCustomerId])

    // Filter customers by search term
    const filteredCustomers = useMemo(() => {
        if (!customerSearch) return customerList.slice(0, 30)
        const q = customerSearch.toLowerCase()
        return customerList.filter(c =>
            c.full_name?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.company_name?.toLowerCase().includes(q)
        ).slice(0, 30)
    }, [customerList, customerSearch])

    // ----------------------------------------------------
    // 2. Pricing & Discount Matrix
    // ----------------------------------------------------
    const [currency, setCurrency] = useState<string>('TRY')
    const [listPrice, setListPrice] = useState<number>(0)
    const [discountMode, setDiscountMode] = useState<'percent' | 'amount'>('percent')
    const [discountValue, setDiscountValue] = useState<number>(0)
    const [campaignDiscountRate, setCampaignDiscountRate] = useState<number>(0)
    const [customNotes, setCustomNotes] = useState<string>('')

    // Load price and currency when unit changes
    useEffect(() => {
        if (selectedUnit) {
            setListPrice(Number(selectedUnit.price) || 0)
            setCurrency(selectedUnit.currency || 'TRY')
            setDiscountValue(0)
            setCampaignDiscountRate(0)
        }
    }, [selectedUnit])

    // Calculated final price after discounts
    const discountAmount = useMemo(() => {
        let totalDisc = 0
        if (discountMode === 'percent') {
            totalDisc += (listPrice * (discountValue / 100))
        } else {
            totalDisc += discountValue
        }
        if (campaignDiscountRate > 0) {
            totalDisc += (listPrice * (campaignDiscountRate / 100))
        }
        return Math.min(listPrice, Math.round(totalDisc))
    }, [listPrice, discountMode, discountValue, campaignDiscountRate])

    const finalPrice = Math.max(0, listPrice - discountAmount)
    const totalDiscountRate = listPrice > 0 ? ((discountAmount / listPrice) * 100).toFixed(1) : '0'

    // Metrekare unit prices
    const netSqm = Number(selectedUnit?.net_sqm) || 0
    const grossSqm = Number(selectedUnit?.gross_sqm) || 0
    const netUnitPrice = netSqm > 0 ? Math.round(finalPrice / netSqm) : 0
    const grossUnitPrice = grossSqm > 0 ? Math.round(finalPrice / grossSqm) : 0

    // Representative authorization limit warning (> %5 discount)
    const repDiscountRate = discountMode === 'percent' ? discountValue : (listPrice > 0 ? (discountValue / listPrice) * 100 : 0)
    const requiresManagerApproval = repDiscountRate > 5 && !currentUser.isManager && !currentUser.isAdmin

    // ----------------------------------------------------
    // 3. Payment Plan Scenarios (Scenario A, B, C)
    // ----------------------------------------------------
    const [activeScenarioId, setActiveScenarioId] = useState<'A' | 'B' | 'C'>('A')
    const [scenarios, setScenarios] = useState<Record<'A' | 'B' | 'C', Scenario>>({
        A: {
            id: 'A',
            title: 'Senaryo A (Standart)',
            downPaymentRate: 25,
            months: 24,
            applyInterest: false,
            interestRate: 1.5,
            interims: []
        },
        B: {
            id: 'B',
            title: 'Senaryo B (Ara Ödemeli)',
            downPaymentRate: 35,
            months: 36,
            applyInterest: false,
            interestRate: 1.5,
            interims: [
                { month: 6, amount: 0 },
                { month: 12, amount: 0 }
            ]
        },
        C: {
            id: 'C',
            title: 'Senaryo C (Özel / Peşin)',
            downPaymentRate: 50,
            months: 12,
            applyInterest: false,
            interestRate: 0,
            interims: []
        }
    })

    const currentScenario = scenarios[activeScenarioId]

    const updateCurrentScenario = (updates: Partial<Scenario>) => {
        setScenarios(prev => ({
            ...prev,
            [activeScenarioId]: {
                ...prev[activeScenarioId],
                ...updates
            }
        }))
    }

    // Apply template to current scenario
    const handleApplyTemplate = (templateId: string) => {
        const tmpl = templates.find(t => t.id === templateId)
        if (!tmpl) return
        const downRate = Number(tmpl.down_payment_rate) || currentScenario.downPaymentRate
        const instCount = Number(tmpl.installment_count) || currentScenario.months
        let inters = currentScenario.interims
        if (Array.isArray(tmpl.interim_payment_structure)) {
            inters = tmpl.interim_payment_structure.map((i: any) => ({
                month: i.month,
                amount: Math.round(finalPrice * (Number(i.rate) / 100))
            }))
        }
        updateCurrentScenario({
            templateId,
            downPaymentRate: downRate,
            months: instCount,
            interims: inters
        })
        toast.success(`"${tmpl.name}" şablonu uygulandı`)
    }

    // Interim payment helpers for current scenario
    const addInterim = () => {
        updateCurrentScenario({
            interims: [...currentScenario.interims, { month: 6, amount: 0 }]
        })
    }

    const removeInterim = (idx: number) => {
        const updated = [...currentScenario.interims]
        updated.splice(idx, 1)
        updateCurrentScenario({ interims: updated })
    }

    const updateInterim = (idx: number, field: 'month' | 'amount', val: number) => {
        const updated = [...currentScenario.interims]
        updated[idx] = { ...updated[idx], [field]: val }
        updateCurrentScenario({ interims: updated })
    }

    // Calculate schedule for the active scenario
    const activeSchedule = useMemo(() => {
        if (finalPrice <= 0) return { items: [], totalInterest: 0, grandTotal: 0 }
        const downAmount = Math.round(finalPrice * (currentScenario.downPaymentRate / 100))
        const res = calculatePaymentSchedule({
            principal: finalPrice,
            downPaymentAmount: downAmount,
            monthlyInterestRate: currentScenario.applyInterest ? currentScenario.interestRate : 0,
            installmentCount: currentScenario.months,
            startDate: new Date().toISOString().split('T')[0],
            currency,
            interimPayments: currentScenario.interims,
            installmentStartRule: 'NextMonth15th'
        })
        return res
    }, [finalPrice, currentScenario, currency])

    // Scenario KPI quick comparisons
    const scenarioSummaries = useMemo(() => {
        return (['A', 'B', 'C'] as const).map(key => {
            const sc = scenarios[key]
            const down = Math.round(finalPrice * (sc.downPaymentRate / 100))
            const totalInterim = sc.interims.reduce((s, i) => s + (Number(i.amount) || 0), 0)
            const remaining = Math.max(0, finalPrice - down - totalInterim)
            const monthly = sc.months > 0 ? Math.round(remaining / sc.months) : 0
            return {
                id: key,
                title: sc.title,
                downAmount: down,
                downRate: sc.downPaymentRate,
                months: sc.months,
                monthly,
                totalInterim,
                grandTotal: finalPrice
            }
        })
    }, [finalPrice, scenarios])

    // ----------------------------------------------------
    // 4. Utility Calculations (ROI, Tapu Harcı, Banka Kredisi)
    // ----------------------------------------------------
    // ROI & Amortisman
    const [estimatedMonthlyRent, setEstimatedMonthlyRent] = useState<number>(0)
    useEffect(() => {
        // Auto estimate roughly ~ 1/240 of final price
        if (finalPrice > 0 && estimatedMonthlyRent === 0) {
            setEstimatedMonthlyRent(Math.round(finalPrice / 240))
        }
    }, [finalPrice])

    const annualRentIncome = estimatedMonthlyRent * 12
    const grossRoiPercent = finalPrice > 0 ? ((annualRentIncome / finalPrice) * 100).toFixed(1) : '0'
    const amortizationYears = annualRentIncome > 0 ? (finalPrice / annualRentIncome).toFixed(1) : '0'

    // Tapu Harcı & Resmi Masraflar
    const buyerDeedFee = Math.round(finalPrice * 0.02)
    const sellerDeedFee = Math.round(finalPrice * 0.02)
    const revolvingFundFee = 8500 // Döner sermaye ortalama
    const totalDeedExpenses = buyerDeedFee + sellerDeedFee + revolvingFundFee

    // Banka Kredisi Simülatörü
    const [creditAmount, setCreditAmount] = useState<number>(0)
    const [creditMonths, setCreditMonths] = useState<number>(120)
    const [creditInterestRate, setCreditInterestRate] = useState<number>(2.89)

    useEffect(() => {
        // Default %50 credit
        if (finalPrice > 0 && creditAmount === 0) {
            setCreditAmount(Math.round(finalPrice * 0.5))
        }
    }, [finalPrice])

    const creditMonthlyPayment = useMemo(() => {
        if (creditAmount <= 0 || creditMonths <= 0) return 0
        const r = (creditInterestRate / 100)
        if (r === 0) return Math.round(creditAmount / creditMonths)
        // Annuity formula: P * (r * (1+r)^n) / ((1+r)^n - 1)
        const monthly = creditAmount * (r * Math.pow(1 + r, creditMonths)) / (Math.pow(1 + r, creditMonths) - 1)
        return Math.round(monthly)
    }, [creditAmount, creditMonths, creditInterestRate])

    const creditTotalRepayment = creditMonthlyPayment * creditMonths

    // ----------------------------------------------------
    // 5. Actions: Quick Customer, WhatsApp Message, Save to CRM
    // ----------------------------------------------------
    const [savingQuote, setSavingQuote] = useState(false)

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCustName.trim()) {
            toast.error('Lütfen müşteri adını girin')
            return
        }
        setCreatingCustomer(true)
        const res = await quickCreateCustomer({
            full_name: newCustName,
            phone: newCustPhone,
            email: newCustEmail
        })
        setCreatingCustomer(false)
        if (res.error) {
            toast.error(res.error)
            return
        }
        if (res.customer) {
            setCustomerList(prev => [res.customer, ...prev])
            setSelectedCustomerId(res.customer.id)
            setShowQuickCustomerModal(false)
            setNewCustName('')
            setNewCustPhone('')
            setNewCustEmail('')
            toast.success('Yeni müşteri oluşturuldu ve seçildi!')
        }
    }

    const generateWhatsAppText = () => {
        const custName = selectedCustomer?.full_name || 'Değerli Müşterimiz'
        const projName = projects.find(p => p.id === selectedProjectId)?.name || 'Projemiz'
        const unitNo = selectedUnit?.unit_number ? `No: ${selectedUnit.unit_number}` : ''
        const downAmount = Math.round(finalPrice * (currentScenario.downPaymentRate / 100))
        const remaining = Math.max(0, finalPrice - downAmount)
        const monthly = currentScenario.months > 0 ? Math.round(remaining / currentScenario.months) : 0

        return `Sayın *${custName}*,

*${projName}* ${unitNo ? `(${unitNo})` : ''} için hazırladığımız özel teklif çalışmamız:

🏢 *Gayrimenkul Detayı:* ${selectedUnit?.type || 'Daire'} ${selectedUnit?.net_sqm ? `• ${selectedUnit.net_sqm} m² Net` : ''}
💰 *Özel Satış Bedeli:* ${finalPrice.toLocaleString('tr-TR')} ${currency}
${discountAmount > 0 ? `🎁 *İndirim Avantajı:* ${discountAmount.toLocaleString('tr-TR')} ${currency} (%${totalDiscountRate})\n` : ''}
📋 *Ödeme Planı (${currentScenario.title}):*
• *Peşinat:* %${currentScenario.downPaymentRate} (${downAmount.toLocaleString('tr-TR')} ${currency})
• *Vade:* ${currentScenario.months} Ay
• *Aylık Taksit:* ~${monthly.toLocaleString('tr-TR')} ${currency}/ay
${currentScenario.interims.length > 0 ? `• *Ara Ödemeler:* ${currentScenario.interims.length} Adet\n` : ''}
Bu teklif bilgi amaçlı hazırlanmış olup detaylı bilgi için dilediğiniz zaman iletişime geçebilirsiniz.

Saygılarımızla,
*${currentUser.name}*
NovoCRM Satış Yönetimi`
    }

    const copyWhatsAppText = () => {
        const txt = generateWhatsAppText()
        navigator.clipboard.writeText(txt)
        toast.success('WhatsApp teklif metni panoya kopyalandı!')
    }

    const openWhatsAppDirect = () => {
        const txt = generateWhatsAppText()
        const phone = selectedCustomer?.phone ? selectedCustomer.phone.replace(/\D/g, '') : ''
        const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(txt)}` : `https://wa.me/?text=${encodeURIComponent(txt)}`
        window.open(url, '_blank')
    }

    const handleSaveToCRM = async () => {
        if (!selectedCustomerId) {
            toast.error('Lütfen bir müşteri seçin!')
            return
        }
        if (finalPrice <= 0) {
            toast.error('Lütfen geçerli bir satış bedeli girin!')
            return
        }

        setSavingQuote(true)
        const downAmount = Math.round(finalPrice * (currentScenario.downPaymentRate / 100))

        const res = await saveQuoteToCRM({
            customerId: selectedCustomerId,
            unitId: selectedUnitId || undefined,
            finalPrice,
            currency,
            scenarioTitle: currentScenario.title,
            downPaymentAmount: downAmount,
            downPaymentRate: currentScenario.downPaymentRate,
            installmentCount: currentScenario.months,
            paymentItems: activeSchedule.items,
            notes: customNotes
        })
        setSavingQuote(false)

        if (res.error) {
            toast.error(`Kaydetme hatası: ${res.error}`)
        } else {
            toast.success('Teklif ve ödeme planı CRM Pipeline\'a başarıyla kaydedildi!')
        }
    }

    return (
        <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto p-4 lg:p-6 space-y-5">
            {/* ---------------------------------------------------- */}
            {/* Header & Quick Context Bar                           */}
            {/* ---------------------------------------------------- */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
                        <Calculator className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Fiyat & Teklif Çalışma Masası
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60">
                                Pricing Studio
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Müşteriye özel fiyat simülasyonu, indirim matrisi, çoklu ödeme senaryoları ve yatırım analizleri.
                        </p>
                    </div>
                </div>

                {/* Currency Quick Rates Badge */}
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" /> Kurlar:
                    </span>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200/60 dark:border-slate-700">
                        USD: <b className="text-slate-900 dark:text-slate-100">{fxUsd} ₺</b>
                    </span>
                    <span className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded-md border border-slate-200/60 dark:border-slate-700">
                        EUR: <b className="text-slate-900 dark:text-slate-100">{fxEur} ₺</b>
                    </span>
                </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Step 1: Customer & Property Selection Context        */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Customer Selector */}
                <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-blue-500" /> 1. Müşteri Seçimi
                        </Label>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowQuickCustomerModal(true)}
                            className="h-7 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 flex items-center gap-1 px-2"
                        >
                            <UserPlus className="w-3.5 h-3.5" /> Hızlı Yeni Müşteri
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <select
                            value={selectedCustomerId}
                            onChange={e => setSelectedCustomerId(e.target.value)}
                            className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">-- Listeden Müşteri Seçin ({customerList.length} kayıt) --</option>
                            {customerList.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.full_name} {c.phone ? `(${c.phone})` : ''} {c.company_name ? `• ${c.company_name}` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedCustomer && (
                            <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
                                <span className="font-bold text-blue-800 dark:text-blue-300">
                                    {selectedCustomer.full_name}
                                </span>
                                <span className="text-slate-500 dark:text-slate-400">
                                    {selectedCustomer.phone || selectedCustomer.email || 'İletişim bilgisi yok'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Project & Unit Selector */}
                <div className="md:col-span-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" /> 2. Proje & Ünite Seçimi
                    </Label>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <select
                                value={selectedProjectId}
                                onChange={e => {
                                    setSelectedProjectId(e.target.value)
                                    setSelectedUnitId('')
                                }}
                                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">-- Tüm Projeler --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <select
                                value={selectedUnitId}
                                onChange={e => setSelectedUnitId(e.target.value)}
                                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">-- Ünite Seçin ({filteredUnits.length}) --</option>
                                {filteredUnits.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.unit_number} {u.block ? `(${u.block})` : ''} - {u.type} • {Number(u.price).toLocaleString('tr-TR')} {u.currency}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedUnit && (
                        <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 dark:text-slate-100">
                                    No: {selectedUnit.unit_number} {selectedUnit.block ? `(${selectedUnit.block})` : ''}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">
                                    {selectedUnit.type}
                                </span>
                                {selectedUnit.net_sqm && (
                                    <span className="text-slate-500 text-[11px]">
                                        Net: {selectedUnit.net_sqm} m² | Brüt: {selectedUnit.gross_sqm || '-'} m²
                                    </span>
                                )}
                            </div>
                            {currentUser.isAdmin && selectedUnit.cost && (
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/60">
                                    🛡️ Maliyet: {Number(selectedUnit.cost).toLocaleString('tr-TR')} {currency}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Main Work Desk: 3 Columns Grid                      */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* ------------------------------------------------ */}
                {/* Column 1: Pricing & Discount Simulation (3.5 col) */}
                {/* ------------------------------------------------ */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                <Percent className="w-4 h-4 text-emerald-500" /> Fiyat & İskonto Matrisi
                            </Label>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                Canlı Hesap
                            </span>
                        </div>

                        {/* Base Price & Currency */}
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liste Fiyatı & Para Birimi</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={listPrice || ''}
                                    onChange={e => setListPrice(Number(e.target.value) || 0)}
                                    placeholder="0"
                                    className="h-10 text-sm font-bold bg-white dark:bg-slate-950 flex-1"
                                />
                                <select
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    className="h-10 w-24 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                                >
                                    <option value="TRY">TRY (₺)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                        </div>

                        {/* Discount Mode & Value */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temsilci İskontosu</Label>
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                                    <button
                                        type="button"
                                        onClick={() => setDiscountMode('percent')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${discountMode === 'percent' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                    >
                                        Yüzde (%)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDiscountMode('amount')}
                                        className={`px-2 py-0.5 rounded-md transition-all ${discountMode === 'amount' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                    >
                                        Tutar ({currency})
                                    </button>
                                </div>
                            </div>

                            <Input
                                type="number"
                                value={discountValue || ''}
                                onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                                placeholder={discountMode === 'percent' ? 'Örn: 5' : 'Örn: 150000'}
                                className="h-10 text-sm font-bold bg-white dark:bg-slate-950"
                            />

                            {requiresManagerApproval && (
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold animate-in fade-in">
                                    <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600" />
                                    <span>%5 üzeri indirim yönetici onayı gerektirir.</span>
                                </div>
                            )}
                        </div>

                        {/* Campaign Discount */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Özel Kampanya İndirimi (%)</Label>
                            <select
                                value={campaignDiscountRate}
                                onChange={e => setCampaignDiscountRate(Number(e.target.value))}
                                className="w-full h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-800 dark:text-slate-200"
                            >
                                <option value={0}>Kampanya Yok (%0)</option>
                                <option value={3}>Lansman Özel İndirimi (%3)</option>
                                <option value={5}>Kurumsal / Referans İndirimi (%5)</option>
                                <option value={8}>Tam Peşin Alım İndirimi (%8)</option>
                                <option value={10}>VIP Yatırımcı İndirimi (%10)</option>
                            </select>
                        </div>

                        {/* Final Calculation Box */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-3">
                            <div className="flex justify-between items-center text-xs text-slate-300">
                                <span>Toplam İndirim Avantajı:</span>
                                <span className="font-bold text-emerald-400">
                                    -{discountAmount.toLocaleString('tr-TR')} {currency} (%{totalDiscountRate})
                                </span>
                            </div>

                            <div className="border-t border-slate-700/80 pt-2">
                                <Label className="text-[10px] uppercase font-black text-blue-300 tracking-wider block mb-1">
                                    Efektif Satış Bedeli
                                </Label>
                                <div className="text-2xl font-black text-white tracking-tight">
                                    {finalPrice.toLocaleString('tr-TR')} {currency}
                                </div>
                            </div>

                            {(netSqm > 0 || grossSqm > 0) && (
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/80 text-[11px] text-slate-300">
                                    {netSqm > 0 && (
                                        <div>
                                            <span className="text-[9px] uppercase text-slate-400 block">Net M² Birim:</span>
                                            <b className="text-white">{netUnitPrice.toLocaleString('tr-TR')} {currency}/m²</b>
                                        </div>
                                    )}
                                    {grossSqm > 0 && (
                                        <div>
                                            <span className="text-[9px] uppercase text-slate-400 block">Brüt M² Birim:</span>
                                            <b className="text-white">{grossUnitPrice.toLocaleString('tr-TR')} {currency}/m²</b>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Custom Notes */}
                        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Teklif Notu / Şartlar</Label>
                            <Input
                                value={customNotes}
                                onChange={e => setCustomNotes(e.target.value)}
                                placeholder="Örn: 30 gün geçerli, beyaz eşya hediye"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* Column 2: Payment Plan Scenarios Studio (4.5 col) */}
                {/* ------------------------------------------------ */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                        {/* Scenario Tabs Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                                <Layers className="w-4 h-4 text-blue-500" /> Ödeme Planı Senaryoları
                            </Label>

                            {/* A / B / C Tabs */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                {(['A', 'B', 'C'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setActiveScenarioId(tab)}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeScenarioId === tab ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                                    >
                                        Senaryo {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Ready Template Shortcut */}
                        {templates.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-blue-500" /> Şablon:
                                </span>
                                <select
                                    onChange={e => handleApplyTemplate(e.target.value)}
                                    defaultValue=""
                                    className="flex-1 h-8 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-blue-800 dark:text-blue-200 px-2"
                                >
                                    <option value="" disabled>Bu senaryoya şablon yükle...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Current Scenario Parameter Inputs */}
                        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
                            <div>
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peşinat (%)</Label>
                                <Input
                                    type="number"
                                    value={currentScenario.downPaymentRate}
                                    onChange={e => updateCurrentScenario({ downPaymentRate: Number(e.target.value) || 0 })}
                                    className="h-9 text-sm font-bold bg-white dark:bg-slate-950 mt-1"
                                />
                                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                                    ≈ {Math.round(finalPrice * (currentScenario.downPaymentRate / 100)).toLocaleString('tr-TR')} {currency}
                                </span>
                            </div>

                            <div>
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taksit (Ay)</Label>
                                <Input
                                    type="number"
                                    value={currentScenario.months}
                                    onChange={e => updateCurrentScenario({ months: Number(e.target.value) || 0 })}
                                    className="h-9 text-sm font-bold bg-white dark:bg-slate-950 mt-1"
                                />
                                <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">
                                    {currentScenario.months > 0 ? (
                                        `≈ ${Math.round((finalPrice * (1 - currentScenario.downPaymentRate / 100)) / currentScenario.months).toLocaleString('tr-TR')} ${currency}/ay`
                                    ) : 'Peşin'}
                                </span>
                            </div>

                            {/* Interim Payments Row */}
                            <div className="col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ara Ödemeler</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={addInterim}
                                        type="button"
                                        className="h-6 text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2"
                                    >
                                        <Plus className="w-3 h-3 mr-0.5" /> Ara Ödeme Ekle
                                    </Button>
                                </div>

                                {currentScenario.interims.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center mb-1.5 animate-in fade-in">
                                        <div className="flex-1 flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400">Ay:</span>
                                            <Input
                                                type="number"
                                                value={item.month}
                                                onChange={e => updateInterim(idx, 'month', Number(e.target.value) || 0)}
                                                className="h-7 text-xs bg-white dark:bg-slate-950"
                                            />
                                        </div>
                                        <div className="flex-[2] flex items-center gap-1">
                                            <span className="text-[10px] text-slate-400">Tutar:</span>
                                            <Input
                                                type="number"
                                                value={item.amount || ''}
                                                onChange={e => updateInterim(idx, 'amount', Number(e.target.value) || 0)}
                                                className="h-7 text-xs bg-white dark:bg-slate-950 font-semibold"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeInterim(idx)}
                                            className="h-7 w-7 text-red-400 hover:text-red-500"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scenario Schedule Table Preview */}
                        <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col min-h-[220px] max-h-[280px]">
                            <div className="px-3 py-2 bg-slate-50/80 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                    Ödeme Takvimi ({activeSchedule.items.length} Kalem)
                                </span>
                                <span className="text-[10px] text-slate-400">
                                    Vade Başlangıcı: Gelecek Ay 15
                                </span>
                            </div>
                            <div className="overflow-y-auto flex-1 p-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="text-[9px] uppercase border-b border-slate-100 dark:border-slate-800">
                                            <TableHead className="h-7 pl-2">Açıklama</TableHead>
                                            <TableHead className="h-7 text-center">Vade Tarihi</TableHead>
                                            <TableHead className="h-7 text-right pr-2">Tutar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-xs divide-y divide-slate-100 dark:divide-slate-800">
                                        {activeSchedule.items.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-slate-50/50">
                                                <TableCell className="py-1.5 pl-2 font-medium text-slate-700 dark:text-slate-300">
                                                    {item.description}
                                                </TableCell>
                                                <TableCell className="py-1.5 text-center font-mono text-[11px] text-slate-500">
                                                    {new Date(item.due_date).toLocaleDateString('tr-TR')}
                                                </TableCell>
                                                <TableCell className="py-1.5 text-right pr-2 font-bold text-slate-900 dark:text-slate-100">
                                                    {Number(item.amount).toLocaleString('tr-TR')} {currency}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        {/* All Scenarios Quick Comparison Bar */}
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Senaryo Karşılaştırması
                            </span>
                            <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                {scenarioSummaries.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => setActiveScenarioId(s.id as any)}
                                        className={`p-2 rounded-lg border cursor-pointer transition-all ${activeScenarioId === s.id ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-xs' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
                                    >
                                        <b className="block text-[11px] text-slate-700 dark:text-slate-300 truncate">{s.title}</b>
                                        <span className="text-[10px] text-slate-400 block">%{s.downRate} Peşin ({s.months} Ay)</span>
                                        <b className="text-blue-600 dark:text-blue-400 font-bold block mt-1">
                                            {s.monthly.toLocaleString('tr-TR')} {currency}/ay
                                        </b>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ------------------------------------------------ */}
                {/* Column 3: Utilities & Share Actions (3.5 col)     */}
                {/* ------------------------------------------------ */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Utility 1: ROI & Amortisman */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Yatırım & ROI Hesabı
                            </Label>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                %{grossRoiPercent} Getiri
                            </span>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-[10px] text-slate-400 uppercase">Tahmini Aylık Kira ({currency})</Label>
                            <Input
                                type="number"
                                value={estimatedMonthlyRent || ''}
                                onChange={e => setEstimatedMonthlyRent(Number(e.target.value) || 0)}
                                className="h-8 text-xs font-bold bg-white dark:bg-slate-950"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs">
                            <div>
                                <span className="text-[9px] uppercase text-slate-400 block">Amortisman:</span>
                                <b className="text-slate-800 dark:text-slate-100">{amortizationYears} Yıl</b>
                            </div>
                            <div>
                                <span className="text-[9px] uppercase text-slate-400 block">Yıllık Kira:</span>
                                <b className="text-slate-800 dark:text-slate-100">{annualRentIncome.toLocaleString('tr-TR')} {currency}</b>
                            </div>
                        </div>
                    </div>

                    {/* Utility 2: Tapu Harcı & Resmi Masraflar */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Landmark className="w-3.5 h-3.5 text-blue-500" /> Tapu & Masraf Hesabı
                        </Label>

                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                            <div className="flex justify-between">
                                <span>Alıcı Tapu Harcı (%2):</span>
                                <b className="font-semibold">{buyerDeedFee.toLocaleString('tr-TR')} {currency}</b>
                            </div>
                            <div className="flex justify-between">
                                <span>Satıcı Tapu Harcı (%2):</span>
                                <b className="font-semibold">{sellerDeedFee.toLocaleString('tr-TR')} {currency}</b>
                            </div>
                            <div className="flex justify-between">
                                <span>Döner Sermaye:</span>
                                <b className="font-semibold">~{revolvingFundFee.toLocaleString('tr-TR')} ₺</b>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100">
                                <span>Toplam Resmi Masraf:</span>
                                <span className="text-blue-600 dark:text-blue-400">{totalDeedExpenses.toLocaleString('tr-TR')} {currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Utility 3: Banka Kredisi Simülatörü */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Coins className="w-3.5 h-3.5 text-amber-500" /> Banka Kredisi Simülatörü
                        </Label>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-[9px] text-slate-400 uppercase">Kredi Tutarı</Label>
                                <Input
                                    type="number"
                                    value={creditAmount || ''}
                                    onChange={e => setCreditAmount(Number(e.target.value) || 0)}
                                    className="h-7 text-xs bg-white dark:bg-slate-950"
                                />
                            </div>
                            <div>
                                <Label className="text-[9px] text-slate-400 uppercase">Vade (Ay)</Label>
                                <Input
                                    type="number"
                                    value={creditMonths}
                                    onChange={e => setCreditMonths(Number(e.target.value) || 120)}
                                    className="h-7 text-xs bg-white dark:bg-slate-950"
                                />
                            </div>
                        </div>

                        <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs">
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[10px] text-amber-800 dark:text-amber-200 uppercase font-semibold">Aylık Kredi Taksiti:</span>
                                <b className="text-amber-700 dark:text-amber-300 font-bold">{creditMonthlyPayment.toLocaleString('tr-TR')} {currency}/ay</b>
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-500">
                                <span>Toplam Geri Ödeme:</span>
                                <span>{creditTotalRepayment.toLocaleString('tr-TR')} {currency}</span>
                            </div>
                        </div>
                    </div>

                    {/* Share & Save Actions Panel */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2.5">
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-blue-500" /> Paylaşım & Kayıt
                        </Label>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={copyWhatsAppText}
                                className="h-9 text-xs font-bold text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 flex items-center justify-center gap-1 rounded-xl"
                            >
                                <Copy className="w-3.5 h-3.5" /> Metni Kopyala
                            </Button>

                            <Button
                                size="sm"
                                onClick={openWhatsAppDirect}
                                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 rounded-xl shadow-xs"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> WhatsApp'ta Aç
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="w-full h-9 text-xs font-bold text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 flex items-center justify-center gap-1 rounded-xl"
                        >
                            <Printer className="w-3.5 h-3.5" /> Teklifi Yazdır / PDF İndir
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSaveToCRM}
                            disabled={savingQuote}
                            className="w-full h-11 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center justify-center gap-2 rounded-xl shadow-md shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            {savingQuote ? 'CRM\'e Kaydediliyor...' : 'CRM\'e Teklif Olarak Kaydet'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Quick Create Customer Modal Dialog                   */}
            {/* ---------------------------------------------------- */}
            {showQuickCustomerModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <UserPlus className="w-4 h-4 text-blue-600" /> Hızlı Yeni Müşteri Ekle
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowQuickCustomerModal(false)}
                                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateCustomer} className="space-y-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Müşteri Adı Soyadı *</Label>
                                <Input
                                    required
                                    value={newCustName}
                                    onChange={e => setNewCustName(e.target.value)}
                                    placeholder="Örn: Mehmet Yılmaz"
                                    className="h-10 text-sm mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telefon Numarası</Label>
                                <Input
                                    value={newCustPhone}
                                    onChange={e => setNewCustPhone(e.target.value)}
                                    placeholder="0532 000 00 00"
                                    className="h-10 text-sm mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-Posta Adresi</Label>
                                <Input
                                    type="email"
                                    value={newCustEmail}
                                    onChange={e => setNewCustEmail(e.target.value)}
                                    placeholder="ornek@mail.com"
                                    className="h-10 text-sm mt-1"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowQuickCustomerModal(false)}
                                    className="h-10 text-xs font-bold px-4"
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={creatingCustomer}
                                    className="h-10 text-xs font-bold px-6 bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    {creatingCustomer ? 'Ekleniyor...' : 'Kaydet ve Seç'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
