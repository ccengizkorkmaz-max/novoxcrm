import { login, signup } from './actions'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { Building2, ArrowRight, ShieldCheck } from 'lucide-react'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { getTranslations } from 'next-intl/server'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default async function LoginPage(props: {
    searchParams: Promise<{ message: string, error: string }>
}) {
    const params = await props.searchParams
    const t = await getTranslations('Auth')

    return (
        <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">

            {/* Left Side: Visuals & Branding */}
            <div className="hidden bg-slate-900 lg:block relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-900/40 z-10" />
                {/* Abstract Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                </div>

                <div className="relative z-20 flex flex-col h-full justify-between p-12 text-white">
                    <div className="flex items-center gap-2 text-lg font-medium">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <span className="tracking-tight font-bold">NovoxCrm</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-4xl font-bold tracking-tight leading-tight">
                            {t('sidebarTitle')}
                        </h1>
                        <p className="text-slate-300 text-lg">
                            {t('sidebarDesc')}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{t('secureInfrastructure')}</span>
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
                            <div className="bg-primary/10 p-3 rounded-xl inline-flex text-primary">
                                <Building2 className="h-8 w-8" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('welcome')}</h1>
                        <p className="text-muted-foreground">
                            {t('description')}
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

                    <form className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email" className="font-semibold">{t('emailLabel')}</Label>
                            <Input
                                id="email"
                                name="email"
                                type="text"
                                placeholder={t('emailPlaceholder')}
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="font-semibold">{t('passwordLabel')}</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="h-11 border-gray-200 focus:border-blue-500 transition-colors"
                                placeholder={t('passwordPlaceholder')}
                            />
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <Button formAction={login} className="h-11 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-600/20 transition-all">
                                {t('loginButton')} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </form>

                    <div className="flex flex-col items-center gap-1">
                        <Link
                            href="/broker/apply"
                            className="text-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline py-1"
                        >
                            {t('brokerLink')}
                        </Link>

                        <LeadCaptureModal
                            resourceName="SaaS Registration"
                            title={t('registerModalTitle')}
                            description={t('registerModalDesc')}
                        >
                            <button type="button" className="text-center text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline py-1">
                                {t('registerLink')}
                            </button>
                        </LeadCaptureModal>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground">
                        {t('termsAgreement')}{" "}
                        <a href="#" className="underline underline-offset-4 hover:text-primary">
                            {t('termsLink')}
                        </a>{" "}
                        {t('and')}{" "}
                        <a href="#" className="underline underline-offset-4 hover:text-primary">
                            {t('privacyLink')}
                        </a>
                        {t('agreementSuffix')}
                    </p>
                </div>
            </div>
        </div>
    )
}
