export const dynamic = "force-dynamic";
export const revalidate = 0;

import { RegisterForm } from './RegisterForm'
import { getBrandNameFromHost, getHostFromHeaders } from '@/lib/tenant/resolve-brand-from-host'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ShieldCheck, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Metadata } from 'next'

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await props.params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const titles = {
        tr: `${brandName} - Kayıt Ol & Kurulum`,
        en: `${brandName} - Sign Up & Setup`
    }

    const descriptions = {
        tr: `Novo CRM kurulumunuzu başlatın ve şirketinizin gayrimenkul satış süreçlerini hızlandırın.`,
        en: `Start your Novo CRM setup and accelerate your company's real estate sales processes.`
    }

    return {
        title: titles[locale as 'tr' | 'en'] || titles.tr,
        description: descriptions[locale as 'tr' | 'en'] || descriptions.tr,
        robots: {
            index: false,
            follow: false,
        }
    }
}

export default async function RegisterPage(props: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await props.params
    const host = await getHostFromHeaders()
    const brandName = await getBrandNameFromHost(host)

    const isOikos = brandName === 'Oikos CRM'

    const sideTitles = {
        tr: isOikos 
            ? "Satış süreçlerinizi modern bir deneyimle yönetin." 
            : "Kurumsal İnşaat ve Gayrimenkul CRM Altyapısı.",
        en: isOikos 
            ? "Manage your sales processes with a modern experience." 
            : "Enterprise Real Estate & Construction CRM Infrastructure."
    }

    const sideDescriptions = {
        tr: isOikos 
            ? "Müşteri takibi, envanter yönetimi, sözleşmeler ve finansal raporlar tek bir platformda."
            : "Projeler, bloklar, üniteler, ödeme planları ve broker portalları tek çatı altında.",
        en: isOikos
            ? "Customer tracking, inventory management, contracts and financial reports all in one platform."
            : "Projects, blocks, units, payment plans, and broker portals all under one roof."
    }

    const footerText = {
        tr: {
            secure: "Güvenli Altyapı",
            version: "Sürüm 2.0"
        },
        en: {
            secure: "Secure Infrastructure",
            version: "Version 2.0"
        }
    }

    const currentFooter = footerText[locale as 'tr' | 'en'] || footerText.tr

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
                
                {/* Abstract Dot Pattern */}
                <div className="absolute inset-0 opacity-20 animate-pulse duration-[10s]"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                </div>

                <div className="relative z-20 flex flex-col h-full justify-between p-12 text-white">
                    <div className="flex items-center gap-2.5 text-lg font-medium">
                        {isOikos ? (
                            <svg width="32" height="32" viewBox="0 0 32 32">
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
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <Building2 className="h-6 w-6" />
                            </div>
                        )}
                        <span className="tracking-tight font-bold">{brandName}</span>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h1 className="text-4xl font-bold tracking-tight leading-tight">
                            {sideTitles[locale as 'tr' | 'en'] || sideTitles.tr}
                        </h1>
                        <p className="text-slate-300 text-lg">
                            {sideDescriptions[locale as 'tr' | 'en'] || sideDescriptions.tr}
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            <span>{currentFooter.secure}</span>
                        </div>
                        <div className="h-1 w-1 bg-slate-600 rounded-full" />
                        <span>{currentFooter.version}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-background relative min-h-screen lg:min-h-0">
                <div className="absolute top-4 right-4">
                    <LanguageSwitcher variant="light" />
                </div>

                <RegisterForm locale={locale} brandName={brandName} isOikos={isOikos} />
            </div>
        </div>
    )
}
