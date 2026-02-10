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
import { ArrowRightLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { bulkUpdateStatuses } from '../actions'

const STATUSES = [
    { value: 'For Sale', label: 'Satışta', color: 'bg-emerald-600', description: 'Satışa açık ünite' },
    { value: 'Reserved', label: 'Rezerve', color: 'bg-amber-500', description: 'Müşteri için ayrıldı' },
    { value: 'Blocked', label: 'Bloke', color: 'bg-slate-600', description: 'Firma için ayrılmış' },
    { value: 'Option', label: 'Opsiyon', color: 'bg-violet-600', description: 'Süreli hak tanınmış' },
    { value: 'Rented', label: 'Kirada', color: 'bg-cyan-600', description: 'Yatırımcıya kiraya verildi' },
]

interface BulkStatusUpdateProps {
    selectedUnits: string[]
    totalUnits: number
    onComplete?: () => void
}

export function BulkStatusUpdate({ selectedUnits, totalUnits, onComplete }: BulkStatusUpdateProps) {
    const [open, setOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<string>('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async () => {
        if (!selectedStatus) {
            toast.error('Bir durum seçin.')
            return
        }

        if (selectedUnits.length === 0) {
            toast.error('En az bir ünite seçin.')
            return
        }

        setLoading(true)
        const result = await bulkUpdateStatuses(selectedUnits, selectedStatus, reason)
        setLoading(false)

        if (result.success) {
            toast.success(`${result.updatedCount} ünite durumu "${STATUSES.find(s => s.value === selectedStatus)?.label}" olarak güncellendi.`)
            setOpen(false)
            setSelectedStatus('')
            setReason('')
            onComplete?.()
        } else {
            toast.error(result.error || 'Güncelleme başarısız.')
        }
    }

    const statusInfo = STATUSES.find(s => s.value === selectedStatus)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Toplu Durum Güncelle
                    {selectedUnits.length > 0 && (
                        <Badge className="ml-1 text-[9px] px-1.5">{selectedUnits.length}</Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Toplu Durum Güncelleme
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">
                            <strong>{selectedUnits.length > 0 ? selectedUnits.length : totalUnits}</strong> ünite seçili
                        </span>
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <p className="text-xs leading-relaxed">
                            <strong>Dikkat:</strong> Bu işlem seçili tüm ünitelerin durumunu değiştirecektir.
                            Satıldı ve Teslim Edildi durumundaki üniteler güvenlik nedeniyle bu işlemden etkilenmez.
                        </p>
                    </div>

                    {/* Status Selection */}
                    <div className="grid gap-2">
                        <Label className="text-sm font-medium">Yeni Durum Seçin</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUSES.map((status) => (
                                <button
                                    key={status.value}
                                    onClick={() => setSelectedStatus(status.value)}
                                    className={`flex flex-col gap-0.5 p-3 rounded-lg border-2 transition-all text-left ${selectedStatus === status.value
                                            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                                        <span className="text-sm font-semibold">{status.label}</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground leading-tight">
                                        {status.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="grid gap-2">
                        <Label className="text-sm">Sebep (Opsiyonel)</Label>
                        <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Toplu durum değişikliği sebebi..."
                            className="h-9 text-sm"
                        />
                    </div>

                    {/* Preview */}
                    {selectedStatus && (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                            <span className="text-xs text-muted-foreground">Sonuç:</span>
                            <span className="text-sm font-bold">
                                {selectedUnits.length > 0 ? selectedUnits.length : totalUnits} ünite →
                            </span>
                            <Badge className={`${statusInfo?.color} text-white text-xs`}>
                                {statusInfo?.label}
                            </Badge>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedStatus}
                        className="gap-1.5"
                    >
                        {loading ? 'Güncelleniyor...' : 'Durumları Güncelle'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
