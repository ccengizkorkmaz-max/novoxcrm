'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2, CheckCircle2, ArrowRight, Phone, Mail, User, ShieldCheck, Loader2, Send } from 'lucide-react'
import { submitBrokerApplication, sendVerificationCode } from '../actions'
import { toast } from 'sonner'
import Link from 'next/link'

export default function BrokerApplyPage() {
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [success, setSuccess] = useState(false)
    const [step, setStep] = useState(1) // 1: Email, 2: Code & Details
    const [email, setEmail] = useState('')

    async function handleRequestCode(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const form = new FormData(e.currentTarget)
        const targetEmail = form.get('email') as string
        setEmail(targetEmail)

        const res = await sendVerificationCode(targetEmail)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Doğrulama kodu e-postanıza gönderildi.')
            setStep(2)
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setVerifying(true)

        const formData = new FormData(e.currentTarget)
        const res = await submitBrokerApplication(formData)

        if (res.error) {
            toast.error(res.error)
        } else {
            setSuccess(true)
            toast.success('Başvurunuz başarıyla iletildi.')
        }
        setVerifying(false)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-none shadow-xl rounded-3xl text-center p-8">
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold mb-4">Başvurunuz Alındı!</CardTitle>
                    <CardDescription className="text-md mb-8">
                        E-postanız doğrulandı ve başvurunuz başarıyla kaydedildi. Ekiplerimiz en kısa sürede sizinle iletişime geçecektir.
                    </CardDescription>
                    <Button asChild className="w-full h-12 rounded-xl text-md font-bold">
                        <Link href="/login">Giriş Sayfasına Dön</Link>
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4">
            <div className="max-w-xl w-full mb-8 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold mb-4">
                    <Building2 className="h-4 w-4" />
                    Novox Partner Programı
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Novox Projelerini Satmaya Başlayın</h1>
                <p className="text-slate-500">Dünya çapındaki projelerimize ortak olun, yüksek komisyonlardan yararlanın.</p>
            </div>

            <Card className="max-w-xl w-full border-none shadow-xl rounded-3xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold mb-2">Broker Başvuru Formu</h2>
                            <p className="text-blue-100 text-sm">
                                {step === 1 ? 'E-postanızı doğrulayarak başlayın.' : 'Doğrulama kodunu ve bilgilerinizi girin.'}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    </div>
                    {/* Stepper UI */}
                    <div className="flex gap-2 mt-6">
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-white' : 'bg-white/20'}`}></div>
                        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-white' : 'bg-white/20'}`}></div>
                    </div>
                </div>

                <CardContent className="p-8">
                    {step === 1 ? (
                        <form onSubmit={handleRequestCode} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-700 font-bold">Kurumsal E-posta Adresiniz</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="ornek@mail.com"
                                        className="pl-10 h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white"
                                    />
                                </div>
                                <p className="text-xs text-slate-400">Bu adrese bir doğrulama kodu gönderilecektir.</p>
                            </div>
                            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-md font-bold gap-2">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                {loading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input type="hidden" name="email" value={email} />

                            <div className="bg-blue-50 p-4 rounded-2xl mb-6 flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-blue-900 leading-none mb-1">E-posta Doğrulama</p>
                                    <p className="text-xs text-blue-700"><strong>{email}</strong> adresine gönderilen 6 haneli kodu girin.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="ml-auto text-xs text-blue-600 hover:text-blue-700 h-7"
                                    onClick={() => setStep(1)}
                                >
                                    Değiştir
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-slate-700 font-bold">Doğrulama Kodu</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    required
                                    placeholder="000000"
                                    maxLength={6}
                                    className="h-14 text-center text-2xl font-bold tracking-[0.5em] border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white"
                                />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name" className="text-slate-700 font-bold">Ad Soyad</Label>
                                    <Input id="full_name" name="full_name" required placeholder="Adınız Soyadınız" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-slate-700 font-bold">Telefon</Label>
                                    <Input id="phone" name="phone" type="tel" required placeholder="+90 ..." className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="company_name" className="text-slate-700 font-bold">Şirket/Ajans Adı (Zorunlu Değil)</Label>
                                <Input id="company_name" name="company_name" placeholder="Varsa şirket adınız" className="h-11 border-slate-100 bg-slate-50/50 rounded-xl focus:bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes" className="text-slate-700 font-bold">Kısa Tanıtım</Label>
                                <Textarea id="notes" name="notes" placeholder="Portföyünüzden bahsedin..." className="min-h-[100px] border-slate-100 bg-slate-50/50 rounded-xl resize-none" />
                            </div>

                            <Button type="submit" disabled={verifying} className="w-full h-12 rounded-xl text-md font-bold gap-2">
                                {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                                {verifying ? 'Doğrulanıyor...' : 'Başvuruyu Tamamla'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
