"use client";
import { useState, useEffect, useRef } from 'react'
import { Building2, Menu, X, ChevronRight, ChevronDown, Calculator, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'
import NotificationBell from '@/components/notifications/NotificationBell'
import { useBrandedTranslations, useBrand } from '@/components/providers/BrandProvider'
import { Link } from '@/i18n/routing'
import LanguageSwitcher from '@/components/LanguageSwitcher'

const toolsMenu = [
    { name: 'Tapu Harcı Hesaplayıcı', href: '/tools/tapu-harci-hesaplayici', icon: Calculator, desc: 'Tapu harcı, KDV ve döner sermaye hesaplama' },
    { name: 'Ödeme Planı Sihirbazı', href: '/payment-plan-calculator', icon: CreditCard, desc: 'Konut projeleri için ödeme planı oluşturun' },
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
                setIsToolsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const navLinks = [
        { name: t('solutions_realestate'), href: '/solutions/gayrimenkul-crm' },
        { name: t('solutions_construction'), href: '/solutions/insaat-crm' },
        { name: t('wiki'), href: '/wiki' },
        { name: t('pricing'), href: '/#pricing' },
    ]

    return (
        <nav className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300 border-b",
            isScrolled
                ? "bg-slate-950/80 backdrop-blur-md border-slate-800 py-3"
                : "bg-transparent border-transparent py-5"
        )}>
            <div className="container mx-auto px-4 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 text-white font-bold text-xl group">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:scale-110 transition-transform">
                        <Building2 size={24} className="text-white" />
                    </div>
                    <span className="tracking-tight">{brandName}</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Tools Dropdown */}
                    <div className="relative" ref={toolsRef}>
                        <button
                            onClick={() => setIsToolsOpen(!isToolsOpen)}
                            className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Araçlar
                            <ChevronDown size={14} className={cn("transition-transform", isToolsOpen && "rotate-180")} />
                        </button>

                        {isToolsOpen && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2">
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
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
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
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex items-center gap-4 md:hidden">
                    <LanguageSwitcher variant="dark" />
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
                "fixed inset-0 top-[73px] bg-slate-950 z-40 md:hidden transition-transform duration-300 p-6 flex flex-col gap-6 border-t border-slate-900",
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

                    {/* Mobile Tools Section */}
                    <div className="border-t border-slate-800 pt-4">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Ücretsiz Araçlar</p>
                        {toolsMenu.map((tool) => (
                            <Link
                                key={tool.href}
                                href={tool.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 py-3 text-lg text-slate-300 hover:text-white"
                            >
                                <tool.icon size={20} className="text-blue-400" />
                                {tool.name}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-4">
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
                </div>
            </div>
        </nav>
    )
}
