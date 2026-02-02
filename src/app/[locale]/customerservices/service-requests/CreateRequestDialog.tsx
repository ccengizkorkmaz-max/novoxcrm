'use client'

import { useState } from 'react'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createServiceRequest } from './actions'

export function CreateRequestDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createServiceRequest(formData)
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            alert('Talebiniz başarıyla oluşturuldu.')
            setOpen(false)
            window.location.reload()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Talep Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form action={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Yeni Destek Talebi</DialogTitle>
                        <DialogDescription>
                            Lütfen yaşadığınız sorunu detaylıca açıklayın. Teknik ekibimiz en kısa sürede dönüş yapacaktır.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Konu Başlığı</Label>
                            <Input id="title" name="title" placeholder="Mutfak dolabı kapak ayarı..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Detaylı Açıklama</Label>
                            <Textarea id="description" name="description" placeholder="Sorunu buraya yazınız..." rows={4} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Gönderiliyor...' : 'Talebi Gönder'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
