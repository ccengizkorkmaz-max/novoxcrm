'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User, Mail, Lock, Loader2, CheckCircle } from "lucide-react"
import { createTenantWithAdmin } from '../../admin/actions'
import Link from 'next/link'

export default function OnboardingPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        const res = await createTenantWithAdmin(formData)

        setLoading(false)
        if (res.error) {
            setError(res.error)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl">Kurulum Başarılı!</CardTitle>
                        <CardDescription>
                            Şirket hesabınız ve yönetici profiliniz oluşturuldu.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-500">
                            Artık giriş yaparak ekibinizi davet etmeye başlayabilirsiniz.
                        </p>
                        <Link href="/login">
                            <Button className="w-full">Giriş Yap</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="text-2xl">NovoxCrm Kurulumu</CardTitle>
                    <CardDescription>
                        Kendi CRM ortamınızı oluşturmak için şirket bilgilerinizi girin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Şirket Adı</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="companyName" name="companyName" placeholder="Örn: Acme Gayrimenkul A.Ş." className="pl-10" required />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="adminName">Yönetici Ad Soyad</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="adminName" name="adminName" placeholder="Adınız" className="pl-10" required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="adminEmail">E-posta Adresi</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input id="adminEmail" name="adminEmail" type="email" placeholder="admin@acme.com" className="pl-10" required />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="adminPassword">Yönetici Şifresi</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input id="adminPassword" name="adminPassword" type="password" placeholder="******" className="pl-10" required minLength={6} />
                                </div>
                                <p className="text-xs text-muted-foreground">En az 6 karakter olmalıdır.</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Kuruluyor...
                                </>
                            ) : (
                                'Hesabı Oluştur'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
