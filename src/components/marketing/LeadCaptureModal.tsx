"use client";
import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { captureMarketingLead } from '@/app/broker/actions'
import { toast } from 'sonner'

interface LeadCaptureModalProps {
    children: React.ReactNode
    title?: string
    description?: string
    resourceName: string
}

export function LeadCaptureModal({ children, title, description, resourceName }: LeadCaptureModalProps) {
    const [open, setOpen] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.append('resource', resourceName)

        try {
            const result = await captureMarketingLead(formData)

            if (result.error) {
                toast.error(result.error)
            } else {
                setSubmitted(true)
                toast.success('Bilgileriniz alındı, teşekkürler!')
            }
        } catch (error) {
            toast.error('Bir hata oluştu.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {!submitted ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>{title || "Kaynak İndir"}</DialogTitle>
                            <DialogDescription>
                                {description || "Lütfen devam etmek için bilgilerinizi girin."}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="full_name">Ad Soyad</Label>
                                <Input id="full_name" name="full_name" required placeholder="Adınız Soyadınız" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">E-posta</Label>
                                <Input id="email" name="email" type="email" required placeholder="ornek@sirket.com" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="company">Firma Adı</Label>
                                <Input id="company" name="company" placeholder="Firma Adı" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Telefon</Label>
                                <Input id="phone" name="phone" type="tel" placeholder="0555 555 55 55" />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full mt-2">
                                {loading ? "İşleniyor..." : "Devam Et"}
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold">Teşekkürler!</h3>
                        <p className="text-muted-foreground">İstediğiniz kaynağa şimdi erişebilirsiniz.</p>
                        <Button onClick={() => setOpen(false)} variant="outline" className="mt-4">
                            Kapat ve Görüntüle
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
