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
    DollarSign,
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
    Medal,
    Globe,
    Phone,
    MessageCircle,
    Flame,
    Brain,
    AlertTriangle
} from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItemProps {
    href: string
    icon: React.ElementType
    children: React.ReactNode
    onClick?: () => void
    isSubItem?: boolean
    isCollapsed?: boolean
}

function NavItem({ href, icon: Icon, children, onClick, isSubItem, isCollapsed }: NavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === href

    const content = (
        <Link
            href={href}
            onClick={onClick}
            className={cn(
                "flex items-center transition-all text-[13px] rounded-lg",
                isCollapsed 
                    ? "justify-center h-9 w-9 px-0 py-0 mx-auto" 
                    : "gap-3 px-3 py-1.5",
                isActive
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20"
                    : isSubItem
                        ? "text-slate-500 hover:text-white hover:bg-slate-800"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
        >
            <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-white" : isSubItem ? "text-slate-500" : "text-slate-400")} />
            {!isCollapsed && children}
        </Link>
    )

    if (isCollapsed) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-slate-900 text-white border-slate-800 text-xs">
                    {children}
                </TooltipContent>
            </Tooltip>
        )
    }

    return content
}

export function NovoxSidebar({
    role = 'sales',
    onElementClick,
    labels,
    tenantType = 'developer',
    hasBrokerModule = false,
    hasOutreachModule = false,
    isCollapsed = false
}: {
    role?: string | null,
    onElementClick?: () => void,
    labels: any,
    tenantType?: string,
    hasBrokerModule?: boolean,
    hasOutreachModule?: boolean,
    isCollapsed?: boolean
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
        <nav className={cn("grid items-start px-2 text-sm font-medium gap-0.5 pb-8", isCollapsed ? "px-1" : "lg:px-4")}>
            <NavItem href="/" icon={LayoutDashboard} onClick={onElementClick} isCollapsed={isCollapsed}>
                {labels.overview || 'Overview'}
            </NavItem>
            {isManager && !isBroker && (
                <NavItem href="/inbox" icon={Mail} onClick={onElementClick} isCollapsed={isCollapsed}>
                    {labels.inbox || 'Inbox'}
                </NavItem>
            )}
            {!isBroker && (
                <NavItem href="/conversations" icon={MessageSquare} onClick={onElementClick} isCollapsed={isCollapsed}>
                    {labels.conversations || 'Conversations'}
                </NavItem>
            )}
            {!isBroker && (
                <NavItem href="/lead-qualification" icon={Target} onClick={onElementClick} isCollapsed={isCollapsed}>
                    Ön Değerlendirme
                </NavItem>
            )}
            {!isBroker && (
                <NavItem href="/quick-crm" icon={Zap} onClick={onElementClick} isCollapsed={isCollapsed}>
                    {labels.quickCRM || 'Quick CRM'}
                </NavItem>
            )}

            {/* ======== DEVELOPER (MÜTEAHHİT) MENÜSÜ ======== */}
            {isDeveloper && (
                isCollapsed ? (
                    <>
                        <NavItem href="/projects" icon={Building2} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.projects || 'Projects'}
                        </NavItem>
                        <NavItem href="/inventory" icon={Home} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.inventory || 'Inventory'}
                        </NavItem>
                    </>
                ) : (
                    <Accordion type="multiple" className="w-full border-none">
                        <AccordionItem value="project_module" className="border-none">
                            <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                                <Building2 className="h-4 w-4" />
                                <span>Proje & Envanter</span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                                <NavItem href="/projects" icon={Building2} onClick={onElementClick} isSubItem>
                                    {labels.projects || 'Projects'}
                                </NavItem>
                                <NavItem href="/inventory" icon={Home} onClick={onElementClick} isSubItem>
                                    {labels.inventory || 'Inventory'}
                                </NavItem>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            )}

            {/* ======== BROKER (ACENTE) MENÜSÜ ======== */}
            {isBroker && (
                <>
                    <NavItem href="/portfolios" icon={MapPin} onClick={onElementClick} isCollapsed={isCollapsed}>
                        {labels.brokerMenu?.portfolios || 'Portföyler'}
                    </NavItem>
                    {isManager && (
                        <NavItem href="/lead-pool" icon={Target} onClick={onElementClick} isCollapsed={isCollapsed}>
                            {labels.brokerMenu?.leadPool || 'Talep Havuzu'}
                        </NavItem>
                    )}
                    {isManager && (
                        <NavItem href="/analytics" icon={BarChart3} onClick={onElementClick} isCollapsed={isCollapsed}>
                            Raporlar
                        </NavItem>
                    )}
                    {isManager && (
                        <NavItem href="/commission-plans" icon={Banknote} onClick={onElementClick} isCollapsed={isCollapsed}>
                            Komisyon Planları
                        </NavItem>
                    )}
                    {isManager && (
                        <NavItem href="/marketing" icon={Mail} onClick={onElementClick} isCollapsed={isCollapsed}>
                            Pazarlama
                        </NavItem>
                    )}
                    {isManager && (
                        <NavItem href="/portal-integrations" icon={Globe} onClick={onElementClick} isCollapsed={isCollapsed}>
                            Portallar
                        </NavItem>
                    )}
                    <NavItem href="/agent-website" icon={UserCheck} onClick={onElementClick} isCollapsed={isCollapsed}>
                        Web Sitem
                    </NavItem>
                    <NavItem href="/training" icon={Trophy} onClick={onElementClick} isCollapsed={isCollapsed}>
                        Eğitimler
                    </NavItem>
                </>
            )}

            {/* ======== ORTAK MENÜ ÖĞELERİ ======== */}
            
            {isCollapsed ? (
                <>
                    {isBroker ? (
                        <>
                            <NavItem href="/contacts" icon={Users} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                Kişiler
                            </NavItem>
                            <NavItem href="/broker-contracts" icon={FileText} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                Sözleşmeler
                            </NavItem>
                        </>
                    ) : (
                        <NavItem href="/customers" icon={Users} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.customers || 'Customers'}
                        </NavItem>
                    )}

                    {isManager && (
                        <NavItem href="/teams" icon={Users} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {isBroker ? 'Danışmanlar' : (labels.salesTeams || 'Sales Teams')}
                        </NavItem>
                    )}

                    {isSales && !isBroker && (
                        <>
                            <NavItem href="/crm" icon={Activity} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                {labels.salesManagement || 'Sales Management'}
                            </NavItem>

                            {isDeveloper && (
                                <>
                                    <NavItem href="/options" icon={Package} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                        {labels.options || 'Options'}
                                    </NavItem>
                                    <NavItem href="/offers" icon={FileText} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                        {labels.offers || 'Offers'}
                                    </NavItem>
                                    <NavItem href="/contracts" icon={FileText} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                        {labels.contracts || 'Contracts'}
                                    </NavItem>
                                    <NavItem href="/finance/deposits" icon={Banknote} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                        {labels.deposits || 'Deposits'}
                                    </NavItem>
                                </>
                            )}
                        </>
                    )}
                </>
            ) : (
                <Accordion type="multiple" className="w-full border-none">
                    <AccordionItem value="crm_module" className="border-none">
                        <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                            <Activity className="h-4 w-4" />
                            <span>CRM</span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                            {isBroker ? (
                                <>
                                    <NavItem href="/contacts" icon={Users} onClick={onElementClick} isSubItem>
                                        Kişiler
                                    </NavItem>
                                    <NavItem href="/broker-contracts" icon={FileText} onClick={onElementClick} isSubItem>
                                        Sözleşmeler
                                    </NavItem>
                                </>
                            ) : (
                                <NavItem href="/customers" icon={Users} onClick={onElementClick} isSubItem>
                                    {labels.customers || 'Customers'}
                                </NavItem>
                            )}

                            {isManager && (
                                <NavItem href="/teams" icon={Users} onClick={onElementClick} isSubItem>
                                    {isBroker ? 'Danışmanlar' : (labels.salesTeams || 'Sales Teams')}
                                </NavItem>
                            )}

                            {isSales && !isBroker && (
                                <>
                                    <NavItem href="/crm" icon={Activity} onClick={onElementClick} isSubItem>
                                        {labels.salesManagement || 'Sales Management'}
                                    </NavItem>

                                    {/* Developer'a özel satış adımları */}
                                    {isDeveloper && (
                                        <>
                                            <NavItem href="/options" icon={Package} onClick={onElementClick} isSubItem>
                                                {labels.options || 'Options'}
                                            </NavItem>
                                            <NavItem href="/offers" icon={FileText} onClick={onElementClick} isSubItem>
                                                {labels.offers || 'Offers'}
                                            </NavItem>
                                            <NavItem href="/contracts" icon={FileText} onClick={onElementClick} isSubItem>
                                                {labels.contracts || 'Contracts'}
                                            </NavItem>
                                            <NavItem href="/finance/deposits" icon={Banknote} onClick={onElementClick} isSubItem>
                                                {labels.deposits || 'Deposits'}
                                            </NavItem>
                                        </>
                                    )}
                                </>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}

            {isSales && (
                <>
                    {isBroker && (
                        <>
                            <NavItem href="/agent-transactions" icon={UserCheck} onClick={onElementClick} isCollapsed={isCollapsed}>
                                {labels.brokerMenu?.agentTransactions || 'Hak Edişler'}
                            </NavItem>
                            <NavItem href="/leaderboard" icon={Medal} onClick={onElementClick} isCollapsed={isCollapsed}>
                                {labels.brokerMenu?.leaderboard || 'Sıralama'}
                            </NavItem>
                        </>
                    )}

                    <NavItem href="/activities" icon={CalendarCheck} onClick={onElementClick} isCollapsed={isCollapsed}>
                        {labels.activities || 'Activities'}
                    </NavItem>
                    {isManager && (
                        isCollapsed ? (
                            <>
                                <NavItem href="/outreach" icon={Phone} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    Workflow&apos;lar
                                </NavItem>
                                <NavItem href="/outreach/ai-caller" icon={MessageCircle} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    AI Arama
                                </NavItem>
                                <NavItem href="/outreach/segments" icon={Target} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    Segmentler
                                </NavItem>
                                <NavItem href="/outreach/reports" icon={BarChart3} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    Outreach Raporu
                                </NavItem>
                            </>
                        ) : (
                            <Accordion type="multiple" className="w-full border-none">
                                <AccordionItem value="outreach_module" className="border-none">
                                    <AccordionTrigger className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start text-[13px] gap-3">
                                        <Phone className="h-4 w-4" />
                                        <span>{labels.outreach || 'Outreach'}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-1 pb-2 pl-4 grid gap-0.5">
                                        <NavItem href="/outreach" icon={Phone} onClick={onElementClick} isSubItem>
                                            Workflow&apos;lar
                                        </NavItem>
                                        <NavItem href="/outreach/ai-caller" icon={MessageCircle} onClick={onElementClick} isSubItem>
                                            AI Arama
                                        </NavItem>
                                        <NavItem href="/outreach/segments" icon={Target} onClick={onElementClick} isSubItem>
                                            Segmentler
                                        </NavItem>
                                        <NavItem href="/outreach/reports" icon={BarChart3} onClick={onElementClick} isSubItem>
                                            Outreach Raporu
                                        </NavItem>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )
                    )}
                </>
            )}

            {isManager && (
                <>
                    {isDeveloper && (
                        <NavItem href="/commissions" icon={Trophy} onClick={onElementClick} isCollapsed={isCollapsed}>
                            {labels.commissions || 'Commissions'}
                        </NavItem>
                    )}
                    <NavItem href="/finance" icon={Banknote} onClick={onElementClick} isCollapsed={isCollapsed}>
                        {labels.finance || 'Finance'}
                    </NavItem>
                </>
            )}

            {isOwner && (
                <NavItem href="/hr" icon={Briefcase} onClick={onElementClick} isCollapsed={isCollapsed}>
                    {labels.hr || 'HR'}
                </NavItem>
            )}

            {isBroker && isOwner && (
                <NavItem href="/integrations" icon={Zap} onClick={onElementClick} isCollapsed={isCollapsed}>
                    {labels.brokerMenu?.webhooks || 'Entegrasyonlar'}
                </NavItem>
            )}

            <NavItem href="/customer-support" icon={MessageSquare} onClick={onElementClick} isCollapsed={isCollapsed}>
                {labels.serviceRequests || 'Service Requests'}
            </NavItem>

            {isManager && (
                isCollapsed ? (
                    <>
                        {hasBrokerModule && (
                            <>
                                <NavItem href="/admin/broker-applications" icon={Clock} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    {labels.broker?.management || 'Management'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads" icon={Users} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    {labels.broker?.leads || 'Leads'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/campaigns" icon={Gift} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    {labels.broker?.campaigns || 'Campaigns'}
                                </NavItem>
                                {isOwner && (
                                    <NavItem href="/admin/broker-leads/commission-settings" icon={Settings2} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                        {labels.broker?.commission || 'Commission Settings'}
                                    </NavItem>
                                )}
                                <NavItem href="/admin/broker-finances" icon={Banknote} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    {labels.broker?.finance || 'Finance'}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/levels" icon={Trophy} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                    {labels.broker?.levels || 'Levels'}
                                </NavItem>
                            </>
                        )}
                        <NavItem href="/reports/sales" icon={Activity} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.sales || 'Sales Performance'}
                        </NavItem>
                        {isDeveloper && (
                            <NavItem href="/reports/inventory" icon={Building2} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                {labels.reports?.inventory || 'Inventory & Project'}
                            </NavItem>
                        )}
                        <NavItem href="/reports/finance" icon={Banknote} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.finance || 'Financial Analysis'}
                        </NavItem>
                        {hasBrokerModule && (
                            <NavItem href="/admin/broker-leads/reports" icon={BarChart3} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                                {labels.broker?.earnings || 'Broker Earnings'}
                            </NavItem>
                        )}
                        <NavItem href="/reports/public-links" icon={Building2} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.publicLinks || 'Public Links'}
                        </NavItem>
                        <NavItem href="/reports/marketing" icon={BarChart3} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.marketing || 'Marketing Analytics'}
                        </NavItem>
                        <NavItem href="/reports/hot-leads" icon={Flame} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.hotLeads || 'Sıcak Lead Analizi'}
                        </NavItem>
                        <NavItem href="/reports/outreach-ceo" icon={BarChart3} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.outreachCeo || 'Outreach CEO Raporu'}
                        </NavItem>
                        <NavItem href="/reports/outreach-cost" icon={DollarSign} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.outreachCost || 'Outreach Maliyet Analizi'}
                        </NavItem>
                        <NavItem href="/reports/meta-automation" icon={Zap} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {labels.reports?.metaAutomation || 'Meta Ads & Otomasyon Sağlığı'}
                        </NavItem>
                        <NavItem href="/reports/ai-feedback" icon={Brain} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {'AI Geri Bildirim'}
                        </NavItem>
                        <NavItem href="/reports/activity-tracking" icon={AlertTriangle} onClick={onElementClick} isCollapsed={isCollapsed} isSubItem>
                            {'Aktivite Takip'}
                        </NavItem>
                    </>
                ) : (
                    <Accordion type="multiple" className="w-full border-none">
                        {/* B2B Broker Management Section - Sadece lisanslı olanlara göster */}
                        {hasBrokerModule && (
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
                                {hasBrokerModule && (
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
                                <NavItem href="/reports/hot-leads" icon={Flame} onClick={onElementClick} isSubItem>
                                    {labels.reports?.hotLeads || 'Sıcak Lead Analizi'}
                                </NavItem>
                                <NavItem href="/reports/outreach-ceo" icon={BarChart3} onClick={onElementClick} isSubItem>
                                    {labels.reports?.outreachCeo || 'Outreach CEO Raporu'}
                                </NavItem>
                                <NavItem href="/reports/outreach-cost" icon={DollarSign} onClick={onElementClick} isSubItem>
                                    {labels.reports?.outreachCost || 'Outreach Maliyet Analizi'}
                                </NavItem>
                                <NavItem href="/reports/meta-automation" icon={Zap} onClick={onElementClick} isSubItem>
                                    {labels.reports?.metaAutomation || 'Meta Ads & Otomasyon Sağlığı'}
                                </NavItem>
                                <NavItem href="/reports/ai-feedback" icon={Brain} onClick={onElementClick} isSubItem>
                                    {'AI Geri Bildirim'}
                                </NavItem>
                                <NavItem href="/reports/activity-tracking" icon={AlertTriangle} onClick={onElementClick} isSubItem>
                                    {'Aktivite Takip'}
                                </NavItem>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )
            )}
        </nav>
    )
}
