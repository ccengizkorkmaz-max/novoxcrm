'use client'

import { useState, useTransition } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { ArrowRight } from 'lucide-react'
import { login, resetPassword } from './actions'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

interface LoginFormProps {
    isOikos: boolean
    emailDefaultValue: string
    translations: {
        emailLabel: string
        emailPlaceholder: string
        passwordLabel: string
        passwordPlaceholder: string
        loginButton: string
        forgotPassword: string
        brokerLink: string
        registerModalTitle: string
        registerModalDesc: string
        registerLink: string
        termsAgreement: string
        termsLink: string
        privacyLink: string
        and: string
        agreementSuffix: string
    }
}

export default function LoginForm({ isOikos, emailDefaultValue, translations }: LoginFormProps) {
    const [isPending, startTransition] = useTransition()
    const [loadingMessage, setLoadingMessage] = useState('')

    const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        setLoadingMessage('Giriş yapılıyor...')
        startTransition(async () => {
            try {
                await login(formData)
            } catch (err: any) {
                if (err?.digest?.startsWith('NEXT_REDIRECT')) {
                    throw err
                }
                console.error(err)
            }
        })
    }

    const handleForgotPasswordClick = async () => {
        const emailInput = document.getElementById('email') as HTMLInputElement
        const email = emailInput?.value || ''
        if (!email || !email.includes('@')) {
            toast.error('Lütfen geçerli bir e-posta adresi girin.')
            return
        }

        const formData = new FormData()
        formData.append('email', email)
        
        setLoadingMessage('Şifre sıfırlama e-postası gönderiliyor...')
        startTransition(async () => {
            try {
                await resetPassword(formData)
            } catch (err: any) {
                if (err?.digest?.startsWith('NEXT_REDIRECT')) {
                    throw err
                }
                console.error(err)
            }
        })
    }

    return (
        <div className="relative">
            {/* Animated Loading Overlay */}
            <AnimatePresence>
                {isPending && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -inset-4 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-md rounded-2xl"
                    >
                        <div className="flex flex-col items-center gap-4 p-6 text-center select-none">
                            {/* Premium loader animation */}
                            <div className="relative flex items-center justify-center">
                                <motion.div 
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                                    className={cn(
                                        "w-14 h-14 rounded-full border-4 border-t-transparent",
                                        isOikos 
                                            ? "border-[#085041] shadow-[0_0_15px_rgba(8,80,65,0.3)]" 
                                            : "border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                                    )}
                                />
                                <motion.div 
                                    animate={{ scale: [0.9, 1.1, 0.9] }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className={cn(
                                        "absolute w-6 h-6 rounded-full opacity-40",
                                        isOikos ? "bg-[#085041]" : "bg-blue-600"
                                    )}
                                />
                            </div>
                            <motion.p 
                                initial={{ y: 5, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm font-bold text-foreground/80 tracking-wide animate-pulse mt-2"
                            >
                                {loadingMessage}
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleLoginSubmit} className="grid gap-6">
                <div className="grid gap-2">
                    <Label htmlFor="email" className="font-semibold">{translations.emailLabel}</Label>
                    <Input
                        id="email"
                        name="email"
                        type="text"
                        placeholder={translations.emailPlaceholder}
                        required
                        defaultValue={emailDefaultValue}
                        className={cn(
                            "h-11 border-gray-200 transition-colors", 
                            isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500"
                        )}
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="font-semibold">{translations.passwordLabel}</Label>
                    </div>
                    <PasswordInput
                        id="password"
                        name="password"
                        required
                        className={cn(
                            "h-11 border-gray-200 transition-colors", 
                            isOikos ? "focus:border-[#085041] focus:ring-[#085041]" : "focus:border-blue-500"
                        )}
                        placeholder={translations.passwordPlaceholder}
                    />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Button 
                        type="submit"
                        className={cn(
                            "h-11 w-full text-white font-medium transition-all cursor-pointer",
                            isOikos 
                                ? "bg-[#085041] hover:bg-[#0F6E56] shadow-lg shadow-[#085041]/20 border-none" 
                                : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20"
                        )}
                    >
                        {translations.loginButton} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={handleForgotPasswordClick}
                        className={cn(
                            "h-9 w-full text-sm font-medium cursor-pointer",
                            isOikos ? "text-slate-500 hover:text-[#085041] hover:bg-[#085041]/5" : "text-slate-500 hover:text-blue-600"
                        )}
                    >
                        {translations.forgotPassword}
                    </Button>
                </div>
            </form>

            <div className="flex flex-col items-center gap-1 mt-6">
                <Link
                    href="/broker/apply"
                    className={cn(
                        "text-center text-sm font-medium hover:underline py-1",
                        isOikos ? "text-[#085041] hover:text-[#0F6E56]" : "text-blue-600 hover:text-blue-700"
                    )}
                >
                    {translations.brokerLink}
                </Link>

                <LeadCaptureModal
                    resourceName="SaaS Registration"
                    title={translations.registerModalTitle}
                    description={translations.registerModalDesc}
                >
                    <button type="button" className="text-center text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline py-1 cursor-pointer">
                        {translations.registerLink}
                    </button>
                </LeadCaptureModal>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                {translations.termsAgreement}{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                    {translations.termsLink}
                </a>{" "}
                {translations.and}{" "}
                <a href="#" className="underline underline-offset-4 hover:text-primary">
                    {translations.privacyLink}
                </a>
                {translations.agreementSuffix}
            </p>
        </div>
    )
}
