'use client'

import { useState, useMemo } from 'react'
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
import { Link2, Link2Off } from 'lucide-react'
import { matchUnitToSale, unmatchUnitFromSale } from '../actions'
import { toast } from 'sonner'
import { Combobox } from '@/components/ui/combobox'

interface MatchUnitDialogProps {
    saleId: string
    currentUnitId?: string | null
    availableUnits: any[]
    customerName: string
}

export default function MatchUnitDialog({ saleId, currentUnitId, availableUnits, customerName }: MatchUnitDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId || "")

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

    const handleMatch = async () => {
        if (!selectedUnitId) return
        const res = await matchUnitToSale(saleId, selectedUnitId)
        if (res.success) {
            setIsOpen(false)
            toast.success("Eşleştirme başarıyla tamamlandı. Durum 'Fırsat' olarak güncellendi.")
        } else {
            toast.error(res.error || "Eşleştirme sırasında bir hata oluştu.")
        }
    }

    const handleUnmatch = async () => {
        const res = await unmatchUnitFromSale(saleId)
        if (res.success) {
            setIsOpen(false)
            toast.success("Eşleştirme kaldırıldı. Durum 'Lead' olarak güncellendi.")
        } else {
            toast.error(res.error || "İşlem başarısız.")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {currentUnitId ? (
                    <Button variant="ghost" size="icon" title="Eşleştirmeyi Değiştir/Kaldır">
                        <Link2 className="h-4 w-4 text-primary" />
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Link2 className="h-4 w-4" /> Eşleştir
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{customerName} için Ünite Eşleştir</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Proje Seçin</Label>
                        <Combobox
                            items={projects}
                            value={selectedProjectId}
                            onChange={(val) => {
                                setSelectedProjectId(val)
                                setSelectedUnitId("") // Reset unit when project changes
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
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {currentUnitId && (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleUnmatch}>
                            <Link2Off className="mr-2 h-4 w-4" /> Eşleşmeyi Kaldır
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>İptal</Button>
                        <Button onClick={handleMatch} disabled={!selectedUnitId || selectedUnitId === currentUnitId}>
                            Kaydet
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
