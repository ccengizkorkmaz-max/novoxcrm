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
import { Link2, Link2Off, Loader2 } from 'lucide-react'
import { matchUnitToSale, unmatchUnitFromSale } from '../actions'
import { toast } from 'sonner'
import { Combobox } from '@/components/ui/combobox'
import { useTranslations } from 'next-intl'

interface MatchUnitDialogProps {
    saleId: string
    currentUnitId?: string | null
    customerName: string
    projects: any[]
    triggerSize?: 'default' | 'sm' | 'xs'
}

export default function MatchUnitDialog({ saleId, currentUnitId, customerName, projects: projectsProp = [], triggerSize }: MatchUnitDialogProps) {
    const t = useTranslations('CRM.matchUnit')
    const [isOpen, setIsOpen] = useState(false)
    const [selectedProjectId, setSelectedProjectId] = useState("")
    const [selectedUnitId, setSelectedUnitId] = useState(currentUnitId || "")
    const [units, setUnits] = useState<any[]>([])
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)

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
                const { data, error } = await supabase
                    .from('units')
                    .select('id, unit_number')
                    .eq('project_id', selectedProjectId)
                    .in('status', ['For Sale', 'Stock', 'Available'])
                    .order('unit_number')
                
                if (error) throw error
                setUnits(data || [])
            } catch (err) {
                console.error('Error fetching units for project:', err)
                toast.error('Birimler yüklenirken bir hata oluştu.')
            } finally {
                setIsLoadingUnits(false)
            }
        }

        loadUnits()
    }, [selectedProjectId, isOpen])

    // Filter units based on selected project (loaded dynamically)
    const filteredUnits = useMemo(() => {
        return units.map(u => ({
            value: u.id,
            label: u.unit_number
        }))
    }, [units])

    const handleMatch = async () => {
        // Allow match if project is selected. Unit is optional.
        if (!selectedProjectId) return
        const res = await matchUnitToSale(saleId, selectedUnitId, selectedProjectId)
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
                    <Button variant="ghost" size="icon" className={triggerSize === 'xs' ? "h-6 w-6" : ""} title={t('tooltipChange')}>
                        <Link2 className={triggerSize === 'xs' ? "h-3.5 w-3.5 text-primary" : "h-4 w-4 text-primary"} />
                    </Button>
                ) : (
                    <Button variant="outline" size={triggerSize === 'xs' ? "sm" : "sm"} className={triggerSize === 'xs' ? "gap-1 h-6 text-[10px] px-1.5" : "gap-2"}>
                        <Link2 className={triggerSize === 'xs' ? "h-3.5 w-3.5" : "h-4 w-4"} /> {t('buttonMatch')}
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
                            placeholder={
                                isLoadingUnits 
                                    ? "Birimler yükleniyor..." 
                                    : selectedProjectId 
                                        ? t('unitPlaceholder') 
                                        : t('selectProjectFirst')
                            }
                            searchPlaceholder={t('unitSearch')}
                            emptyText={isLoadingUnits ? "Yükleniyor..." : t('unitEmpty')}
                            disabled={!selectedProjectId || isLoadingUnits}
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
                        <Button onClick={handleMatch} disabled={!selectedProjectId}>
                            {t('save', { defaultValue: 'Kaydet' })}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
