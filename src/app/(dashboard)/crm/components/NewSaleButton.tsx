'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from 'lucide-react'
import { createSale } from '../actions'
import { Combobox } from '@/components/ui/combobox'

interface NewSaleButtonProps {
    customers: any[]
    availableUnits: any[]
    initialState?: { openNewSale: boolean, unitId?: string, projectId?: string }
}

export default function NewSaleButton({
    customers,
    availableUnits,
    initialState
}: NewSaleButtonProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(initialState?.openNewSale || false)
    const [selectedCustomerIdForSale, setSelectedCustomerIdForSale] = useState("")
    const [selectedProjectIdForSale, setSelectedProjectIdForSale] = useState(initialState?.projectId || "")
    const [selectedUnitIdForSale, setSelectedUnitIdForSale] = useState(initialState?.unitId || "")

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
        if (!selectedProjectIdForSale) return []
        return availableUnits
            .filter(u => u.projects?.id === selectedProjectIdForSale)
            .map(u => ({
                value: u.id,
                label: u.unit_number
            }))
    }, [selectedProjectIdForSale, availableUnits])

    return (
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
                // Reset form on close if needed, but keeping state might be better for UX
                // Actually, let's reset to ensure clean slate unless specific UX requested
                setSelectedCustomerIdForSale("")
                if (!initialState?.projectId) setSelectedProjectIdForSale("")
                if (!initialState?.unitId) setSelectedUnitIdForSale("")
            }
        }}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Yeni Satış Başlat</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Satış / Fırsat</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    await createSale(formData)
                    setIsCreateOpen(false)
                }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Müşteri</Label>
                            <Combobox
                                items={customers?.map((c: any) => ({ value: c.id, label: c.full_name })) || []}
                                value={selectedCustomerIdForSale}
                                onChange={setSelectedCustomerIdForSale}
                                placeholder="Müşteri Seçiniz..."
                                searchPlaceholder="Müşteri Ara..."
                                emptyText="Müşteri bulunamadı."
                            />
                            <input type="hidden" name="customer_id" value={selectedCustomerIdForSale} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Proje</Label>
                            <Combobox
                                items={projects}
                                value={selectedProjectIdForSale}
                                onChange={(val) => {
                                    setSelectedProjectIdForSale(val)
                                    setSelectedUnitIdForSale("")
                                }}
                                placeholder="Proje Seçiniz..."
                                searchPlaceholder="Proje Ara..."
                                emptyText="Proje bulunamadı."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>İlgilenilen Ünite</Label>
                            <Combobox
                                items={filteredUnits}
                                value={selectedUnitIdForSale}
                                onChange={setSelectedUnitIdForSale}
                                placeholder={selectedProjectIdForSale ? "Ünite Seçiniz..." : "Önce Proje Seçiniz"}
                                searchPlaceholder="Ünite Ara..."
                                emptyText="Ünite bulunamadı."
                                disabled={!selectedProjectIdForSale}
                            />
                            <input type="hidden" name="unit_id" value={selectedUnitIdForSale} />
                        </div>

                        {selectedUnitIdForSale && (
                            <p className="text-xs text-muted-foreground italic">
                                * Ünite seçildiği için kayıt otomatik olarak <b>Fırsat</b> statüsünde oluşturulacaktır.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!selectedCustomerIdForSale || !selectedUnitIdForSale}>Oluştur</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
