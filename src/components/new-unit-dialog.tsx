'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createUnit } from '@/app/[locale]/(dashboard)/inventory/actions'
import { toast } from 'sonner'

import { useTranslations } from 'next-intl'

interface Project {
    id: string
    name: string
}

interface NewUnitDialogProps {
    projects: Project[]
    unitTypes?: any[]
}

export function NewUnitDialog({ projects, unitTypes }: NewUnitDialogProps) {
    const t = useTranslations('Inventory.newUnit')
    const tGlobal = useTranslations('Inventory')
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await createUnit(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(t('success'))
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> {t('button')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t('title')}</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.project')}</Label>
                            <div className="col-span-3">
                                <select name="project_id" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                    <option value="">{t('form.selectProject')}</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.unitNo')}</Label>
                            <Input name="unit_number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.type')}</Label>
                            <div className="col-span-3">
                                <Select name="type" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seçiniz" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitTypes && unitTypes.length > 0 ? (
                                            unitTypes.map((t: any) => (
                                                <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                                            ))
                                        ) : (
                                            <>
                                                <SelectItem value="1+1">1+1</SelectItem>
                                                <SelectItem value="2+1">2+1</SelectItem>
                                                <SelectItem value="3+1">3+1</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.price')}</Label>
                            <Input name="price" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.floor')}</Label>
                            <Input name="floor" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.direction')}</Label>
                            <Select name="direction" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t('form.select')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kuzey">{tGlobal('directions.North')}</SelectItem>
                                    <SelectItem value="Güney">{tGlobal('directions.South')}</SelectItem>
                                    <SelectItem value="Doğu">{tGlobal('directions.East')}</SelectItem>
                                    <SelectItem value="Batı">{tGlobal('directions.West')}</SelectItem>
                                    <SelectItem value="Kuzey Doğu">{tGlobal('directions.NorthEast')}</SelectItem>
                                    <SelectItem value="Kuzey Batı">{tGlobal('directions.NorthWest')}</SelectItem>
                                    <SelectItem value="Güney Doğu">{tGlobal('directions.SouthEast')}</SelectItem>
                                    <SelectItem value="Güney Batı">{tGlobal('directions.SouthWest')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">{t('form.grossArea')}</Label>
                            <Input name="area_gross" type="number" step="0.01" className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">{t('save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
