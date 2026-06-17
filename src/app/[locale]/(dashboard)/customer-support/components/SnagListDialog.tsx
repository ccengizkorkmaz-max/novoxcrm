'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus } from 'lucide-react'
import { createSnagItem } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Unit {
    id: string
    unit_number: string
    projects?: { name: string } | null
}

interface Subcontractor {
    id: string
    name: string
}

interface SnagListDialogProps {
    units: Unit[]
    subcontractors: Subcontractor[]
    defaultUnitId?: string
    defaultServiceRequestId?: string
}

export function SnagListDialog({ units, subcontractors, defaultUnitId = '', defaultServiceRequestId = '' }: SnagListDialogProps) {
    const t = useTranslations('SnagList')
    const tSub = useTranslations('Subcontractors')
    const [isOpen, setIsOpen] = useState(false)
    const [unitId, setUnitId] = useState(defaultUnitId)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [category, setCategory] = useState('Plumbing')
    const [subcontractorId, setSubcontractorId] = useState('none')
    const [priority, setPriority] = useState('Normal')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            // Adjust subcontractor ID if "none" selected
            if (subcontractorId !== 'none') {
                formData.append('subcontractor_id', subcontractorId)
            }
            if (defaultServiceRequestId) {
                formData.append('service_request_id', defaultServiceRequestId)
            }

            const res = await createSnagItem(formData)

            if (res.success) {
                toast.success(t('successAdd'))
                setIsOpen(false)
                setTitle('')
                setDescription('')
                setCategory('Plumbing')
                setSubcontractorId('none')
                setPriority('Normal')
            } else {
                toast.error(res.error || 'Hata oluştu.')
            }
        } catch (error) {
            toast.error('Bağlantı hatası oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('addBtn')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>{t('addBtn')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    
                    {!defaultUnitId ? (
                        <div className="grid gap-2">
                            <Label htmlFor="unit_id">{t('unit')}</Label>
                            <Select name="unit_id" value={unitId} onValueChange={setUnitId}>
                                <SelectTrigger id="unit_id">
                                    <SelectValue placeholder={t('selectUnit')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.projects?.name} - Daire {unit.unit_number}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <input type="hidden" name="unit_id" value={defaultUnitId} />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">{t('defectTitle')}</Label>
                        <Input
                            id="title"
                            name="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            placeholder="Sızıntı, Çatlak vb."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">{t('description')}</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detaylı arıza açıklaması..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('category')}</Label>
                        <Select name="category" value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Kategori Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Plumbing">{tSub('categories.Plumbing')}</SelectItem>
                                <SelectItem value="Electrical">{tSub('categories.Electrical')}</SelectItem>
                                <SelectItem value="Paint">{tSub('categories.Paint')}</SelectItem>
                                <SelectItem value="Carpentry">{tSub('categories.Carpentry')}</SelectItem>
                                <SelectItem value="Zemin">{tSub('categories.Zemin')}</SelectItem>
                                <SelectItem value="HVAC">{tSub('categories.HVAC')}</SelectItem>
                                <SelectItem value="Other">{tSub('categories.Other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="subcontractor_id">{t('subcontractor')}</Label>
                        <Select value={subcontractorId} onValueChange={setSubcontractorId}>
                            <SelectTrigger id="subcontractor_id">
                                <SelectValue placeholder={t('selectSub')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">{t('selectSub')}</SelectItem>
                                {subcontractors.map((sub) => (
                                    <SelectItem key={sub.id} value={sub.id}>
                                        {sub.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="priority">{t('priority')}</Label>
                        <Select name="priority" value={priority} onValueChange={setPriority}>
                            <SelectTrigger id="priority">
                                <SelectValue placeholder="Öncelik Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Low">{t('priorities.Low')}</SelectItem>
                                <SelectItem value="Normal">{t('priorities.Normal')}</SelectItem>
                                <SelectItem value="High">{t('priorities.High')}</SelectItem>
                                <SelectItem value="Urgent">{t('priorities.Urgent')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={loading || (!unitId && !defaultUnitId)}>
                            {loading ? 'Yükleniyor...' : 'Kaydet'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
