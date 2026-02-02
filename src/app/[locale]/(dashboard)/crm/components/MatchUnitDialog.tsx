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
import { useTranslations } from 'next-intl'

interface MatchUnitDialogProps {
    saleId: string
    currentUnitId?: string | null
    availableUnits: any[]
    customerName: string
}

export default function MatchUnitDialog({ saleId, currentUnitId, availableUnits, customerName }: MatchUnitDialogProps) {
    const t = useTranslations('CRM.matchUnit')
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
            toast.success(t('successMatch'))
        } else {
            toast.error(res.error || t('errorMatch'))
        }
    }

    const handleUnmatch = async () => {
        const res = await unmatchUnitFromSale(saleId)
        if (res.success) {
            setIsOpen(false)
            toast.success(t('successUnmatch'))
        } else {
            toast.error(res.error || t('errorUnmatch'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {currentUnitId ? (
                    <Button variant="ghost" size="icon" title={t('tooltipChange')}>
                        <Link2 className="h-4 w-4 text-primary" />
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Link2 className="h-4 w-4" /> {t('buttonMatch')}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title', { customerName })}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>{t('projectLabel')}</Label>
                        <Combobox
                            items={projects}
                            value={selectedProjectId}
                            onChange={(val) => {
                                setSelectedProjectId(val)
                                setSelectedUnitId("") // Reset unit when project changes
                            }}
                            placeholder={t('projectPlaceholder')}
                            searchPlaceholder={t('projectSearch')}
                            emptyText={t('projectEmpty')}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('unitLabel')}</Label>
                        <Combobox
                            items={filteredUnits}
                            value={selectedUnitId}
                            onChange={setSelectedUnitId}
                            placeholder={selectedProjectId ? t('unitPlaceholder') : t('selectProjectFirst')}
                            searchPlaceholder={t('unitSearch')}
                            emptyText={t('unitEmpty')}
                            disabled={!selectedProjectId}
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {currentUnitId && (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleUnmatch}>
                            <Link2Off className="mr-2 h-4 w-4" /> {t('buttonUnmatch')}
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>{t('cancel', { defaultValue: 'İptal' })}</Button>
                        <Button onClick={handleMatch} disabled={!selectedUnitId || selectedUnitId === currentUnitId}>
                            {t('save', { defaultValue: 'Kaydet' })}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
