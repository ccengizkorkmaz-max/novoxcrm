"use client";
import { useState, useEffect, useRef } from 'react'
import { Building2, Menu, X, ChevronRight, ChevronDown, Calculator, CreditCard, Home, TrendingUp, Percent, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import { useBrandedTranslations, useBrand } from '@/components/providers/BrandProvider'
import { Link } from '@/i18n/routing'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const toolsMenu = [
    { name: 'Tapu Harcı Hesaplayıcı', href: '/tools/tapu-harci-hesaplayici', icon: Calculator, desc: 'Tapu harcı, KDV ve döner sermaye hesaplama' },
    { name: 'Şerefiye Hesaplayıcı', href: '/tools/serefiye-hesaplayici', icon: Building2, desc: 'Kat, cephe ve manzara bazlı fiyat farkı' },
    { name: 'Emlak Vergisi Hesaplayıcı', href: '/tools/emlak-vergisi-hesaplayici', icon: Home, desc: '2026 güncel vergi dilimleriyle hesaplama' },
    { name: 'Konut Kredisi Karşılaştırma', href: '/tools/konut-kredisi-karsilastirma', icon: TrendingUp, desc: '10 bankanın faiz oranlarını karşılaştırın' },
    { name: 'Ödeme Planı Sihirbazı', href: '/payment-plan-calculator', icon: CreditCard, desc: 'Konut projeleri için ödeme planı oluşturun' },
    { name: 'Broker Komisyonu', href: '/tools/broker-komisyon-hesaplayici', icon: Calculator, desc: 'Broker ve danışman komisyon payı' },
    { name: 'Yatırım Getirisi (ROI)', href: '/tools/yatirim-getirisi-hesaplayici', icon: Percent, desc: 'ROI ve geri dönüş süresi hesaplama' },
    { name: 'Kira Getirisi Analizi', href: '/tools/kira-getirisi-hesaplayici', icon: DollarSign, desc: 'Brüt ve net kira getirisi oranları' },
    { name: 'İnşaat Maliyeti', href: '/tools/insaat-maliyet-hesaplayici', icon: Building2, desc: 'Kaba ve ince inşaat birim maliyetleri' },
    { name: 'Metrekare Birim Fiyat', href: '/tools/metrekare-birim-fiyat', icon: Calculator, desc: 'Gayrimenkul metrekare birim fiyatı' },
    { name: 'Damga Vergisi', href: '/tools/damga-vergisi-hesaplayici', icon: CreditCard, desc: 'Sözleşme ve tapu damga vergisi oranları' },
]

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isToolsOpen, setIsToolsOpen] = useState(false)
    const toolsRef = useRef<HTMLDivElement>(null)
    const t = useBrandedTranslations('Navbar')
    const { brandName } = useBrand()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
                setIsToolsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const navLinks = brandName === 'Oikos CRM'
        ? [
            { name: 'Özellikler', href: '/#ozellikler' },
            { name: 'Müşteri Journey', href: '/#journey' },
            { name: 'Neden Oikos', href: '/#neden-oikos' },
            { name: 'Fiyatlar', href: '/#fiyatlar' },
            { name: 'Detaylı Tanıtım', href: '/detayli-tanitim' },
        ]
        : [
            { name: t('solutions_realestate'), href: '/solutions/gayrimenkul-crm' },
            { name: t('solutions_construction'), href: '/solutions/insaat-crm' },
            { name: t('wiki'), href: '/wiki' },
            { name: t('pricing'), href: '/#pricing' },
        ]

    const isOikos = brandName === 'Oikos CRM'

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300 border-b",
            isOikos
                ? (isScrolled 
                    ? "bg-[#085041]/90 backdrop-blur-md border-[#0F6E56]/40 py-3 text-white" 
                    : "bg-[#085041] border-transparent py-4 text-white")
                : (isScrolled
                    ? "bg-slate-950/80 backdrop-blur-md border-slate-800 py-3"
                    : "bg-transparent border-transparent py-5")
        )}>
            <div className={cn(
                "flex items-center justify-between mx-auto",
                isOikos ? "w-full px-6 md:px-10" : "container px-4"
            )}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-xl group">
                    {isOikos ? (
                        <div className="flex items-center gap-2">
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
                            <div className="flex items-baseline">
                                <span className="text-base font-semibold text-white">Oikos</span>
                                <span className="text-xs text-[#5DCAA5] ml-1.5 font-medium">CRM</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                                <Building2 size={24} className="text-white" />
                            </div>
                            <span className="tracking-tight">{brandName}</span>
                        </>
                    )}
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors",
                                isOikos 
                                    ? "text-[#9FE1CB] hover:text-white" 
                                    : "text-slate-400 hover:text-white"
                            )}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Tools Dropdown (Novo CRM Only) */}
                    {!isOikos && (
                        <div className="relative" ref={toolsRef}>
                            <button
                                onClick={() => setIsToolsOpen(!isToolsOpen)}
                                className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Araçlar
                                <ChevronDown size={14} className={cn("transition-transform", isToolsOpen && "rotate-180")} />
                            </button>

                            {isToolsOpen && (
                                <div className="absolute top-full right-0 mt-3 w-[640px] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                    <div className="p-4 grid grid-cols-2 gap-2">
                                        {toolsMenu.map((tool) => (
                                            <Link
                                                key={tool.href}
                                                href={tool.href}
                                                onClick={() => setIsToolsOpen(false)}
                                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/80 transition-colors group"
                                            >
                                                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                                                    <tool.icon size={18} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-white">{tool.name}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{tool.desc}</div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {isOikos ? (
                        <Button 
                            className="bg-transparent hover:bg-[#0F6E56] border border-[#5DCAA5] text-[#9FE1CB] hover:text-white rounded-lg px-5 py-2 font-medium text-sm transition-all cursor-pointer"
                            onClick={() => window.dispatchEvent(new CustomEvent('oikos-open-contact'))}
                        >
                            İletişime geçin
                        </Button>
                    ) : (
                        <>
                            <LanguageSwitcher variant="dark" />
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" asChild>
                                <Link href="/login">{t('login')}</Link>
                            </Button>
                            <LeadCaptureModal
                                title={t('demoTitle')}
                                description={t('demoDescription')}
                                resourceName="Navbar_Demo_Request"
                            >
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-900/20">
                                    <span className="flex items-center">
                                        {t('start')}
                                        <ChevronRight size={16} className="ml-1" />
                                    </span>
                                </Button>
                            </LeadCaptureModal>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4 md:hidden">
                    {!isOikos && <LanguageSwitcher variant="dark" />}
                    <button
                        className="text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
                    >
                        {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div className={cn(
                "fixed inset-0 top-[65px] md:hidden transition-transform duration-300 p-6 flex flex-col gap-6 border-t",
                isOikos 
                    ? "bg-[#085041] border-[#0F6E56]/40 text-white" 
                    : "bg-slate-950 border-slate-900",
                isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex flex-col gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="text-2xl font-semibold text-white"
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Mobile Tools Section (Novo CRM Only) */}
                    {!isOikos && (
                        <div className="border-t border-slate-800 pt-4 max-h-[300px] overflow-y-auto pr-1">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Ücretsiz Araçlar</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {toolsMenu.map((tool) => (
                                    <Link
                                        key={tool.href}
                                        href={tool.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-2 py-2 text-sm text-slate-300 hover:text-white"
                                    >
                                        <tool.icon size={16} className="text-blue-400 shrink-0" />
                                        <span className="truncate">{tool.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    {isOikos ? (
                        <Button 
                            size="lg" 
                            className="w-full bg-[#EF9F27] hover:bg-[#FAC775] text-[#412402] font-semibold"
                            onClick={() => {
                                setIsMobileMenuOpen(false)
                                window.dispatchEvent(new CustomEvent('oikos-open-contact'))
                            }}
                        >
                            İletişime geçin
                        </Button>
                    ) : (
                        <>
                            <Button variant="outline" size="lg" className="w-full border-slate-800 text-white" asChild>
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>{t('login')}</Link>
                            </Button>
                            <LeadCaptureModal
                                title={t('demoTitle')}
                                description={t('demoDescription')}
                                resourceName="MobileNavbar_Demo_Request"
                            >
                                <Button size="lg" className="w-full bg-blue-600 text-white">
                                    {t('register')}
                                </Button>
                            </LeadCaptureModal>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
