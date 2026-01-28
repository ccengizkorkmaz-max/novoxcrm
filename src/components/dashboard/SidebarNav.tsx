'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Building2,
    Home,
    Users,
    FileText,
    Activity,
    CalendarCheck,
    Banknote,
    MessageSquare,
    Package,
    Gift,
    BarChart3,
    Settings2,
    Trophy,
    ChevronDown,
    Clock
} from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface NavItemProps {
    href: string
    icon: React.ElementType
    children: React.ReactNode
    onClick?: () => void
}

function NavItem({ href, icon: Icon, children, onClick }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                isActive
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-muted-foreground hover:bg-slate-50"
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-blue-600" : "text-muted-foreground")} />
            {children}
        </Link>
    )
}

export function SidebarNav({ onElementClick }: { onElementClick?: () => void }) {
    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem href="/" icon={LayoutDashboard} onClick={onElementClick}>
                Genel Bakış
            </NavItem>
            <NavItem href="/projects" icon={Building2} onClick={onElementClick}>
                Projeler
            </NavItem>
            <NavItem href="/inventory" icon={Home} onClick={onElementClick}>
                Stok Yönetimi
            </NavItem>
            <NavItem href="/customers" icon={Users} onClick={onElementClick}>
                Müşteriler
            </NavItem>
            <NavItem href="/teams" icon={Users} onClick={onElementClick}>
                Satış Ekipleri
            </NavItem>
            <NavItem href="/crm" icon={Activity} onClick={onElementClick}>
                Satış Yönetimi
            </NavItem>
            <NavItem href="/options" icon={Package} onClick={onElementClick}>
                Opsiyonlar
            </NavItem>
            <NavItem href="/offers" icon={FileText} onClick={onElementClick}>
                Teklifler
            </NavItem>
            <NavItem href="/contracts" icon={FileText} onClick={onElementClick}>
                Sözleşmeler
            </NavItem>
            <NavItem href="/finance/deposits" icon={Banknote} onClick={onElementClick}>
                Kapora Yönetimi
            </NavItem>
            <NavItem href="/activities" icon={CalendarCheck} onClick={onElementClick}>
                Aktiviteler
            </NavItem>
            <NavItem href="/customer-support" icon={MessageSquare} onClick={onElementClick}>
                Servis Talepleri
            </NavItem>

            <Accordion type="multiple" className="w-full border-none">
                <AccordionItem value="broker" className="border-none">
                    <AccordionTrigger className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-slate-50 rounded-lg hover:no-underline [&[data-state=open]]:text-primary font-medium">
                        <div className="flex items-center gap-3">
                            <Users className="h-4 w-4" />
                            <span>B2B Broker Yönetimi</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2 pl-4 grid gap-1">
                        <NavItem href="/admin/broker-applications" icon={Clock} onClick={onElementClick}>
                            Broker Yönetimi
                        </NavItem>
                        <NavItem href="/admin/broker-leads" icon={Users} onClick={onElementClick}>
                            Lead Yönetimi
                        </NavItem>
                        <NavItem href="/admin/broker-leads/campaigns" icon={Gift} onClick={onElementClick}>
                            Teşvik Kampanyaları
                        </NavItem>
                        <NavItem href="/admin/broker-leads/commission-settings" icon={Settings2} onClick={onElementClick}>
                            Komisyon Ayarları
                        </NavItem>
                        <NavItem href="/admin/broker-finances" icon={Banknote} onClick={onElementClick}>
                            Finansal Yönetim
                        </NavItem>
                        <NavItem href="/admin/broker-leads/levels" icon={Trophy} onClick={onElementClick}>
                            Seviye Yönetimi
                        </NavItem>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reports" className="border-none">
                    <AccordionTrigger className="px-3 py-2 text-muted-foreground hover:text-primary hover:bg-slate-50 rounded-lg hover:no-underline [&[data-state=open]]:text-primary font-medium">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-4 w-4" />
                            <span>Raporlar</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2 pl-4 grid gap-1">
                        <NavItem href="/reports/sales" icon={Activity} onClick={onElementClick}>
                            Satış Performansı
                        </NavItem>
                        <NavItem href="/reports/inventory" icon={Building2} onClick={onElementClick}>
                            Stok & Proje Analizi
                        </NavItem>
                        <NavItem href="/reports/finance" icon={Banknote} onClick={onElementClick}>
                            Finansal Analiz
                        </NavItem>
                        <NavItem href="/reports/activities" icon={CalendarCheck} onClick={onElementClick}>
                            Saha & Ekip Verimliliği
                        </NavItem>
                        <NavItem href="/admin/broker-leads/reports" icon={BarChart3} onClick={onElementClick}>
                            Broker Kazançları
                        </NavItem>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </nav>
    )
}
