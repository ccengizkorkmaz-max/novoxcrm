'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createTransaction } from '../actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface TransactionFormProps {
    accounts: any[]
}

export default function TransactionForm({ accounts }: TransactionFormProps) {
    const [isPending, startTransition] = useTransition()
    const [accountId, setAccountId] = useState('')
    const [type, setType] = useState<'Debit' | 'Credit'>('Credit')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accountId || !amount || !description) {
            toast.error('Lütfen tüm zorunlu alanları doldurun.')
            return
        }

        startTransition(async () => {
            const res = await createTransaction({
                account_id: accountId,
                type,
                amount: parseFloat(amount),
                description,
                currency: 'TRY' // Default for now
            })

            if (res.success) {
                toast.success('İşlem başarıyla kaydedildi.')
                // Reset form
                setAccountId('')
                setAmount('')
                setDescription('')
            } else {
                toast.error(res.error || 'İşlem kaydedilemedi.')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div>
                <h3 className="text-lg font-bold">Yeni İşlem Kaydı</h3>
                <p className="text-sm text-muted-foreground">Cari hesap hareketi girişi yapın.</p>
            </div>

            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Hesap Seçin</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Bir hesap seçiniz..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                            {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    {acc.account_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>İşlem Türü</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Credit">Alacak (Tahsilat/Gelir)</SelectItem>
                                <SelectItem value="Debit">Borç (Hakediş/Gider)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Tutar</Label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground font-bold">TRY</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Açıklama</Label>
                    <Textarea
                        id="description"
                        placeholder="İşlem detayı..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor...
                        </>
                    ) : (
                        'Kaydet'
                    )}
                </Button>
            </div>
        </form>
    )
}
