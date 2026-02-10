'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Menu, LogOut, ShieldCheck, LayoutDashboard, CreditCard, CalendarCheck, FileText } from 'lucide-react'

interface PortalMobileMenuProps {
    menuItems: { label: string, href: string }[]
    profile: any
    translations: {
        title: string
        logout: string
    }
}

const iconMap: Record<string, any> = {
    '/customerservices': LayoutDashboard,
    '/customerservices/financials': CreditCard,
    '/customerservices/tracking': CalendarCheck,
    '/customerservices/tickets': ShieldCheck,
    '/customerservices/documents': FileText,
}

export default function PortalMobileMenu({ menuItems, profile, translations }: PortalMobileMenuProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="-ml-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full bg-white">
                    <SheetHeader className="p-6 border-b text-left">
                        <SheetTitle className="flex items-center gap-2 text-blue-600">
                            <ShieldCheck className="h-6 w-6" />
                            <span className="text-xl tracking-tight">{translations.title}</span>
                        </SheetTitle>
                        <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {profile?.tenants?.name}
                        </div>
                    </SheetHeader>

                    <nav className="flex-1 space-y-1 p-4">
                        {menuItems.map((item) => {
                            const Icon = iconMap[item.href] || ShieldCheck
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="border-t p-4 mt-auto">
                        <form action="/auth/signout" method="post">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                                <LogOut className="h-5 w-5" />
                                {translations.logout}
                            </Button>
                        </form>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
