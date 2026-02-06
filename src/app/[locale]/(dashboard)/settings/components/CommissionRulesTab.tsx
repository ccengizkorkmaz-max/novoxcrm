'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Edit, Save, X, Banknote, AlertCircle } from 'lucide-react'
import { updateCommissionRule } from '../commission-actions'
import { toast } from 'sonner'
import { Badge } from "@/components/ui/badge"

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
            <CardHeader>
                <div className='flex items-center gap-2'>
                    <Banknote className='h-6 w-6 text-green-600' />
                    <div>
                        <CardTitle>Prim Kuralları</CardTitle>
                        <CardDescription>
                            Satış personeli için uygulanan prim oranlarını buradan yönetebilirsiniz.
                        </CardDescription>
                    </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
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
                        <TableRow>
                            <TableHead>Kaynak</TableHead>
                            <TableHead>Ödeme Tipi</TableHead>
                            <TableHead>Oran (%)</TableHead>
                            <TableHead>Açıklama</TableHead>
                            <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow key={rule.id}>
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
                                                className="h-8 w-20 text-right"
                                            />
                                            <span className="text-sm text-muted-foreground">%</span>
                                        </form>
                                    ) : (
                                        <span className="font-bold">
                                            %{(rule.rate * 100).toFixed(2)}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === rule.id ? (
                                        <Input form={`edit-rule-${rule.id}`} name="description" defaultValue={rule.description || ''} className="h-8" />
                                    ) : (
                                        <span className="text-muted-foreground text-sm">
                                            {rule.description || '-'}
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {editingId === rule.id ? (
                                            <>
                                                <Button size="sm" variant="ghost" type="submit" form={`edit-rule-${rule.id}`} disabled={isPending}>
                                                    <Save className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(rule.id)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rules.length === 0 && (
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
