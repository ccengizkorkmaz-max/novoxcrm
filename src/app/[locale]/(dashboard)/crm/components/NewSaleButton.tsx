'use client'

import { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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
import { toast } from "sonner"
import { Combobox } from '@/components/ui/combobox'

interface NewSaleButtonProps {
    customers: any[]
    availableUnits: any[]
    initialState?: { openNewSale: boolean, unitId?: string, projectId?: string }
    tenantType?: string
}

import { useTranslations } from 'next-intl'

export default function NewSaleButton({
    customers,
    availableUnits,
    initialState,
    tenantType = 'developer'
}: NewSaleButtonProps) {
    const t = useTranslations('CRM.newSale')
    const isBroker = tenantType === 'broker'
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

    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="default" className="h-9 px-3 gap-1.5 text-xs font-semibold transition-all shadow-sm">
                <Plus className="w-3.5 h-3.5" /> 
                {isBroker ? 'Yeni Talep' : t('button')}
            </Button>
        )
    }

    return (
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) {
                setSelectedCustomerIdForSale("")
                if (!initialState?.projectId) setSelectedProjectIdForSale("")
                if (!initialState?.unitId) setSelectedUnitIdForSale("")
            }
        }}>
            <DialogTrigger asChild>
                <Button className="h-9 px-3 gap-1.5 text-xs font-semibold transition-all shadow-sm">
                    <Plus className="w-3.5 h-3.5" /> 
                    {isBroker ? 'Yeni Talep' : t('button')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isBroker ? 'Yeni Müşteri Talebi' : t('title')}</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    const result = await createSale(formData)
                    if (result.error) {
                        toast.error(result.error)
                    } else {
                        toast.success(isBroker ? 'Talep oluşturuldu!' : t('createdSuccess'))
                        setIsCreateOpen(false)
                        setSelectedCustomerIdForSale("")
                        setSelectedProjectIdForSale("")
                        setSelectedUnitIdForSale("")
                    }
                }}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>{t('customer')}</Label>
                            <Combobox
                                items={customers?.map((c: any) => ({ value: c.id, label: c.full_name })) || []}
                                value={selectedCustomerIdForSale}
                                onChange={setSelectedCustomerIdForSale}
                                placeholder={t('selectCustomer')}
                                searchPlaceholder={t('searchCustomer')}
                                emptyText={t('customerNotFound')}
                            />
                            <input type="hidden" name="customer_id" value={selectedCustomerIdForSale} />
                        </div>

                        {isBroker ? (
                            <>
                                <div className="grid gap-2">
                                    <Label>Talep Notu</Label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        placeholder="Müşterinin aradığı özellikleri yazın... (örn: Beşiktaş'ta 3+1, deniz manzaralı, 5M TL bütçe)"
                                        className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Bütçe (opsiyonel)</Label>
                                        <Input name="budget" type="number" placeholder="5000000" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Kaynak</Label>
                                        <select name="source" className="h-10 px-3 rounded-lg border text-sm bg-white w-full">
                                            <option value="">Belirtilmemiş</option>
                                            <option value="Referans">Referans</option>
                                            <option value="Web Sitesi">Web Sitesi</option>
                                            <option value="Sahibinden">Sahibinden</option>
                                            <option value="Hepsiemlak">Hepsiemlak</option>
                                            <option value="Sosyal Medya">Sosyal Medya</option>
                                            <option value="Tabela">Tabela</option>
                                            <option value="Telefon">Telefon</option>
                                            <option value="Yürüyüş">Yürüyüş (Walk-in)</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid gap-2">
                                    <Label>{t('project')}</Label>
                                    <Combobox
                                        items={projects}
                                        value={selectedProjectIdForSale}
                                        onChange={(val) => {
                                            setSelectedProjectIdForSale(val)
                                            setSelectedUnitIdForSale("")
                                        }}
                                        placeholder={t('selectProject')}
                                        searchPlaceholder={t('searchProject')}
                                        emptyText={t('projectNotFound')}
                                    />
                                    <input type="hidden" name="project_id" value={selectedProjectIdForSale} />
                                </div>

                                <div className="grid gap-2">
                                    <Label>{t('unit')}</Label>
                                    <Combobox
                                        items={filteredUnits}
                                        value={selectedUnitIdForSale}
                                        onChange={setSelectedUnitIdForSale}
                                        placeholder={selectedProjectIdForSale ? t('selectUnit') : t('selectProjectFirst')}
                                        searchPlaceholder={t('searchUnit')}
                                        emptyText={t('unitNotFound')}
                                        disabled={!selectedProjectIdForSale}
                                    />
                                    <input type="hidden" name="unit_id" value={selectedUnitIdForSale} />
                                </div>

                                {selectedUnitIdForSale && (
                                    <p className="text-xs text-muted-foreground italic">
                                        {t('note')}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={!selectedCustomerIdForSale || (!isBroker && !selectedUnitIdForSale && !selectedProjectIdForSale)}
                        >
                            {isBroker ? 'Talep Oluştur' : t('create')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
