'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Save, X, Banknote, AlertCircle, Plus, Trash2 } from 'lucide-react'
import { updateCommissionRule, createCommissionRule, deleteCommissionRule } from '../commission-actions'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CommissionRule {
    id: string
    role: string
    source_category: string
    payment_type: string
    rate: number
    description: string
}

interface CommissionRulesTabProps {
    rules: CommissionRule[]
}

export default function CommissionRulesTab({ rules }: CommissionRulesTabProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAdding, setIsAdding] = useState(false)
    const [isPending, setIsPending] = useState(false)

    async function handleUpdate(formData: FormData) {
        setIsPending(true)
        const result = await updateCommissionRule(formData)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Kural güncellendi')
            setEditingId(null)
        }
    }

    async function handleCreate(formData: FormData) {
        setIsPending(true)
        const result = await createCommissionRule(formData)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Kural oluşturuldu')
            setIsAdding(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return
        setIsPending(true)
        const result = await deleteCommissionRule(id)
        setIsPending(false)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Kural silindi')
        }
    }

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'company': return 'Şirket (Meta/Web)'
            case 'personal': return 'Bireysel (Network)'
            case 'personal_agent': return 'Bireysel Emlakçı'
            default: return source
        }
    }

    const getPaymentLabel = (payment: string) => {
        switch (payment) {
            case 'cash': return 'Peşin'
            case 'term': return 'Vadeli'
            default: return payment
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4">
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Banknote className='h-6 w-6 text-green-600' />
                        <div>
                            <CardTitle>Prim Kuralları</CardTitle>
                            <CardDescription>
                                Satış personeli için uygulanan prim oranlarını buradan yönetebilirsiniz.
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setIsAdding(true)}
                        disabled={isAdding || isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Yeni Kural Ekle
                    </Button>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700 space-y-1">
                        <p className="font-semibold">Önemli Hesaplama Kuralları:</p>
                        <ul className="list-disc list-inside space-y-0.5 opacity-90">
                            <li>Primler sadece <strong>Peşinat (Down Payment)</strong> tutarı üzerinden hesaplanır.</li>
                            <li>Kapora ödemeleri ve taksitli kısımlar prime dahil edilmez.</li>
                            <li>Tamamı peşin satışlarda (Peşinat %100), toplam satış bedeli üzerinden prim hesaplanır.</li>
                            <li>Vadeli tutarlar (taksitler) üzerinden prim hakedişi oluşmaz.</li>
                        </ul>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50">
                            <TableHead className="font-bold">Kaynak</TableHead>
                            <TableHead className="font-bold">Ödeme Tipi</TableHead>
                            <TableHead className="font-bold">Oran (%)</TableHead>
                            <TableHead className="font-bold">Açıklama</TableHead>
                            <TableHead className="text-right font-bold">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isAdding && (
                            <TableRow className="bg-blue-50/30">
                                <TableCell>
                                    <form id="new-rule-form" action={handleCreate}>
                                        <Select name="source_category" required>
                                            <SelectTrigger className="h-8 w-40 bg-white">
                                                <SelectValue placeholder="Kaynak Seçin" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="company">Şirket (Meta/Web)</SelectItem>
                                                <SelectItem value="personal">Bireysel (Network)</SelectItem>
                                                <SelectItem value="personal_agent">Bireysel Emlakçı</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </form>
                                </TableCell>
                                <TableCell>
                                    <Select name="payment_type" form="new-rule-form" required>
                                        <SelectTrigger className="h-8 w-24 bg-white">
                                            <SelectValue placeholder="Tip" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Peşin</SelectItem>
                                            <SelectItem value="term">Vadeli</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Input name="rate" form="new-rule-form" type="number" step="0.01" placeholder="2.0" className="h-8 w-20 text-right bg-white" required />
                                        <span className="text-sm">%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Input name="description" form="new-rule-form" placeholder="Kural açıklaması..." className="h-8 bg-white" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="ghost" type="submit" form="new-rule-form" disabled={isPending}>
                                            <Save className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} disabled={isPending}>
                                            <X className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                        {rules.map((rule) => (
                            <TableRow key={rule.id} className="group hover:bg-slate-50 transition-colors">
                                <TableCell className="font-medium">
                                    <Badge variant="outline">{getSourceLabel(rule.source_category)}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={rule.payment_type === 'cash' ? 'default' : 'secondary'}>
                                        {getPaymentLabel(rule.payment_type)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {editingId === rule.id ? (
                                        <form id={`edit-rule-${rule.id}`} action={handleUpdate} className="flex items-center gap-1">
                                            <input type="hidden" name="id" value={rule.id} />
                                            <Input
                                                name="rate"
                                                type="number"
                                                step="0.01"
                                                defaultValue={(rule.rate * 100).toFixed(2)}
                                                className="h-8 w-20 text-right bg-white"
                                            />
                                            <span className="text-sm text-muted-foreground">%</span>
                                        </form>
                                    ) : (
                                        <span className="font-bold text-slate-700">
                                            %{(rule.rate * 100).toFixed(2)}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === rule.id ? (
                                        <Input form={`edit-rule-${rule.id}`} name="description" defaultValue={rule.description || ''} className="h-8 bg-white" />
                                    ) : (
                                        <span className="text-muted-foreground text-sm">
                                            {rule.description || '-'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {editingId === rule.id ? (
                                            <>
                                                <Button size="sm" variant="ghost" type="submit" form={`edit-rule-${rule.id}`} disabled={isPending}>
                                                    <Save className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="sm" variant="ghost" type="button" onClick={() => setEditingId(null)}>
                                                    <X className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    type="button"
                                                    title="Düzenle"
                                                    className="text-slate-400 hover:text-blue-600"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setEditingId(rule.id)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    type="button"
                                                    title="Sil"
                                                    className="text-slate-400 hover:text-red-600"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        handleDelete(rule.id)
                                                    }}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rules.length === 0 && !isAdding && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Henüz kural tanımlanmamış.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

