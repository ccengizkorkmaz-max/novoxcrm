'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, Phone, Mail, Send, CheckCircle2, Loader2, Building2 } from 'lucide-react'
import { submitPublicLead } from '@/app/broker/actions'

export default function PublicLeadForm({ brokerId, tenantId, brokerName }: { brokerId: string, tenantId: string, brokerName: string }) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const result = await submitPublicLead(brokerId, tenantId, formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            setSuccess(true)
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="max-w-md mx-auto border-none shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-500">
                <CardContent className="p-12 text-center">
                    <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Başvurunuz Alındı!</h2>
                    <p className="text-slate-500 mb-8">Bilgileriniz başarıyla iletildi. Uzman danışmanlarımız en kısa sürede sizinle iletişime geçecektir.</p>
                    <Button onClick={() => window.location.reload()} className="w-full bg-slate-900 hover:bg-slate-800 rounded-2xl h-12 font-bold">
                        Yeni Başvuru
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-md mx-auto border-none shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Building2 className="h-24 w-24" />
                </div>
                <h2 className="text-2xl font-bold relative z-10">Gayrimenkul Yatırım Formu</h2>
                <p className="text-slate-400 text-sm mt-1 relative z-10">Hayallerinizdeki mülk için ilk adımı atın.</p>
                <div className="mt-6 flex items-center gap-3 relative z-10">
                    <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                        {brokerName.charAt(0)}
                    </div>
                    <span className="text-xs font-medium text-slate-300">Yönlendiren: <span className="text-white">{brokerName}</span></span>
                </div>
            </div>
            <CardContent className="p-8">
                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Ad Soyad *</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="full_name" name="full_name" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" placeholder="Adınız ve Soyadınız" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">Telefon *</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="phone" name="phone" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" placeholder="05xx xxx xx xx" required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">E-posta</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input id="email" name="email" type="email" className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all" placeholder="eposta@adresiniz.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500">Ek Notlar</Label>
                        <Textarea id="notes" name="notes" className="rounded-xl bg-slate-50 border-slate-100 focus:bg-white transition-all min-h-[80px]" placeholder="Sorularınız veya özel talepleriniz..." />
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold italic border border-red-100">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <>
                                Başvuru Gönder
                                <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </Button>

                    <p className="text-[10px] text-center text-slate-400 px-4">
                        Kişisel verileriniz 6698 sayılı KVKK kapsamında korunmaktadır. Göndererek şartları kabul etmiş sayılırsınız.
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
