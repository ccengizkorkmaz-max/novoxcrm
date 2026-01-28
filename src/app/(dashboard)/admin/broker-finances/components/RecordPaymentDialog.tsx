'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlusCircle, Loader2, Check } from "lucide-react"
import { recordBrokerPayment } from '@/app/broker/finance-actions'
import { toast } from 'sonner'
import { Checkbox } from "@/components/ui/checkbox"

interface RecordPaymentDialogProps {
    brokerId: string
    unpaidItems: {
        id: string
        type: 'commission' | 'incentive'
        label: string
        amount: number
    }[]
}

export default function RecordPaymentDialog({ brokerId, unpaidItems }: RecordPaymentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [formData, setFormData] = useState({
        payment_method: 'Banka Transferi',
        reference_no: '',
        notes: ''
    })

    const totalSelectedAmount = unpaidItems
        .filter(item => selectedIds.includes(item.id))
        .reduce((sum, item) => sum + item.amount, 0)

    const handleToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedIds.length === 0) {
            toast.error('Lütfen en az bir kalem seçin.')
            return
        }

        setLoading(true)
        const res = await recordBrokerPayment({
            broker_id: brokerId,
            amount: totalSelectedAmount,
            currency: 'TRY',
            payment_method: formData.payment_method,
            reference_no: formData.reference_no,
            notes: formData.notes,
            itemIds: unpaidItems
                .filter(item => selectedIds.includes(item.id))
                .map(item => ({ type: item.type, id: item.id }))
        })

        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Ödeme kaydı başarıyla oluşturuldu.')
            setOpen(false)
            setSelectedIds([])
            setFormData({ payment_method: 'Banka Transferi', reference_no: '', notes: '' })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Ödeme Girişi Yap
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Ödeme Kaydı</DialogTitle>
                        <DialogDescription>
                            Brokerın hakedişlerini kapatmak için ödeme bilgilerini girin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Hakediş Seçimi</Label>
                            <div className="space-y-1">
                                {unpaidItems.length > 0 ? (
                                    unpaidItems.map((item) => (
                                        <div key={item.id} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                            <Checkbox
                                                id={item.id}
                                                checked={selectedIds.includes(item.id)}
                                                onCheckedChange={() => handleToggle(item.id)}
                                            />
                                            <label htmlFor={item.id} className="flex-1 text-xs cursor-pointer select-none">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-slate-700">{item.label}</span>
                                                    <span className="font-bold text-blue-600">{item.amount.toLocaleString('tr-TR')} ₺</span>
                                                </div>
                                            </label>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs italic text-slate-400 p-4 text-center border border-dashed rounded">Ödeme bekleyen hakediş bulunmuyor.</p>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-4 pt-2 border-t">
                            <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg border border-blue-100">
                                <span className="text-xs font-bold text-blue-800">Toplam Ödeme:</span>
                                <span className="text-lg font-black text-blue-900">{totalSelectedAmount.toLocaleString('tr-TR')} ₺</span>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="method">Ödeme Yöntemi</Label>
                                <Input
                                    id="method"
                                    value={formData.payment_method}
                                    onChange={e => setFormData(prev => ({ ...prev, payment_method: e.target.value }))}
                                    placeholder="örn: Banka Transferi, Nakit"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ref">Referans / Dekont No</Label>
                                <Input
                                    id="ref"
                                    value={formData.reference_no}
                                    onChange={e => setFormData(prev => ({ ...prev, reference_no: e.target.value }))}
                                    placeholder="Bankanın verdiği referans numarası"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notlar</Label>
                                <Textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Ödeme ile ilgili notlar..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading || selectedIds.length === 0}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                            Ödemeyi Onayla
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
