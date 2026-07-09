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
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

interface PipelineReservationDialogProps {
    saleId: string
    currentUnitId?: string | null
    currentProjectId?: string | null
    customerName: string
    projects: any[]
    status?: string
    expiryDate?: string
    triggerSize?: 'default' | 'sm' | 'xs'
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
    showTriggerButton?: boolean
    onSuccess?: () => void
}

export default function PipelineReservationDialog({ 
    saleId, 
    currentUnitId, 
    currentProjectId,
    customerName, 
    projects: projectsProp = [], 
    status, 
    expiryDate: initialExpiryDate, 
    triggerSize,
    isOpen: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    showTriggerButton = true,
    onSuccess
}: PipelineReservationDialogProps) {
    const router = useRouter()
    const t = useTranslations('CRM.reservation')
    const locale = useLocale()
    const [localOpen, setLocalOpen] = useState(false)
    const isOpen = controlledOpen !== undefined ? controlledOpen : localOpen
    const setIsOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setLocalOpen
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId || "")
    const [units, setUnits] = useState<any[]>([])
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)
    const isReserved = status === 'Reservation' || status === 'Opsiyon - Kapora Bekleniyor' || status === 'Option - Deposit Pending'

    const defaultDate = new Date()
    defaultDate.setDate(defaultDate.getDate() + 3)
    const [expiryDate, setExpiryDate] = useState(
        initialExpiryDate ? initialExpiryDate.split('T')[0] : defaultDate.toISOString().split('T')[0]
    )
    const [depositAmount, setDepositAmount] = useState(0)

    // Reset fields when the dialog is opened
    useEffect(() => {
        if (isOpen) {
            const defaultDate = new Date()
            defaultDate.setDate(defaultDate.getDate() + 3)
            setExpiryDate(
                initialExpiryDate ? initialExpiryDate.split('T')[0] : defaultDate.toISOString().split('T')[0]
            )
            setDepositAmount(0)
            if (!currentUnitId) {
                // No unit but project exists → pre-fill project
                setSelectedProjectId(currentProjectId || "")
                setSelectedUnitId("")
            } else {
                setSelectedUnitId(currentUnitId)
            }
        }
    }, [isOpen, initialExpiryDate, currentUnitId, currentProjectId])

    // Pre-fill project if unit is already matched
    useEffect(() => {
        if (!currentUnitId || !isOpen) return

        const fetchMatchedUnitProject = async () => {
            try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                const { data, error } = await supabase
                    .from('units')
                    .select('project_id')
                    .eq('id', currentUnitId)
                    .single()
                
                if (error) throw error
                if (data?.project_id) {
                    setSelectedProjectId(data.project_id)
                }
            } catch (err) {
                console.error('Error pre-filling matched unit project:', err)
            }
        }

        fetchMatchedUnitProject()
    }, [currentUnitId, isOpen])

    // Map projects list directly from props
    const projects = useMemo(() => {
        return projectsProp.map(p => ({
            value: p.id,
            label: p.name
        }))
    }, [projectsProp])

    // Load units on demand when project changes
    useEffect(() => {
        if (!selectedProjectId || !isOpen) {
            setUnits([])
            return
        }

        const loadUnits = async () => {
            setIsLoadingUnits(true)
            try {
                const { createClient } = await import('@/lib/supabase/client')
                const supabase = createClient()
                
                // Fetch available units for the project
                const { data: availableUnits, error } = await supabase
                    .from('units')
                    .select('id, unit_number')
                    .eq('project_id', selectedProjectId)
                    .in('status', ['For Sale', 'Stock', 'Available'])
                    .order('unit_number')
                
                if (error) throw error
                
                let allUnits = availableUnits || []
                
                // If the current unit exists but isn't in the available list (e.g. it's now Reserved),
                // fetch it separately and include it so the Combobox can display it
                if (currentUnitId && !allUnits.find(u => u.id === currentUnitId)) {
                    const { data: currentUnit } = await supabase
                        .from('units')
                        .select('id, unit_number, project_id')
                        .eq('id', currentUnitId)
                        .single()
                    
                    if (currentUnit && currentUnit.project_id === selectedProjectId) {
                        allUnits = [currentUnit, ...allUnits]
                    }
                }
                
                setUnits(allUnits)
            } catch (err) {
                console.error('Error fetching units for project:', err)
                toast.error('Birimler yüklenirken bir hata oluştu.')
            } finally {
                setIsLoadingUnits(false)
            }
        }

        loadUnits()
    }, [selectedProjectId, isOpen, currentUnitId])

    // Filter units based on selected project (loaded dynamically)
    const filteredUnits = useMemo(() => {
        return units.map(u => ({
            value: u.id,
            label: u.unit_number
        }))
    }, [units])

    const handleReserve = async () => {
        if (!selectedUnitId || !expiryDate) {
            toast.error(t('errorFill'))
            return
        }
        const res = await updateSaleToReservation(saleId, selectedUnitId, expiryDate, depositAmount)
        if (res.success) {
            setIsOpen(false)
            toast.success(t('successReserve'))
            router.refresh()
            if (onSuccess) onSuccess()
        } else {
            toast.error(res.error || t('errorReserve'))
        }
    }

    const handleCancelReservation = async () => {
        const res = await cancelReservation(saleId)
        if (res.success) {
            setIsOpen(false)
            toast.success(t('successCancel'))
            router.refresh()
            if (onSuccess) onSuccess()
        } else {
            toast.error(res.error || t('errorCancel'))
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {showTriggerButton && (
                <DialogTrigger asChild>
                    {isReserved ? (
                        <Button variant="outline" size={triggerSize === 'xs' ? "sm" : "sm"} className={triggerSize === 'xs' ? "gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50 h-6 text-[10px] px-1.5" : "gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"}>
                            <CalendarClock className={triggerSize === 'xs' ? "h-3.5 w-3.5" : "h-4 w-4"} />
                            {t('buttonReserved')} {initialExpiryDate && `(${new Date(initialExpiryDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')})`}
                        </Button>
                    ) : status === (locale === 'tr' ? 'Opsiyon - Kapora Bekleniyor' : 'Option - Deposit Pending') ? (
                        <Button variant="outline" size={triggerSize === 'xs' ? "sm" : "sm"} className={triggerSize === 'xs' ? "gap-1 border-orange-400 text-orange-600 hover:bg-orange-50 h-6 text-[10px] px-1.5" : "gap-2 border-orange-400 text-orange-600 hover:bg-orange-50"}>
                            <CalendarClock className={triggerSize === 'xs' ? "h-3.5 w-3.5" : "h-4 w-4"} />
                            {t('statusPending')} {initialExpiryDate && `(${new Date(initialExpiryDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')})`}
                        </Button>
                    ) : (
                        <Button variant="outline" size={triggerSize === 'xs' ? "sm" : "sm"} className={triggerSize === 'xs' ? "gap-1 h-6 text-[10px] px-1.5" : "gap-2"}>
                            <CalendarClock className={triggerSize === 'xs' ? "h-3.5 w-3.5" : "h-4 w-4"} /> {t('buttonReserve')}
                        </Button>
                    )}
                </DialogTrigger>
            )}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('title', { customerName, type: isReserved ? t('typeEdit') : t('typeNew') })}</DialogTitle>
                </DialogHeader>

                {isReserved && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md flex items-start gap-3 mb-4">
                        <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-900">
                            {t('warningReserved')}
                        </div>
                    </div>
                )}

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>{t('projectLabel', { defaultValue: 'Proje Seçin' })}</Label>
                        <Combobox
                            items={projects}
                            value={selectedProjectId}
                            onChange={(val) => {
                                setSelectedProjectId(val)
                                setSelectedUnitId("")
                            }}
                            placeholder={t('projectPlaceholder', { defaultValue: 'Proje Seçiniz...' })}
                            searchPlaceholder={t('projectSearch', { defaultValue: 'Proje Ara...' })}
                            emptyText={t('projectEmpty', { defaultValue: 'Proje bulunamadı.' })}
                            disabled={isReserved}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>{t('unitLabel', { defaultValue: 'Ünite Seçin' })}</Label>
                        <Combobox
                            items={filteredUnits}
                            value={selectedUnitId}
                            onChange={setSelectedUnitId}
                            placeholder={
                                isLoadingUnits 
                                    ? "Birimler yükleniyor..." 
                                    : selectedProjectId 
                                        ? t('unitPlaceholder', { defaultValue: 'Ünite Seçiniz...' }) 
                                        : t('selectProjectFirst', { defaultValue: 'Önce Proje Seçiniz' })
                            }
                            searchPlaceholder={t('unitSearch', { defaultValue: 'Ünite Ara...' })}
                            emptyText={isLoadingUnits ? "Yükleniyor..." : t('unitEmpty', { defaultValue: 'Aradığınız ünite bulunamadı.' })}
                            disabled={isReserved || !selectedProjectId || isLoadingUnits}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="expiry_date">{t('expiryDateLabel')}</Label>
                        <Input
                            id="expiry_date"
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="deposit_amount">{t('depositLabel')}</Label>
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
                            {t('depositHint')}
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-between items-center gap-2">
                    {isReserved && (
                        <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleCancelReservation}>
                            {t('buttonCancel')}
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsOpen(false)}>{t('cancel', { defaultValue: 'Vazgeç' })}</Button>
                        <Button onClick={handleReserve} disabled={!selectedUnitId || !expiryDate}>
                            {isReserved ? t('buttonUpdate') : t('buttonConfirm')}
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
