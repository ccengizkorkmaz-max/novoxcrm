'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Percent, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { bulkUpdatePrices } from '../actions'

interface BulkPriceUpdateProps {
    selectedUnits: string[]
    totalUnits: number
    onComplete?: () => void
}

export function BulkPriceUpdate({ selectedUnits, totalUnits, onComplete }: BulkPriceUpdateProps) {
    const [open, setOpen] = useState(false)
    const [changeType, setChangeType] = useState<'percentage' | 'fixed'>('percentage')
    const [changeValue, setChangeValue] = useState('')
    const [loading, setLoading] = useState(false)

    const [resultInfo, setResultInfo] = useState<{ updatedCount: number; skippedCount: number; skippedUnits: { unit_number: string; status: string }[] } | null>(null)

    const handleSubmit = async () => {
        const value = parseFloat(changeValue)
        if (isNaN(value)) {
            toast.error('Geçerli bir değer girin.')
            return
        }

        if (selectedUnits.length === 0) {
            toast.error('En az bir ünite seçin.')
            return
        }

        setLoading(true)
        const result = await bulkUpdatePrices(selectedUnits, changeType, value)
        setLoading(false)

        if (result.success) {
            if (result.skippedCount && result.skippedCount > 0) {
                setResultInfo({
                    updatedCount: result.updatedCount || 0,
                    skippedCount: result.skippedCount,
                    skippedUnits: result.skippedUnits || []
                })
            } else {
                toast.success(`${result.updatedCount} ünite fiyatı güncellendi.`)
                setOpen(false)
                setChangeValue('')
                onComplete?.()
            }
        } else {
            toast.error(result.error || 'Güncelleme başarısız.')
        }
    }

    const closeResultInfo = () => {
        setResultInfo(null)
        setOpen(false)
        setChangeValue('')
        onComplete?.()
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    Toplu Fiyat Güncelle
                    {selectedUnits.length > 0 && (
                        <Badge className="ml-1 text-[9px] px-1.5">{selectedUnits.length}</Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Toplu Fiyat Güncelleme
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                            <strong>{selectedUnits.length > 0 ? selectedUnits.length : totalUnits}</strong> ünite seçili
                        </span>
                    </div>

                    <div className="grid gap-3">
                        <Label className="text-sm">Güncelleme Tipi</Label>
                        <Select value={changeType} onValueChange={(v: 'percentage' | 'fixed') => setChangeType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="percentage">
                                    <span className="flex items-center gap-1.5">
                                        <Percent className="h-3.5 w-3.5" /> Yüzde Değişim
                                    </span>
                                </SelectItem>
                                <SelectItem value="fixed">
                                    <span className="flex items-center gap-1.5">
                                        <DollarSign className="h-3.5 w-3.5" /> Sabit Tutar
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3">
                        <Label className="text-sm">
                            {changeType === 'percentage' ? 'Yüzde Değeri (%)' : 'Tutar (₺)'}
                        </Label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={changeValue}
                                onChange={(e) => setChangeValue(e.target.value)}
                                placeholder={changeType === 'percentage' ? 'Örn: 10 (artış) veya -5 (indirim)' : 'Örn: 50000 veya -25000'}
                                className="pr-12"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                {changeType === 'percentage' ? '%' : '₺'}
                            </span>
                        </div>
                        {changeValue && !isNaN(parseFloat(changeValue)) && (
                            <div className="flex items-center gap-1 text-xs">
                                {parseFloat(changeValue) > 0 ? (
                                    <>
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-emerald-600">
                                            {changeType === 'percentage' ? `%${changeValue} artış` : `+₺${parseFloat(changeValue).toLocaleString('tr-TR')} artış`}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-red-600">
                                            {changeType === 'percentage' ? `%${Math.abs(parseFloat(changeValue))} indirim` : `-₺${Math.abs(parseFloat(changeValue)).toLocaleString('tr-TR')} indirim`}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleSubmit} disabled={loading || !changeValue}>
                        {loading ? 'Güncelleniyor...' : 'Fiyatları Güncelle'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Result Info Popup */}
        <Dialog open={!!resultInfo} onOpenChange={() => closeResultInfo()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Fiyat Güncelleme Sonucu</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-4">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm text-emerald-700 font-bold">{resultInfo?.updatedCount} ünite fiyatı güncellendi</span>
                    </div>
                    {resultInfo && resultInfo.skippedCount > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-amber-700 font-bold">⚠️ {resultInfo.skippedCount} ünite korumalı durumda olduğu için atlandı</span>
                            </div>
                            <div className="text-xs text-amber-600 space-y-0.5 max-h-32 overflow-y-auto">
                                {resultInfo.skippedUnits.map((u, i) => (
                                    <div key={i}>Ünite {u.unit_number} — <Badge variant="outline" className="text-[9px] py-0">{u.status}</Badge></div>
                                ))}
                            </div>
                            <p className="text-[10px] text-amber-500 mt-1">Satılmış, rezerve, opsiyonlu veya teklif verilmiş ünitelerin fiyatları otomatik olarak değiştirilemez.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={closeResultInfo}>Tamam</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
