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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil } from 'lucide-react'
import { createSubcontractor, updateSubcontractor } from '../actions'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface Subcontractor {
    id: string
    name: string
    category: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
}

interface SubcontractorDialogProps {
    subcontractor?: Subcontractor
    mode: 'create' | 'edit'
}

export function SubcontractorDialog({ subcontractor, mode }: SubcontractorDialogProps) {
    const t = useTranslations('Subcontractors')
    const [isOpen, setIsOpen] = useState(false)
    const [name, setName] = useState(subcontractor?.name || '')
    const [category, setCategory] = useState(subcontractor?.category || 'Plumbing')
    const [contactName, setContactName] = useState(subcontractor?.contact_name || '')
    const [phone, setPhone] = useState(subcontractor?.phone || '')
    const [email, setEmail] = useState(subcontractor?.email || '')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            const res = mode === 'create'
                ? await createSubcontractor(formData)
                : await updateSubcontractor(formData)

            if (res.success) {
                toast.success(mode === 'create' ? t('dialog.successAdd') : t('dialog.successUpdate'))
                setIsOpen(false)
                if (mode === 'create') {
                    setName('')
                    setContactName('')
                    setPhone('')
                    setEmail('')
                    setCategory('Plumbing')
                }
            } else {
                toast.error(res.error || 'Bir hata oluştu.')
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
                {mode === 'create' ? (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        {t('addBtn')}
                    </Button>
                ) : (
                    <Button variant="ghost" size="icon" title={t('editBtn')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? t('addBtn') : t('dialog.title')}
                    </DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    {subcontractor && (
                        <input type="hidden" name="id" value={subcontractor.id} />
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('name')}</Label>
                        <Input
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Firma veya Usta Adı"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">{t('category')}</Label>
                        <Select name="category" value={category} onValueChange={setCategory}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Kategori Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Plumbing">{t('categories.Plumbing')}</SelectItem>
                                <SelectItem value="Electrical">{t('categories.Electrical')}</SelectItem>
                                <SelectItem value="Paint">{t('categories.Paint')}</SelectItem>
                                <SelectItem value="Carpentry">{t('categories.Carpentry')}</SelectItem>
                                <SelectItem value="Zemin">{t('categories.Zemin')}</SelectItem>
                                <SelectItem value="HVAC">{t('categories.HVAC')}</SelectItem>
                                <SelectItem value="Other">{t('categories.Other')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="contact_name">{t('contactName')}</Label>
                        <Input
                            id="contact_name"
                            name="contact_name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Kişi adı"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">{t('phone')}</Label>
                        <Input
                            id="phone"
                            name="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Telefon Numarası"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-posta Adresi"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
                            {t('dialog.cancel')}
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Yükleniyor...' : t('dialog.save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
