'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { updateUnitStatusExtended } from '../../actions'

interface UnitStatusChangerProps {
    unitId: string
    currentStatus: string
}

const STATUSES = [
    { value: 'For Sale', label: 'Satışta', color: 'bg-emerald-600', description: 'Ünite satışa açık' },
    { value: 'Satılık', label: 'Satışta', color: 'bg-emerald-600', description: 'Ünite satışa açık' },
    { value: 'Reserved', label: 'Rezerve', color: 'bg-amber-500', description: 'Müşteri için ayrıldı' },
    { value: 'Rezerve', label: 'Rezerve', color: 'bg-amber-500', description: 'Müşteri için ayrıldı' },
    { value: 'Sold', label: 'Satıldı', color: 'bg-rose-600', description: 'Satış gerçekleşti' },
    { value: 'Satıldı', label: 'Satıldı', color: 'bg-rose-600', description: 'Satış gerçekleşti' },
    { value: 'Blocked', label: 'Bloke', color: 'bg-slate-600', description: 'Firma için ayrılmış, satışa kapalı' },
    { value: 'Option', label: 'Opsiyon', color: 'bg-violet-600', description: 'Süreli hak tanınmış' },
    { value: 'Rented', label: 'Kirada', color: 'bg-cyan-600', description: 'Yatırımcıya kiraya verildi' },
    { value: 'Delivered', label: 'Teslim Edildi', color: 'bg-green-800', description: 'Satış + teslim tamamlandı' },
]

export function UnitStatusChanger({ unitId, currentStatus }: UnitStatusChangerProps) {
    const [changing, setChanging] = useState(false)
    const [reason, setReason] = useState('')
    const [showOptions, setShowOptions] = useState(false)

    const statusObj = STATUSES.find(s => s.value.toLowerCase() === currentStatus?.toLowerCase()) || { label: currentStatus, color: 'bg-slate-500' }

    const handleStatusChange = async (newStatus: string) => {
        if (newStatus === currentStatus) return

        setChanging(true)
        const result = await updateUnitStatusExtended(unitId, newStatus, reason)
        setChanging(false)

        if (result.success) {
            toast.success(`Durum "${STATUSES.find(s => s.value === newStatus)?.label}" olarak güncellendi.`)
            setShowOptions(false)
            setReason('')
        } else {
            toast.error(result.error || 'Güncelleme başarısız.')
        }
    }

    const availableStatuses = STATUSES.filter(s =>
        s.value !== currentStatus &&
        s.value !== 'Sold' &&
        s.value !== 'Satıldı' &&
        !['Satılık', 'Rezerve', 'Satıldı'].includes(s.value) // Drop-down'da İngilizce anahtar kelimeleri tutalım (DB uyumu için)
    ).filter((v, i, a) => a.findIndex(t => t.label === v.label) === i) // Tekrar eden labelleri temizle

    return (
        <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="pb-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="text-[13px] font-bold flex items-center gap-2 text-slate-700">
                            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                            DURUM YÖNETİMİ
                        </CardTitle>
                        <div className={`mt-1 flex items-center gap-2 px-2.5 py-1 rounded-full text-white text-[11px] font-black w-fit shadow-sm ${statusObj.color}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            {statusObj.label?.toUpperCase()}
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] font-bold px-3 border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                        onClick={() => setShowOptions(!showOptions)}
                        disabled={changing || currentStatus === 'Sold' || currentStatus === 'Satıldı'}
                    >
                        {showOptions ? 'KAPAT' : 'DEĞİŞTİR'}
                    </Button>
                </div>
            </CardHeader>
            {showOptions && (
                <CardContent className="pt-0 space-y-3">
                    <div className="grid gap-1.5">
                        <Label className="text-[11px]">Sebep (Opsiyonel)</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Durum değişikliği sebebi..."
                            className="h-8 text-xs"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {availableStatuses.map((status) => (
                            <button
                                key={status.value}
                                onClick={() => handleStatusChange(status.value)}
                                disabled={changing}
                                className="flex flex-col gap-0.5 p-2 rounded-lg border hover:border-primary/50 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                            >
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                                    <span className="text-xs font-semibold">{status.label}</span>
                                </div>
                                <span className="text-[9px] text-muted-foreground leading-tight">{status.description}</span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            )}
        </Card>
    )
}
