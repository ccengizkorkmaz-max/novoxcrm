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

import { useTranslations } from 'next-intl'

export default function NewSaleButton({
    customers,
    availableUnits,
    initialState
}: NewSaleButtonProps) {
    const t = useTranslations('CRM.newSale')
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
                <Button><Plus className="mr-2 h-4 w-4" /> {t('button')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    const result = await createSale(formData)
                    if (result.error) {
                        toast.error(result.error)
                    } else {
                        toast.success(t('createdSuccess'))
                        setIsCreateOpen(false)
                        // Reset form state
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
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={!selectedCustomerIdForSale || (!selectedUnitIdForSale && !selectedProjectIdForSale)}>{t('create')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
