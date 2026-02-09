import { useState, useEffect, useTransition } from 'react'
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
import { createClient } from '@/lib/supabase/client'

interface TransactionFormProps {
    accounts: any[]
}

export default function TransactionForm({ accounts }: TransactionFormProps) {
    const [isPending, startTransition] = useTransition()
    const [accountId, setAccountId] = useState('')
    const [type, setType] = useState<'Debit' | 'Credit'>('Credit')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [projectId, setProjectId] = useState('')
    const [unitId, setUnitId] = useState('')

    const [projects, setProjects] = useState<any[]>([])
    const [units, setUnits] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        const fetchProjects = async () => {
            const { data } = await supabase.from('projects').select('id, name').order('name')
            if (data) setProjects(data)
        }
        fetchProjects()
    }, [supabase])

    useEffect(() => {
        const fetchUnits = async () => {
            if (!projectId) {
                setUnits([])
                return
            }
            const { data } = await supabase
                .from('units')
                .select('id, unit_number, block')
                .eq('project_id', projectId)
                .order('unit_number')
            if (data) setUnits(data)
        }
        fetchUnits()
    }, [projectId, supabase])

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
                currency: 'TRY',
                project_id: projectId || undefined,
                unit_id: unitId || undefined
            })

            if (res.success) {
                toast.success('İşlem başarıyla kaydedildi.')
                setAccountId('')
                setAmount('')
                setDescription('')
                setProjectId('')
                setUnitId('')
            } else {
                toast.error(res.error || 'İşlem kaydedilemedi.')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2 max-h-[85vh] overflow-y-auto px-1">
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
                                <SelectItem value="Credit">Alacak (Tahsilat / Gelir)</SelectItem>
                                <SelectItem value="Debit">Borç (Hakediş / Gider)</SelectItem>
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

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>İlgili Proje</Label>
                        <Select value={projectId} onValueChange={(v) => { setProjectId(v); setUnitId(''); }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Opsiyonel" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48">
                                <SelectItem value="NONE_SELECTED">Seçilmedi</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>İlgili Ünite</Label>
                        <Select value={unitId} onValueChange={setUnitId} disabled={!projectId || projectId === 'NONE_SELECTED'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Opsiyonel" />
                            </SelectTrigger>
                            <SelectContent className="max-h-48">
                                <SelectItem value="NONE_SELECTED">Seçilmedi</SelectItem>
                                {units.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.block} - {u.unit_number}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
