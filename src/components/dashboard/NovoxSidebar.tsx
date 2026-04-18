'use client'

import React from 'react'
import { Link, usePathname } from '@/i18n/routing'
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
    ChevronDown,
    MapPin,
    Target,
    UserCheck,
    Medal
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

export function NovoxSidebar({
    role = 'sales',
    onElementClick,
    labels,
    tenantType = 'developer'
}: {
    role?: string | null,
    onElementClick?: () => void,
    labels: any,
    tenantType?: string
}) {
    const currentRole = role || 'sales'

    const isManager = currentRole === 'manager' || currentRole === 'owner' || currentRole === 'admin'
    const isSales = isManager || currentRole === 'sales' || currentRole === 'user'
    const isOwner = currentRole === 'owner' || currentRole === 'admin'

    const isDeveloper = tenantType === 'developer'
    const isBroker = tenantType === 'broker'

    // Safety check for labels
    if (!labels) return null;

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-0.5 pb-8">
            <NavItem href="/" icon={LayoutDashboard} onClick={onElementClick}>
                {labels.overview || 'Overview'}
            </NavItem>
            {isManager && (
                <NavItem href="/inbox" icon={Mail} onClick={onElementClick}>
                    {labels.inbox || 'Inbox'}
                </NavItem>
            )}
            <NavItem href="/conversations" icon={MessageSquare} onClick={onElementClick}>
                {labels.conversations || 'Conversations'}
            </NavItem>
            <NavItem href="/quick-crm" icon={Zap} onClick={onElementClick}>
                {labels.quickCRM || 'Quick CRM'}
            </NavItem>

            {/* ======== DEVELOPER (MÜTEAHHİT) MENÜSÜ ======== */}
            {isDeveloper && (
                <>
                    <NavItem href="/projects" icon={Building2} onClick={onElementClick}>
                        {labels.projects || 'Projects'}
                    </NavItem>
                    <NavItem href="/inventory" icon={Home} onClick={onElementClick}>
                        {labels.inventory || 'Inventory'}
                    </NavItem>
                </>
            )}

            {/* ======== BROKER (ACENTE) MENÜSÜ ======== */}
            {isBroker && (
                <>
                    <NavItem href="/portfolios" icon={MapPin} onClick={onElementClick}>
                        {labels.brokerMenu?.portfolios || 'Portföyler'}
                    </NavItem>
                    {isManager && (
                        <NavItem href="/lead-pool" icon={Target} onClick={onElementClick}>
                            {labels.brokerMenu?.leadPool || 'Talep Havuzu'}
                        </NavItem>
                    )}
                </>
            )}

            {/* ======== ORTAK MENÜ ÖĞELERİ ======== */}
            <NavItem href="/customers" icon={Users} onClick={onElementClick}>
                {labels.customers || 'Customers'}
            </NavItem>

            {isManager && (
                <NavItem href="/teams" icon={Users} onClick={onElementClick}>
                    {labels.salesTeams || 'Sales Teams'}
                </NavItem>
            )}

            {isSales && (
                <>
                    <NavItem href="/crm" icon={Activity} onClick={onElementClick}>
                        {labels.salesManagement || 'Sales Management'}
                    </NavItem>

                    {/* Developer'a özel satış adımları */}
                    {isDeveloper && (
                        <>
                            <NavItem href="/options" icon={Package} onClick={onElementClick}>
                                {labels.options || 'Options'}
                            </NavItem>
                            <NavItem href="/offers" icon={FileText} onClick={onElementClick}>
                                {labels.offers || 'Offers'}
                            </NavItem>
                            <NavItem href="/contracts" icon={FileText} onClick={onElementClick}>
                                {labels.contracts || 'Contracts'}
                            </NavItem>
                            <NavItem href="/finance/deposits" icon={Banknote} onClick={onElementClick}>
                                {labels.deposits || 'Deposits'}
                            </NavItem>
                        </>
                    )}

                    {isBroker && (
                        <>
                            <NavItem href="/agent-transactions" icon={UserCheck} onClick={onElementClick}>
                                {labels.brokerMenu?.agentTransactions || 'Hak Edişler'}
                            </NavItem>
                            <NavItem href="/leaderboard" icon={Medal} onClick={onElementClick}>
                                {labels.brokerMenu?.leaderboard || 'Sıralama'}
                            </NavItem>
                        </>
                    )}

                    <NavItem href="/activities" icon={CalendarCheck} onClick={onElementClick}>
                        {labels.activities || 'Activities'}
                    </NavItem>
                </>
            )}

            {isManager && (
                <>
                    {isDeveloper && (
                        <NavItem href="/commissions" icon={Trophy} onClick={onElementClick}>
                            {labels.commissions || 'Commissions'}
                        </NavItem>
                    )}
                    <NavItem href="/finance" icon={Banknote} onClick={onElementClick}>
                        {labels.finance || 'Finance'}
                    </NavItem>
                </>
            )}

            {isOwner && (
                <NavItem href="/hr" icon={Briefcase} onClick={onElementClick}>
                    {labels.hr || 'HR'}
                </NavItem>
            )}

            {isBroker && isOwner && (
                <NavItem href="/integrations" icon={Zap} onClick={onElementClick}>
                    {labels.brokerMenu?.webhooks || 'Entegrasyonlar'}
                </NavItem>
            )}

            <NavItem href="/customer-support" icon={MessageSquare} onClick={onElementClick}>
                {labels.serviceRequests || 'Service Requests'}
            </NavItem>

            {isManager && (
                <Accordion type="multiple" className="w-full border-none">
                    {/* B2B Broker Management Section - sadece Developer'lara göster */}
                    {isDeveloper && (
                        <AccordionItem value="broker" className="border-none">
                            <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                                <Users className="h-4 w-4" />
                                <span>{labels.broker?.title || 'Broker Management'}</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                                <NavItem href="/admin/broker-applications" icon={Clock} onClick={onElementClick} isSubItem>
                                    {labels.broker?.management || 'Management'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads" icon={Users} onClick={onElementClick} isSubItem>
                                    {labels.broker?.leads || 'Leads'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/campaigns" icon={Gift} onClick={onElementClick} isSubItem>
                                    {labels.broker?.campaigns || 'Campaigns'}
                                </NavItem>
                                {isOwner && (
                                    <NavItem href="/admin/broker-leads/commission-settings" icon={Settings2} onClick={onElementClick} isSubItem>
                                        {labels.broker?.commission || 'Commission Settings'}
                                    </NavItem>
                                )}
                                <NavItem href="/admin/broker-finances" icon={Banknote} onClick={onElementClick} isSubItem>
                                    {labels.broker?.finance || 'Finance'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/levels" icon={Trophy} onClick={onElementClick} isSubItem>
                                    {labels.broker?.levels || 'Levels'}
                                </NavItem>
                            </AccordionContent>
                        </AccordionItem>
                    )}

                    {/* Reports Section */}
                    <AccordionItem value="reports" className="border-none">
                        <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                            <BarChart3 className="h-4 w-4" />
                            <span>{labels.reports?.title || 'Reports'}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                            <NavItem href="/reports/sales" icon={Activity} onClick={onElementClick} isSubItem>
                                {labels.reports?.sales || 'Sales Performance'}
                            </NavItem>
                            {isDeveloper && (
                                <NavItem href="/reports/inventory" icon={Building2} onClick={onElementClick} isSubItem>
                                    {labels.reports?.inventory || 'Inventory & Project'}
                                </NavItem>
                            )}
                            <NavItem href="/reports/finance" icon={Banknote} onClick={onElementClick} isSubItem>
                                {labels.reports?.finance || 'Financial Analysis'}
                            </NavItem>
                            {isDeveloper && (
                                <NavItem href="/admin/broker-leads/reports" icon={BarChart3} onClick={onElementClick} isSubItem>
                                    {labels.broker?.earnings || 'Broker Earnings'}
                                </NavItem>
                            )}
                            <NavItem href="/reports/public-links" icon={Building2} onClick={onElementClick} isSubItem>
                                {labels.reports?.publicLinks || 'Public Links'}
                            </NavItem>
                            <NavItem href="/reports/marketing" icon={BarChart3} onClick={onElementClick} isSubItem>
                                {labels.reports?.marketing || 'Marketing Analytics'}
                            </NavItem>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}
        </nav>
    )
}

