'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User, Mail, Lock, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { createTenantWithAdmin } from '../../admin/actions'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface RegisterFormProps {
    locale: string
    brandName: string
    isOikos: boolean
}

const translations = {
    tr: {
        title: "CRM Kurulumu",
        desc: "Kendi CRM ortamınızı oluşturmak için şirket bilgilerinizi girin.",
        companyLabel: "Şirket Adı",
        companyPlaceholder: "Örn: Acme Gayrimenkul A.Ş.",
        adminNameLabel: "Yönetici Ad Soyad",
        adminNamePlaceholder: "Adınız Soyadınız",
        adminEmailLabel: "E-posta Adresi",
        adminEmailPlaceholder: "admin@sirket.com",
        adminPasswordLabel: "Yönetici Şifresi",
        adminPasswordPlaceholder: "••••••",
        passwordHint: "En az 6 karakter olmalıdır.",
        submitButton: "Hesabı Oluştur",
        loadingButton: "Kuruluyor...",
        successTitle: "Kurulum Başarılı!",
        successDesc: "Şirket hesabınız ve yönetici profiliniz oluşturuldu.",
        successHint: "Artık giriş yaparak ekibinizi davet etmeye başlayabilirsiniz.",
        loginButton: "Giriş Yap",
        alreadyHasAccount: "Zaten hesabınız var mı?",
        loginLink: "Giriş Yapın",
        termsAgreement: "Hesap oluşturarak",
        termsLink: "Kullanım Şartları",
        privacyLink: "Gizlilik Politikası",
        and: "ve",
        agreementSuffix: "'nı kabul etmiş sayılırsınız.",
    },
    en: {
        title: "CRM Setup",
        desc: "Enter your company details to create your own CRM environment.",
        companyLabel: "Company Name",
        companyPlaceholder: "e.g., Acme Real Estate Inc.",
        adminNameLabel: "Admin Full Name",
        adminNamePlaceholder: "Your full name",
        adminEmailLabel: "Email Address",
        adminEmailPlaceholder: "admin@company.com",
        adminPasswordLabel: "Admin Password",
        adminPasswordPlaceholder: "••••••",
        passwordHint: "Must be at least 6 characters.",
        submitButton: "Create Account",
        loadingButton: "Setting up...",
        successTitle: "Setup Successful!",
        successDesc: "Your company account and admin profile have been created.",
        successHint: "You can now log in and start inviting your team.",
        loginButton: "Log In",
        alreadyHasAccount: "Already have an account?",
        loginLink: "Log in here",
        termsAgreement: "By creating an account, you agree to our",
        termsLink: "Terms of Service",
        privacyLink: "Privacy Policy",
        and: "and",
        agreementSuffix: ".",
    }
}

export function RegisterForm({ locale, brandName, isOikos }: RegisterFormProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const t = translations[locale as 'tr' | 'en'] || translations.tr

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)

        try {
            const res = await createTenantWithAdmin(formData)
            if (res.error) {
                setError(res.error)
            } else {
                setSuccess(true)
            }
        } catch (e: any) {
            setError(locale === 'en' ? 'A system error occurred.' : 'Sistem hatası oluştu.')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <Card className="w-full border-none shadow-none bg-transparent">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 animate-bounce">
                        <CheckCircle className="h-7 w-7 text-emerald-600" />
                    </div>
                    <CardTitle className={cn(
                        "text-3xl font-bold tracking-tight",
                        isOikos ? "text-[#085041]" : "text-blue-600"
                    )}>{t.successTitle}</CardTitle>
                    <CardDescription className="text-slate-500 text-base mt-2">
                        {t.successDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4 text-center">
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        {t.successHint}
                    </p>
                    <div className="pt-2">
                        <Link href="/login">
                            <Button className={cn(
                                "h-11 w-full text-white font-medium shadow-lg transition-all cursor-pointer",
                                isOikos 
                                    ? "bg-[#085041] hover:bg-[#0F6E56] shadow-[#085041]/20" 
                                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                            )}>
                                {t.loginButton} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="mx-auto grid w-full max-w-[420px] gap-8">
            <div className="flex flex-col space-y-2 text-center">
                <div className="lg:hidden flex justify-center mb-4">
                    {isOikos ? (
                        <svg width="48" height="48" viewBox="0 0 32 32">
                            <rect width="32" height="32" rx="7" fill="#0F6E56"></rect>
                            <circle cx="16" cy="13" r="7" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.9"></circle>
                            <polygon points="16,7 22,13 10,13" fill="#fff" opacity="0.95"></polygon>
                            <line x1="13" y1="13" x2="13" y2="17" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"></line>
                            <line x1="19" y1="13" x2="19" y2="17" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round"></line>
                            <rect x="14" y="20" width="4" height="8" rx="2" fill="#fff" opacity="0.9"></rect>
                            <rect x="18" y="24" width="3" height="2.5" rx="1" fill="#5DCAA5"></rect>
                            <circle cx="16" cy="7" r="2.5" fill="#EF9F27"></circle>
                        </svg>
                    ) : (
                        <div className="bg-primary/10 p-3 rounded-xl inline-flex text-primary">
                            <Building2 className="h-8 w-8 text-blue-600" />
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{brandName} {t.title}</h1>
                <p className="text-slate-500 text-sm">
                    {t.desc}
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 text-red-900 text-sm font-medium border border-red-200 animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            <form action={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                    <Label htmlFor="companyName" className="font-semibold text-slate-700">{t.companyLabel}</Label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="companyName" 
                            name="companyName" 
                            placeholder={t.companyPlaceholder} 
                            className={cn(
                                "pl-10 h-11 border-slate-200 focus:ring-2 focus:ring-offset-1 transition-all",
                                isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500 focus:ring-blue-500"
                            )} 
                            required 
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="adminName" className="font-semibold text-slate-700">{t.adminNameLabel}</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="adminName" 
                            name="adminName" 
                            placeholder={t.adminNamePlaceholder} 
                            className={cn(
                                "pl-10 h-11 border-slate-200 focus:ring-2 focus:ring-offset-1 transition-all",
                                isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500 focus:ring-blue-500"
                            )} 
                            required 
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="adminEmail" className="font-semibold text-slate-700">{t.adminEmailLabel}</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="adminEmail" 
                            name="adminEmail" 
                            type="email"
                            placeholder={t.adminEmailPlaceholder} 
                            className={cn(
                                "pl-10 h-11 border-slate-200 focus:ring-2 focus:ring-offset-1 transition-all",
                                isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500 focus:ring-blue-500"
                            )} 
                            required 
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="adminPassword" className="font-semibold text-slate-700">{t.adminPasswordLabel}</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                            id="adminPassword" 
                            name="adminPassword" 
                            type="password"
                            placeholder={t.adminPasswordPlaceholder} 
                            className={cn(
                                "pl-10 h-11 border-slate-200 focus:ring-2 focus:ring-offset-1 transition-all",
                                isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500 focus:ring-blue-500"
                            )} 
                            required 
                            minLength={6}
                        />
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{t.passwordHint}</p>
                </div>

                <Button 
                    type="submit" 
                    disabled={loading} 
                    className={cn(
                        "h-11 w-full text-white font-medium shadow-lg transition-all mt-2 cursor-pointer",
                        isOikos 
                            ? "bg-[#085041] hover:bg-[#0F6E56] shadow-[#085041]/20" 
                            : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
                    )}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t.loadingButton}
                        </>
                    ) : (
                        t.submitButton
                    )}
                </Button>
            </form>

            <div className="flex flex-col items-center gap-2 text-sm text-slate-500">
                <p>
                    {t.alreadyHasAccount}{" "}
                    <Link 
                        href="/login" 
                        className={cn(
                            "font-semibold hover:underline",
                            isOikos ? "text-[#085041]" : "text-blue-600"
                        )}
                    >
                        {t.loginLink}
                    </Link>
                </p>
            </div>

            <p className="px-8 text-center text-xs text-slate-400 leading-relaxed">
                {t.termsAgreement}{" "}
                <a href="#" className="underline hover:text-slate-600">
                    {t.termsLink}
                </a>{" "}
                {t.and}{" "}
                <a href="#" className="underline hover:text-slate-600">
                    {t.privacyLink}
                </a>
                {t.agreementSuffix}
            </p>
        </div>
    )
}
