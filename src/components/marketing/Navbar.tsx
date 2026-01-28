"use client";

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Menu, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LeadCaptureModal } from '@/components/marketing/LeadCaptureModal'

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'Süreç', href: '/#process-flow' },
        { name: 'Çözümler', href: '/solutions' },
        { name: 'Fiyatlandırma', href: '/#pricing' },
        { name: 'Ödeme Planı Sihirbazı', href: '/payment-plan-calculator' },
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
                    <span className="tracking-tight">NovoxCRM</span>
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
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5" asChild>
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                    <LeadCaptureModal
                        title="Ücretsiz Tanıtım ve Demo"
                        description="Satışlarınızı nasıl artırabileceğimizi göstermek için bir uzmanımız sizinle iletişime geçecek."
                        resourceName="Navbar_Demo_Request"
                    >
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-lg shadow-blue-900/20">
                            <span className="flex items-center">
                                Hemen Başlayın
                                <ChevronRight size={16} className="ml-1" />
                            </span>
                        </Button>
                    </LeadCaptureModal>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white p-2"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
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
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    <Button variant="outline" size="lg" className="w-full border-slate-800 text-white" asChild>
                        <Link href="/login">Giriş Yap</Link>
                    </Button>
                    <LeadCaptureModal
                        title="Ücretsiz Tanıtım ve Demo"
                        description="Satışlarınızı nasıl artırabileceğimizi göstermek için bir uzmanımız sizinle iletişime geçecek."
                        resourceName="MobileNavbar_Demo_Request"
                    >
                        <Button size="lg" className="w-full bg-blue-600 text-white">
                            Ücretsiz Kaydol / Tanıtım İste
                        </Button>
                    </LeadCaptureModal>
                </div>
            </div>
        </nav>
    )
}
