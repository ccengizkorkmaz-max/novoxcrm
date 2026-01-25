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
import { createUnit } from '@/app/(dashboard)/inventory/actions'
import { toast } from 'sonner'

interface Project {
    id: string
    name: string
}

interface NewUnitDialogProps {
    projects: Project[]
}

export function NewUnitDialog({ projects }: NewUnitDialogProps) {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await createUnit(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Ünite başarıyla oluşturuldu')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Yeni Ünite
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Yeni Ünite Ekle</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Proje</Label>
                            <div className="col-span-3">
                                <select name="project_id" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                    <option value="">Proje Seçiniz</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Kapı No</Label>
                            <Input name="unit_number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tip</Label>
                            <Input name="type" placeholder="2+1" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Fiyat</Label>
                            <Input name="price" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Kat</Label>
                            <Input name="floor" type="number" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Yön</Label>
                            <Select name="direction" required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Seçiniz" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kuzey">Kuzey</SelectItem>
                                    <SelectItem value="Güney">Güney</SelectItem>
                                    <SelectItem value="Doğu">Doğu</SelectItem>
                                    <SelectItem value="Batı">Batı</SelectItem>
                                    <SelectItem value="Kuzey Doğu">Kuzey Doğu</SelectItem>
                                    <SelectItem value="Kuzey Batı">Kuzey Batı</SelectItem>
                                    <SelectItem value="Güney Doğu">Güney Doğu</SelectItem>
                                    <SelectItem value="Güney Batı">Güney Batı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Brüt m²</Label>
                            <Input name="area_gross" type="number" step="0.01" className="col-span-3" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Kaydet</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
