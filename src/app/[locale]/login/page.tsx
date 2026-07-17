export const dynamic = "force-dynamic";

import { Building2, ShieldCheck } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { getBrandNameFromHost, getHostFromHeaders, adjustBranding } from '@/lib/tenant/resolve-brand-from-host'
import { cn } from '@/lib/utils'
import LoginForm from './LoginForm'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)
    return {
        title: `Giriş Yap | ${brandName}`,
        robots: {
            index: false,
            follow: false,
        }
    }
}

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string, error: string, email: string }>
}) {
    const params = await props.searchParams
    const t = await getTranslations('Auth')
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const isOikos = brandName === 'Oikos CRM'

    const translations = {
        emailLabel: t('emailLabel'),
        emailPlaceholder: t('emailPlaceholder'),
        passwordLabel: t('passwordLabel'),
        passwordPlaceholder: t('passwordPlaceholder'),
        loginButton: t('loginButton'),
        forgotPassword: t('forgotPassword'),
        brokerLink: t('brokerLink'),
        registerModalTitle: adjustBranding(t('registerModalTitle'), brandName),
        registerModalDesc: adjustBranding(t('registerModalDesc'), brandName),
        registerLink: adjustBranding(t('registerLink'), brandName),
        termsAgreement: t('termsAgreement'),
        termsLink: t('termsLink'),
        privacyLink: t('privacyLink'),
        and: t('and'),
        agreementSuffix: t('agreementSuffix'),
    }

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">

            {/* Left Side: Visuals & Branding */}
            <div className={cn(
                "hidden lg:block relative overflow-hidden",
                isOikos ? "bg-[#04342C]" : "bg-slate-900"
            )}>
                <div className={cn(
                    "absolute inset-0 z-10",
                    isOikos 
                        ? "bg-gradient-to-br from-[#085041]/60 to-[#04342C]/40" 
                        : "bg-gradient-to-br from-blue-600/20 to-indigo-900/40"
                )} />
                {/* Abstract Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                </div>

                <div className="relative z-20 flex flex-col h-full justify-between p-12 text-white">
                    <div className="flex items-center gap-2.5 text-lg font-medium">
                        {isOikos ? (
                            <svg width="32" height="32" viewBox="0 0 32 32">
                                <rect width="32" height="32" rx="7" fill="#0F6E56"></rect>
                                <circle cx="16" cy="13" r="7" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.9"></circle>
                                <polygon points="16,7 22,13 10,13" fill="#fff" opacity="0.95"></polygon>
                                <line x1="13" y1="13" x2="13" y2="17" stroke="#5DCAA5" stroke-width="1.8" stroke-linecap="round"></line>
                                <line x1="19" y1="13" x2="19" y2="17" stroke="#5DCAA5" stroke-width="1.8" stroke-linecap="round"></line>
                                <rect x="14" y="20" width="4" height="8" rx="2" fill="#fff" opacity="0.9"></rect>
                                <rect x="18" y="24" width="3" height="2.5" rx="1" fill="#5DCAA5"></rect>
                                <circle cx="16" cy="7" r="2.5" fill="#EF9F27"></circle>
                            </svg>
                        ) : (
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <Building2 className="h-6 w-6" />
                            </div>
                        )}
                        <span className="tracking-tight font-bold">{brandName}</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-4xl font-bold tracking-tight leading-tight">
                            {adjustBranding(t('sidebarTitle'), brandName)}
                        </h1>
                        <p className="text-slate-300 text-lg">
                            {adjustBranding(t('sidebarDesc'), brandName)}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{adjustBranding(t('secureInfrastructure'), brandName)}</span>
                        </div>
                        <div className="h-1 w-1 bg-slate-600 rounded-full" />
                        <span>{t('version')}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-background relative">
                <div className="absolute top-4 right-4">
                    <LanguageSwitcher variant="light" />
                </div>

                <div className="mx-auto grid w-full max-w-[400px] gap-8">
                    <div className="flex flex-col space-y-2 text-center">
                        <div className="lg:hidden flex justify-center mb-4">
                            {isOikos ? (
                                <svg width="48" height="48" viewBox="0 0 32 32">
                                    <rect width="32" height="32" rx="7" fill="#0F6E56"></rect>
                                    <circle cx="16" cy="13" r="7" fill="none" stroke="#fff" strokeWidth="2.2" opacity="0.9"></circle>
                                    <polygon points="16,7 22,13 10,13" fill="#fff" opacity="0.95"></polygon>
                                    <line x1="13" y1="13" x2="13" y2="17" stroke="#5DCAA5" stroke-width="1.8" stroke-linecap="round"></line>
                                    <line x1="19" y1="13" x2="19" y2="17" stroke="#5DCAA5" stroke-width="1.8" stroke-linecap="round"></line>
                                    <rect x="14" y="20" width="4" height="8" rx="2" fill="#fff" opacity="0.9"></rect>
                                    <rect x="18" y="24" width="3" height="2.5" rx="1" fill="#5DCAA5"></rect>
                                    <circle cx="16" cy="7" r="2.5" fill="#EF9F27"></circle>
                                </svg>
                            ) : (
                                <div className="bg-primary/10 p-3 rounded-xl inline-flex text-primary">
                                    <Building2 className="h-8 w-8" />
                                </div>
                            )}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('welcome')}</h1>
                        <p className="text-muted-foreground">
                            {adjustBranding(t('description'), brandName)}
                        </p>
                    </div>

                    {params?.message && (
                        <div className="p-4 rounded-lg bg-emerald-50 text-emerald-900 text-sm font-medium border border-emerald-200 animate-in fade-in slide-in-from-top-2">
                            {params.message}
                        </div>
                    )}
                    {params?.error && (
                        <div className="p-4 rounded-lg bg-red-50 text-red-900 text-sm font-medium border border-red-200 animate-in fade-in slide-in-from-top-2">
                            {params.error}
                        </div>
                    )}

                    <LoginForm 
                        isOikos={isOikos} 
                        emailDefaultValue={params?.email || ''} 
                        translations={translations} 
                    />
                </div>
            </div>
        </div>
    )
}
