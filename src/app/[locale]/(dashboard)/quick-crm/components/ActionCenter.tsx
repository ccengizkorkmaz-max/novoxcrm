'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import {
    Zap,
    Calendar,
    Send,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    Sparkles
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { createSale, updateSaleToReservation, updateSaleStatus, cancelReservation } from '@/app/[locale]/(dashboard)/crm/actions'
import PaymentPlanCalculator from '../../crm/components/PaymentPlanCalculator'
import { QuickOfferDialog } from './QuickOfferDialog'
import { QuickActivityDialog } from './QuickActivityDialog'
import { QuickReservationDialog } from './QuickReservationDialog'

interface Props {
    customer: any
    unit: any
    templates: any[]
    onClearCustomer: () => void
    onClearUnit: () => void
}

export function ActionCenter({ customer, unit, templates, onClearCustomer, onClearUnit }: Props) {
    const t = useTranslations('QuickCRM')
    const ti = useTranslations('Inventory')
    const [sale, setSale] = useState<any>(null)
    const [loadingSale, setLoadingSale] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (customer && unit) {
            checkExistingSale()
        } else {
            setSale(null)
        }
    }, [customer, unit])

    async function checkExistingSale() {
        setLoadingSale(true)
        try {
            const { data, error } = await supabase
                .from('sales')
                .select('*')
                .eq('customer_id', customer.id)
                .eq('unit_id', unit.id)
                .maybeSingle()

            if (data) setSale(data)
            else setSale(null)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingSale(false)
        }
    }

    async function handleStartSale() {
        const formData = new FormData()
        formData.append('customer_id', customer.id)
        formData.append('unit_id', unit.id)

        const res = await createSale(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success(t('customerSelected'))
            checkExistingSale()
        }
    }

    if (!customer || !unit) {
        return (
            <Card className="h-full border-dashed flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-400 mb-2">{t('actions')}</h3>
                <p className="text-sm text-slate-400 max-w-[200px]">
                    {!customer ? t('noCustomerSelected') : t('noUnitSelected')}
                </p>
            </Card>
        )
    }

    return (
        <Card className="h-full flex flex-col overflow-hidden bg-white shadow-xl border-slate-200">
            <CardHeader className="py-4 shrink-0 bg-slate-900 text-white">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" /> {t('actions')}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Summary Breadcrumb */}
                <div className="flex flex-col gap-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('selectedCustomer')}</span>
                        <Badge className="bg-blue-600 font-bold">{customer.full_name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('selectedUnit')}</span>
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant="secondary" className="font-bold">#{unit.unit_number} - {unit.projects?.name}</Badge>
                            {unit.status === 'Reserved' && sale && sale.status !== 'Reservation' && sale.status !== 'Opsiyonlu' && sale.status !== 'Opsiyon - Kapora Bekleniyor' && (
                                <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-600 border-orange-200 animate-pulse">
                                    {t('inQueue')}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                {unit.status === 'Reserved' && sale && sale.status !== 'Reservation' && sale.status !== 'Opsiyonlu' && sale.status !== 'Opsiyon - Kapora Bekleniyor' && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                        <p className="text-[11px] text-orange-700 leading-tight">
                            {t('queueWarning')}
                        </p>
                    </div>
                )}

                {loadingSale ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                        <span className="text-sm">Kontrol ediliyor...</span>
                    </div>
                ) : !sale ? (
                    <div className="flex flex-col gap-4 py-8 items-center text-center">
                        <AlertCircle className="h-12 w-12 text-blue-500 mb-2" />
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-900">Satış Süreci Başlatılmadı</h4>
                            <p className="text-xs text-muted-foreground px-4">Bu müşteri ve ünite için henüz bir görüşme kaydı yok.</p>
                        </div>
                        <Button className="w-full h-12 text-lg font-bold" onClick={handleStartSale} disabled={loadingSale}>
                            {loadingSale ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            {t('createSale')}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col gap-3">
                            <h4 className="font-bold text-sm flex items-center gap-2 border-b pb-2">
                                <Calendar className="h-4 w-4 text-primary" /> {t('paymentPlan')}
                            </h4>
                            <div className="bg-slate-50 rounded-xl border border-slate-200 shadow-inner overflow-hidden">
                                <PaymentPlanCalculator
                                    saleId={sale.id}
                                    totalAmount={unit.price}
                                    initialCurrency={unit.currency}
                                    templates={templates}
                                />
                            </div>
                        </div>

                    </div>
                )}
            </CardContent>
            {sale && (
                <CardFooter className="p-4 border-t bg-slate-50 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button
                            variant="outline"
                            className="flex flex-col h-16 gap-1 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                            onClick={async () => {
                                setActionLoading(true)
                                try {
                                    let res;
                                    // Simply update to Prospect (Fırsat)
                                    // No longer canceling reservation automatically!
                                    res = await updateSaleStatus(sale.id, 'Prospect')

                                    if (res?.error) {
                                        toast.error(res.error)
                                    } else {
                                        toast.success(t('createSale') + ' ' + t('unitSelected'))
                                        checkExistingSale()
                                    }
                                } finally {
                                    setActionLoading(false)
                                }
                            }}
                            disabled={actionLoading}
                        >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            <span className="text-[10px]">{t('createSale')}</span>
                        </Button>

                        <QuickReservationDialog customer={customer} unit={unit} saleId={sale.id} />

                        <QuickActivityDialog customer={customer} unit={unit} />
                        <QuickOfferDialog customer={customer} unit={unit} />
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
