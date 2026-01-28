'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { BadgeTurkishLira, Calendar, Layers, CheckCircle2, Info, Table as TableIcon } from "lucide-react"
import { getCommissionTiers, getCommissionUnitRules } from '@/app/broker/actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface CommissionModel {
    id: string
    name: string
    type: string
    value: number
    payable_stage: string
    payment_terms: string
    currency: string
    project_id: string
    projects?: { name: string }
}

export default function CommissionModelDetailDialog({
    model,
    open,
    onOpenChange
}: {
    model: CommissionModel | null
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [tiers, setTiers] = useState<any[]>([])
    const [unitRules, setUnitRules] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (open && model) {
            fetchDetails()
        }
    }, [open, model])

    async function fetchDetails() {
        if (!model) return
        setLoading(true)
        try {
            if (model.type === 'Tiered') {
                const data = await getCommissionTiers(model.id)
                setTiers(data || [])
            } else if (model.type.includes('Unit Based')) {
                const data = await getCommissionUnitRules(model.id)
                setUnitRules(data || [])
            }
        } catch (error) {
            console.error('Error fetching commission details:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!model) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-4">
                        <BadgeTurkishLira className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">{model.name}</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Bu komisyon modeli için geçerli kurallar ve hak ediş şartları.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500 uppercase">Model Tipi</span>
                        </div>
                        <Badge variant="secondary" className="bg-white border-slate-200 text-slate-700 font-bold">
                            {model.type}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                                {model.type === 'Tiered' ? 'Baz Oranı' : 'Komisyon Oranı'}
                            </p>
                            <p className="text-xl font-black text-slate-900">
                                %{model.value}
                            </p>
                        </div>
                        <div className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Para Birimi</p>
                            <p className="text-xl font-black text-slate-900">{model.currency}</p>
                        </div>
                    </div>

                    {/* Tiered Rules Display */}
                    {model.type === 'Tiered' && tiers.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <TableIcon className="h-4 w-4 text-blue-600" />
                                <span>Kademeli Komisyon Oranları</span>
                            </div>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-bold uppercase py-2">Satış Adedi</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase py-2 text-right">Oran</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {tiers.map((tier, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="py-2 text-sm font-medium">
                                                    {tier.min_units}{tier.max_units ? ` - ${tier.max_units}` : '+'} Satış
                                                </TableCell>
                                                <TableCell className="py-2 text-sm font-bold text-blue-600 text-right">
                                                    %{tier.commission_value}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {/* Unit Based Rules Display */}
                    {model.type.includes('Unit Based') && unitRules.length > 0 && (
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                                <TableIcon className="h-4 w-4 text-blue-600" />
                                <span>Ünite Bazlı Komisyon Oranları</span>
                            </div>
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-slate-50">
                                        <TableRow>
                                            <TableHead className="text-[10px] font-bold uppercase py-2">Ünite Tipi</TableHead>
                                            <TableHead className="text-[10px] font-bold uppercase py-2 text-right">Tutar/Oran</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {unitRules.map((rule, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell className="py-2 text-sm font-medium">
                                                    {rule.property_type}
                                                </TableCell>
                                                <TableCell className="py-2 text-sm font-bold text-blue-600 text-right">
                                                    {model.type === 'Fixed Unit Based' ? `${rule.commission_value.toLocaleString('tr-TR')} ${model.currency}` : `%${rule.commission_value}`}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
                        <div className="flex items-start gap-3 pt-2">
                            <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                <CheckCircle2 className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Ödeme Aşaması</p>
                                <p className="text-[13px] text-slate-500 mt-0.5">{model.payable_stage || 'Sözleşme İmzası'}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                <Info className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Ödeme Şartları</p>
                                <p className="text-[13px] text-slate-500 mt-0.5">{model.payment_terms || 'Net tutar üzerinden hesaplanır.'}</p>
                            </div>
                        </div>

                        {model.projects && (
                            <div className="flex items-start gap-3">
                                <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                    <Calendar className="h-3 w-3 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Geçerli Proje</p>
                                    <p className="text-[13px] text-slate-500 mt-0.5">{model.projects.name}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
