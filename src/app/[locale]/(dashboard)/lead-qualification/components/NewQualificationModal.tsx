'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createLeadQualification } from '../actions'

export function NewQualificationModal({ projects }: { projects: any[] }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const res = await createLeadQualification(formData)
            if (res?.error) {
                toast.error(res.error)
            } else {
                toast.success('Yeni kayıt başarıyla oluşturuldu!')
                setOpen(false)
            }
        } catch (error) {
            toast.error('Beklenmeyen bir hata oluştu.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-10">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Yeni Kayıt Aç
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Ön Değerlendirme İçin Yeni Kayıt</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Ad Soyad <span className="text-red-500">*</span></Label>
                            <Input id="full_name" name="full_name" required placeholder="Müşteri Adı Soyadı" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon <span className="text-red-500">*</span></Label>
                            <Input id="phone" name="phone" required placeholder="555..." />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" name="email" type="email" placeholder="ornek@email.com" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="source">Kaynak</Label>
                            <Select name="source" defaultValue="manual">
                                <SelectTrigger>
                                    <SelectValue placeholder="Kaynak seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manual">Manuel (Elden)</SelectItem>
                                    <SelectItem value="referral">Referans</SelectItem>
                                    <SelectItem value="web_form">Web Formu</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="campaign_name">Kampanya Adı</Label>
                            <Input id="campaign_name" name="campaign_name" placeholder="Örn: Yaz Kampanyası" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project_id">İlgilendiği Proje</Label>
                        <Select name="project_id">
                            <SelectTrigger>
                                <SelectValue placeholder="Projelerden seçin (Opsiyonel)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Belirtilmedi</SelectItem>
                                {projects?.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Ön Görüşme Notu</Label>
                        <Textarea id="notes" name="notes" placeholder="Müşterinin beklentileri veya durumu hakkında notlar..." className="h-24 resize-none" />
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
