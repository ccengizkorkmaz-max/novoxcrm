'use client'

import React from 'react'
import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Mail,
    Zap,
    Building2,
    Home,
    Users,
    Activity,
    Package,
    FileText,
    Banknote,
    Trophy,
    CalendarCheck,
    Briefcase,
    MessageSquare,
    Bell,
    BarChart3,
    Clock,
    Gift,
    Settings2,
    ChevronDown
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
    isSubItem?: boolean
}

function NavItem({ href, icon: Icon, children, onClick, isSubItem }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-1.5 transition-all text-[13px]",
                isActive
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20"
                    : isSubItem
                        ? "text-slate-500 hover:text-white hover:bg-slate-800"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-white" : isSubItem ? "text-slate-500" : "text-slate-400")} />
            {children}
        </Link>
    )
}

export function SidebarNav({ role = 'sales', onElementClick }: { role?: string | null, onElementClick?: () => void }) {
    const t = useTranslations('Sidebar')
    const currentRole = role || 'sales'

    const isManager = currentRole === 'manager' || currentRole === 'owner' || currentRole === 'admin'
    const isOwner = currentRole === 'owner' || currentRole === 'admin'

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-0.5 pb-8">
            <NavItem href="/" icon={LayoutDashboard} onClick={onElementClick}>
                {t('overview')}
            </NavItem>
            <NavItem href="/inbox" icon={Mail} onClick={onElementClick}>
                {t('inbox')}
            </NavItem>
            <NavItem href="/quick-crm" icon={Zap} onClick={onElementClick}>
                {t('quickCRM')}
            </NavItem>
            <NavItem href="/projects" icon={Building2} onClick={onElementClick}>
                {t('projects')}
            </NavItem>
            <NavItem href="/inventory" icon={Home} onClick={onElementClick}>
                {t('inventory')}
            </NavItem>
            <NavItem href="/customers" icon={Users} onClick={onElementClick}>
                {t('customers')}
            </NavItem>

            {isManager && (
                <NavItem href="/teams" icon={Users} onClick={onElementClick}>
                    {t('salesTeams')}
                </NavItem>
            )}

            <NavItem href="/crm" icon={Activity} onClick={onElementClick}>
                {t('salesManagement')}
            </NavItem>
            <NavItem href="/options" icon={Package} onClick={onElementClick}>
                {t('options')}
            </NavItem>
            <NavItem href="/offers" icon={FileText} onClick={onElementClick}>
                {t('offers')}
            </NavItem>
            <NavItem href="/contracts" icon={FileText} onClick={onElementClick}>
                {t('contracts')}
            </NavItem>
            <NavItem href="/finance/deposits" icon={Banknote} onClick={onElementClick}>
                {t('deposits')}
            </NavItem>
            <NavItem href="/commissions" icon={Trophy} onClick={onElementClick}>
                {t('commissions')}
            </NavItem>
            <NavItem href="/activities" icon={CalendarCheck} onClick={onElementClick}>
                {t('activities')}
            </NavItem>
            <NavItem href="/finance" icon={Banknote} onClick={onElementClick}>
                {t('finance')}
            </NavItem>
            {isOwner && (
                <NavItem href="/hr" icon={Briefcase} onClick={onElementClick}>
                    {t('hr')}
                </NavItem>
            )}
            <NavItem href="/customer-support" icon={MessageSquare} onClick={onElementClick}>
                {t('serviceRequests')}
            </NavItem>

            {isManager && (
                <Accordion type="multiple" className="w-full border-none">
                    {/* B2B Broker Management Section */}
                    <AccordionItem value="broker" className="border-none">
                        <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                            <Users className="h-4 w-4" />
                            <span>{t('broker.title')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                            <NavItem href="/admin/broker-applications" icon={Clock} onClick={onElementClick} isSubItem>
                                {t('broker.management')}
                            </NavItem>
                            <NavItem href="/admin/broker-leads" icon={Users} onClick={onElementClick} isSubItem>
                                {t('broker.leads')}
                            </NavItem>
                            <NavItem href="/admin/broker-leads/campaigns" icon={Gift} onClick={onElementClick} isSubItem>
                                {t('broker.campaigns')}
                            </NavItem>
                            {isOwner && (
                                <NavItem href="/admin/broker-leads/commission-settings" icon={Settings2} onClick={onElementClick} isSubItem>
                                    {t('broker.commission')}
                                </NavItem>
                            )}
                            <NavItem href="/admin/broker-finances" icon={Banknote} onClick={onElementClick} isSubItem>
                                {t('broker.finance')}
                            </NavItem>
                            <NavItem href="/admin/broker-leads/levels" icon={Trophy} onClick={onElementClick} isSubItem>
                                {t('broker.levels')}
                            </NavItem>
                        </AccordionContent>
                    </AccordionItem>

                    {/* Reports Section */}
                    <AccordionItem value="reports" className="border-none">
                        <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                            <BarChart3 className="h-4 w-4" />
                            <span>{t('reports.title')}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                            <NavItem href="/reports/sales" icon={Activity} onClick={onElementClick} isSubItem>
                                {t('reports.sales')}
                            </NavItem>
                            <NavItem href="/reports/inventory" icon={Building2} onClick={onElementClick} isSubItem>
                                {t('reports.inventory')}
                            </NavItem>
                            <NavItem href="/reports/finance" icon={Banknote} onClick={onElementClick} isSubItem>
                                {t('reports.finance')}
                            </NavItem>
                            <NavItem href="/admin/broker-leads/reports" icon={BarChart3} onClick={onElementClick} isSubItem>
                                {t('broker.earnings')}
                            </NavItem>
                            <NavItem href="/reports/public-links" icon={Building2} onClick={onElementClick} isSubItem>
                                {t('reports.publicLinks')}
                            </NavItem>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </nav>
    )
}
