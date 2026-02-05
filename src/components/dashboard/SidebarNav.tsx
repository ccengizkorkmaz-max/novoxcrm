'use client'

import React from 'react'

import { Link, usePathname } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
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
    Clock,
    Zap,
    Mail
} from 'lucide-react'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

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
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                isActive
                    ? "bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
        >
            <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
            {children}
        </Link>
    )
}

export function SidebarNav({ onElementClick }: { onElementClick?: () => void }) {
    const t = useTranslations('Sidebar')
    const [role, setRole] = React.useState<string | null>(null)

    React.useEffect(() => {
        // Fetch role client-side since this is a client component
        const fetchRole = async () => {
            const supabase = (await import('@/lib/supabase/client')).createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setRole(profile?.role || 'sales')
            }
        }
        fetchRole()
    }, [])

    if (!role) return null // or skeleton

    const isManager = role === 'manager' || role === 'owner' || role === 'admin'
    const isOwner = role === 'owner' || role === 'admin'

    return (
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            <NavItem href="/" icon={LayoutDashboard} onClick={onElementClick}>
                {t('overview')}
            </NavItem>
            <NavItem href="/inbox" icon={Mail} onClick={onElementClick}>
                {t('inbox')}
            </NavItem>
            {/* ... Quick CRM, Projects, Inventory etc are common ... */}
            <NavItem href="/quick-crm" icon={Zap} onClick={onElementClick}>
                <span className="flex items-center gap-2">
                    {t('quickCRM')}
                    <Badge className="h-4 px-1 text-[8px] bg-yellow-500 hover:bg-yellow-600">NEW</Badge>
                </span>
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

            {/* Manager Only: Teams */}
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
            <NavItem href="/activities" icon={CalendarCheck} onClick={onElementClick}>
                {t('activities')}
            </NavItem>
            <NavItem href="/customer-support" icon={MessageSquare} onClick={onElementClick}>
                {t('serviceRequests')}
            </NavItem>

            {/* Broker & Reports: Manager Only */}
            {isManager && (
                <>
                    <Accordion type="multiple" className="w-full border-none">
                        <AccordionItem value="broker" className="border-none">
                            <AccordionTrigger className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start">
                                <div className="flex items-center gap-3 whitespace-nowrap">
                                    <Users className="h-4 w-4" />
                                    <span>{t('broker.title')}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-4 grid gap-1">
                                <NavItem href="/admin/broker-applications" icon={Clock} onClick={onElementClick}>
                                    {t('broker.management')}
                                </NavItem>
                                <NavItem href="/admin/broker-leads" icon={Users} onClick={onElementClick}>
                                    {t('broker.leads')}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/campaigns" icon={Gift} onClick={onElementClick}>
                                    {t('broker.campaigns')}
                                </NavItem>
                                {isOwner && (
                                    <NavItem href="/admin/broker-leads/commission-settings" icon={Settings2} onClick={onElementClick}>
                                        {t('broker.commission')}
                                    </NavItem>
                                )}
                                <NavItem href="/admin/broker-finances" icon={Banknote} onClick={onElementClick}>
                                    {t('broker.finance')}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/levels" icon={Trophy} onClick={onElementClick}>
                                    {t('broker.levels')}
                                </NavItem>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="reports" className="border-none">
                            <AccordionTrigger className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hover:no-underline [&[data-state=open]]:text-white font-medium justify-start">
                                <div className="flex items-center gap-3 whitespace-nowrap">
                                    <BarChart3 className="h-4 w-4" />
                                    <span>{t('reports.title')}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-1 pb-2 pl-4 grid gap-1">
                                <NavItem href="/reports/sales" icon={Activity} onClick={onElementClick}>
                                    {t('reports.sales')}
                                </NavItem>
                                <NavItem href="/reports/inventory" icon={Building2} onClick={onElementClick}>
                                    {t('reports.inventory')}
                                </NavItem>
                                <NavItem href="/reports/finance" icon={Banknote} onClick={onElementClick}>
                                    {t('reports.finance')}
                                </NavItem>
                                <NavItem href="/reports/activities" icon={CalendarCheck} onClick={onElementClick}>
                                    {t('reports.efficiency')}
                                </NavItem>
                                <NavItem href="/admin/broker-leads/reports" icon={BarChart3} onClick={onElementClick}>
                                    {t('broker.earnings')}
                                </NavItem>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </>
            )}

            {/* Settings: Owner Only (Or Manager but limited, here we hide top level settings link if exists, 
                usually settings is in user menu but if it's here: )*/}
            {/* Sidebar typically doesn't have settings, it's in the footer or user menu. 
                 But if we added one, we'd guard it here. */}
        </nav>
    )
}
