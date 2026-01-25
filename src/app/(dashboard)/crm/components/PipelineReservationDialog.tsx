'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CalendarClock, ShieldAlert } from 'lucide-react'
import { updateSaleToReservation, cancelReservation } from '../actions'
import { toast } from 'sonner'
import { Combobox } from '@/components/ui/combobox'

interface PipelineReservationDialogProps {
    saleId: string
    currentUnitId?: string | null
    availableUnits: any[]
    customerName: string
    status?: string
    expiryDate?: string
}

export default function PipelineReservationDialog({ saleId, currentUnitId, availableUnits, customerName, status, expiryDate: initialExpiryDate }: PipelineReservationDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId || "")
    const isReserved = status === 'Reservation'


    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 3)
    const [expiryDate, setExpiryDate] = useState(defaultDate.toISOString().split('T')[0])
    const [depositAmount, setDepositAmount] = useState(0)

    // Pre-fill project if unit is already matched
    useEffect(() => {
        if (currentUnitId && availableUnits.length > 0) {
            const unit = availableUnits.find(u => u.id === currentUnitId)
            if (unit?.projects?.id) {
                setSelectedProjectId(unit.projects.id)
            }
        }
    }, [currentUnitId, availableUnits, isOpen])

    // Extract unique projects from available units
    const projects = useMemo(() => {
        const projectMap = new Map()
        availableUnits.forEach(u => {
            if (u.projects && !projectMap.has(u.projects.id)) {
                projectMap.set(u.projects.id, u.projects.name)
            }
        })
        return Array.from(projectMap.entries()).map(([id, name]) => ({
            value: id,
            label: name
        }))
    }, [availableUnits])

    // Filter units based on selected project
    const filteredUnits = useMemo(() => {
        if (!selectedProjectId) return []
        return availableUnits
            .filter(u => u.projects?.id === selectedProjectId)
            .map(u => ({
                value: u.id,
                label: u.unit_number
            }))
    }, [selectedProjectId, availableUnits])

    const handleReserve = async () => {
        if (!selectedUnitId || !expiryDate) {
            toast.error("Lütfen ünite ve tarih seçiniz.")
            return
        }
        const res = await updateSaleToReservation(saleId, selectedUnitId, expiryDate, depositAmount)
        if (res.success) {
            setIsOpen(false)
            toast.success("Opsiyon başarıyla tanımlandı.")
        } else {
            toast.error(res.error || "İşlem sırasında bir hata oluştu.")
        }
    }

    const handleCancelReservation = async () => {
        const res = await cancelReservation(saleId)
        if (res.success) {
            setIsOpen(false)
            toast.success("Opsiyon başarıyla kaldırıldı.")
        } else {
            toast.error(res.error || "Opsiyon kaldırılırken bir hata oluştu.")
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {isReserved ? (
                    <Button variant="outline" size="sm" className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50">
                        <CalendarClock className="h-4 w-4" />
                        Opsiyonlu {initialExpiryDate && `(${new Date(initialExpiryDate).toLocaleDateString('tr-TR')})`}
                    </Button>
                ) : status === 'Opsiyon - Kapora Bekleniyor' ? (
                    <Button variant="outline" size="sm" className="gap-2 border-orange-400 text-orange-600 hover:bg-orange-50">
                        <CalendarClock className="h-4 w-4" />
                        Kapora Bekleniyor {initialExpiryDate && `(${new Date(initialExpiryDate).toLocaleDateString('tr-TR')})`}
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" className="gap-2">
                        <CalendarClock className="h-4 w-4" /> Opsiyonla
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{customerName} için Opsiyon {isReserved ? 'İptal Et / Güncelle' : 'Tanımla'}</DialogTitle>
                </DialogHeader>

                {isReserved && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-3 mb-4">
                        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            Bu kayıt için halihazırda bir opsiyon bulunmaktadır. Opsiyonu iptal etmek için aşağıdaki <b>"Opsiyonu Kaldır"</b> butonunu kullanabilirsiniz.
                        </div>
                    </div>
                )}


                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Proje Seçin</Label>
                        <Combobox
                            items={projects}
                            value={selectedProjectId}
                            onChange={(val) => {
                                setSelectedProjectId(val)
                                setSelectedUnitId("")
                            }}
                            placeholder="Proje Seçiniz..."
                            searchPlaceholder="Proje Ara..."
                            emptyText="Proje bulunamadı."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Ünite Seçin</Label>
                        <Combobox
                            items={filteredUnits}
                            value={selectedUnitId}
                            onChange={setSelectedUnitId}
                            placeholder={selectedProjectId ? "Ünite Seçiniz..." : "Önce Proje Seçiniz"}
                            searchPlaceholder="Ünite Ara..."
                            emptyText="Aradığınız ünite bulunamadı."
                            disabled={!selectedProjectId}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="expiry_date">Opsiyon Bitiş Tarihi</Label>
                        <Input
                            id="expiry_date"
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="deposit_amount">Kapora Tutarı (Opsiyonel)</Label>
                        <div className="relative">
                            <Input
                                id="deposit_amount"
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(Number(e.target.value))}
                                placeholder="0"
                            />
                            <div className="absolute right-3 top-2 text-sm text-muted-foreground font-semibold">
                                TRY
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            0 girilirse kapora beklenmeden opsiyon kesinleşir.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center gap-2">
                    {isReserved && (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancelReservation}>
                            Opsiyonu Kaldır
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Vazgeç</Button>
                        <Button onClick={handleReserve} disabled={!selectedUnitId || !expiryDate}>
                            {isReserved ? 'Opsiyonu Güncelle' : 'Opsiyonu Onayla'}
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
